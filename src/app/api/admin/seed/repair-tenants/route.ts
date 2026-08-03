import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { getTenantDomain } from '@/lib/tenant';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Category from '@/models/Category';
import Expense from '@/models/Expense';
import User from '@/models/User';
import GlobalSettings from '@/models/GlobalSettings';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only super_admin can run the repair tool
    if (!session || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ message: 'Unauthorized. Super Admin access required.' }, { status: 401 });
    }

    await connectToDatabase();
    const domain = await getTenantDomain();

    if (!domain || domain === 'unknown') {
      return NextResponse.json({ message: 'Invalid tenant domain detected.' }, { status: 400 });
    }

    console.log(`Starting Repair for Domain: ${domain}...`);

    // 1. Update Products
    const productUpdate = await Product.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    // 2. Update Orders
    const orderUpdate = await Order.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    // 3. Update Categories
    const categoryUpdate = await Category.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    // 4. Update Expenses
    const expenseUpdate = await Expense.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    // 5. Update Users
    const userUpdate = await User.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    // 6. Update Global Settings
    // Special case: Ensure settings have a domain or create one if missing
    const settingsUpdate = await GlobalSettings.updateMany(
      { $or: [{ domain: { $exists: false } }, { domain: 'unknown' }, { domain: '' }] },
      { $set: { domain: domain } }
    );

    return NextResponse.json({
      message: 'Tenant repair completed successfully.',
      domain,
      results: {
        products: productUpdate.modifiedCount,
        orders: orderUpdate.modifiedCount,
        categories: categoryUpdate.modifiedCount,
        expenses: expenseUpdate.modifiedCount,
        users: userUpdate.modifiedCount,
        settings: settingsUpdate.modifiedCount,
      }
    });

  } catch (error: any) {
    console.error('Repair Tool Error:', error);
    return NextResponse.json({ message: 'Repair failed', error: error.message }, { status: 500 });
  }
}

