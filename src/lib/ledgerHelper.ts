import connectToDatabase from '@/lib/db';
import LedgerAccount from '@/models/LedgerAccount';
import LedgerTransaction from '@/models/LedgerTransaction';
import { getTenantDomain } from '@/lib/tenant';

/**
 * Seed primary ledger accounts if they do not exist
 */
export async function seedLedgerAccounts() {
  await connectToDatabase();
  const domain = await getTenantDomain();

  const accounts: { name: string; code: 'CASH' | 'BANK' | 'AR' | 'AP'; type: 'asset' | 'liability' }[] = [
    { name: 'Cash', code: 'CASH', type: 'asset' },
    { name: 'Bank', code: 'BANK', type: 'asset' },
    { name: 'Accounts Receivable', code: 'AR', type: 'asset' },
    { name: 'Accounts Payable', code: 'AP', type: 'liability' },
  ];

  for (const acc of accounts) {
    const exists = await LedgerAccount.findOne({ code: acc.code, domain });
    if (!exists) {
      await LedgerAccount.create({
        domain,
        name: acc.name,
        code: acc.code,
        type: acc.type,
        openingBalance: 0,
        currentBalance: 0,
      });
    }
  }
}

/**
 * Log a transaction to the ledger
 */
export async function logLedgerTransaction(
  accountCode: 'CASH' | 'BANK' | 'AR' | 'AP',
  type: 'debit' | 'credit',
  amount: number,
  description: string,
  reference?: string,
  date: Date = new Date()
) {
  await connectToDatabase();
  await seedLedgerAccounts();
  const domain = await getTenantDomain();

  // Find account
  const account = await LedgerAccount.findOne({ code: accountCode, domain });
  if (!account) {
    throw new Error(`Ledger account not found with code: ${accountCode}`);
  }

  // Calculate balanceAfter
  // For assets: debit increases, credit decreases
  // For liabilities: credit increases, debit decreases
  const change = account.type === 'liability'
    ? (type === 'credit' ? amount : -amount)
    : (type === 'debit' ? amount : -amount);
  const balanceAfter = account.currentBalance + change;

  // Create transaction
  const transaction = new LedgerTransaction({
    domain,
    account: account._id,
    date,
    description,
    type,
    amount,
    reference,
    balanceAfter,
  });

  await transaction.save();

  // Update current account balance
  account.currentBalance = balanceAfter;
  await account.save();

  return transaction;
}

/**
 * Recalculate ledger balance for an account
 */
export async function recalculateLedgerBalance(accountCode: 'CASH' | 'BANK' | 'AR' | 'AP') {
  await connectToDatabase();
  const domain = await getTenantDomain();
  const account = await LedgerAccount.findOne({ code: accountCode, domain });
  if (!account) return;

  const transactions = await LedgerTransaction.find({ account: account._id, domain }).sort({ date: 1, createdAt: 1 });

  let runningBalance = account.openingBalance || 0;

  for (const tx of transactions) {
    const change = account.type === 'liability'
      ? (tx.type === 'credit' ? tx.amount : -tx.amount)
      : (tx.type === 'debit' ? tx.amount : -tx.amount);
    runningBalance += change;
    tx.balanceAfter = runningBalance;
    await tx.save();
  }

  account.currentBalance = runningBalance;
  await account.save();
}

export async function logOrderPaymentToLedgerIdempotent(order: any) {
  await connectToDatabase();
  const accountCode = order.paymentMethod === 'Online' ? 'BANK' : 'CASH';
  
  const amount = order.totalAmount || 0;
  const orderIdStr = order._id.toString();
  const shortId = order.shortId || orderIdStr.slice(-8).toUpperCase();
  
  const description = `Customer payment received for Order #${shortId}`;
  const reference = `ORDER-${shortId}`;
  
  const exists = await LedgerTransaction.findOne({ reference });
  if (exists) {
    console.log(`[Ledger] Entry already exists for order reference: ${reference}`);
    return;
  }
  
  await logLedgerTransaction(
    accountCode,
    'debit',
    amount,
    description,
    reference,
    order.createdAt ? new Date(order.createdAt) : new Date()
  );
  console.log(`[Ledger] Logged payment for Order #${shortId} to ${accountCode} successfully.`);
}

export async function logOrderPaymentToLedger(order: any) {
  try {
    await logOrderPaymentToLedgerIdempotent(order);
  } catch (error) {
    console.error('[Ledger] Error logging order payment to ledger, queueing outbox:', error);
    try {
      await queueOutboxTask('ORDER_PAYMENT', { orderId: order._id.toString() });
    } catch (queueErr) {
      console.error('[Ledger] Critical: Failed to queue outbox task:', queueErr);
    }
  }
}

export async function queueOutboxTask(taskType: string, payload: any, session?: any) {
  const domain = await getTenantDomain();
  const OutboxTask = (await import('@/models/OutboxTask')).default;
  const task = new OutboxTask({
    domain,
    taskType,
    payload,
    attempts: 0,
    status: 'pending'
  });
  if (session) {
    await task.save({ session });
  } else {
    await task.save();
  }
  return task;
}

export async function processPendingOutboxTasks() {
  await connectToDatabase();
  const domain = await getTenantDomain();
  const OutboxTask = (await import('@/models/OutboxTask')).default;
  
  const tasks = await OutboxTask.find({
    domain,
    status: { $in: ['pending', 'failed'] },
    attempts: { $lt: 5 }
  });

  for (const task of tasks) {
    task.attempts += 1;
    try {
      if (task.taskType === 'ORDER_PAYMENT') {
        const Order = (await import('@/models/Order')).default;
        const order = await Order.findById(task.payload.orderId);
        if (order) {
          await logOrderPaymentToLedgerIdempotent(order);
        }
      } else if (task.taskType === 'EXPENSE_MUTATION') {
        const { action, expenseId, title, category, amount } = task.payload;
        if (action === 'DELETE') {
          await LedgerTransaction.deleteMany({ reference: expenseId, domain });
          await recalculateLedgerBalance('CASH');
        } else if (action === 'UPSERT') {
          await LedgerTransaction.deleteMany({ reference: expenseId, domain });
          await logLedgerTransaction(
            'CASH',
            'credit',
            amount,
            `Expense Paid: ${title} (${category})`,
            expenseId
          );
          await recalculateLedgerBalance('CASH');
        }
      }
      task.status = 'completed';
      task.error = undefined;
    } catch (err: any) {
      task.status = task.attempts >= 5 ? 'failed' : 'pending';
      task.error = err.message || String(err);
    }
    await task.save();
  }
}
