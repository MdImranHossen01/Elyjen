import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import LedgerTransaction from '@/models/LedgerTransaction';
import LedgerAccount from '@/models/LedgerAccount';
import { recalculateLedgerBalance } from '@/lib/ledgerHelper';
import { getTenantDomain } from '@/lib/tenant';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid transaction ID' }, { status: 400 });
    }

    const body = await req.json();
    const { amount, description, date, type, accountCode } = body;

    await connectToDatabase();
    const domain = await getTenantDomain();

    // Find the original transaction
    const transaction = await LedgerTransaction.findOne({ _id: id, domain }).populate('account');
    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    const oldAccount = transaction.account as any;
    let oldAccountCode = oldAccount?.code;

    // Update fields
    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = new Date(date);
    if (type !== undefined) transaction.type = type;

    let targetAccountCode = oldAccountCode;
    if (accountCode !== undefined && accountCode !== oldAccountCode) {
      const newAcc = await LedgerAccount.findOne({ code: accountCode, domain });
      if (!newAcc) {
        return NextResponse.json({ message: 'Target account not found' }, { status: 400 });
      }
      transaction.account = newAcc._id;
      targetAccountCode = accountCode;
    }

    await transaction.save();

    // Recalculate balances
    if (oldAccountCode) {
      await recalculateLedgerBalance(oldAccountCode);
    }
    if (targetAccountCode && targetAccountCode !== oldAccountCode) {
      await recalculateLedgerBalance(targetAccountCode);
    }

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Error updating ledger transaction:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid transaction ID' }, { status: 400 });
    }

    await connectToDatabase();
    const domain = await getTenantDomain();

    const transaction = await LedgerTransaction.findOne({ _id: id, domain }).populate('account');
    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    const account = transaction.account as any;
    const accountCode = account?.code;

    await LedgerTransaction.deleteOne({ _id: id, domain });

    if (accountCode) {
      await recalculateLedgerBalance(accountCode);
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting ledger transaction:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
