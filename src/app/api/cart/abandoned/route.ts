import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import AbandonedCart from '@/models/AbandonedCart';
import { getTenantDomain } from '@/lib/tenant';
import { format } from 'date-fns';

// GET all active abandoned carts (Admin/Manager only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'manager')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitParam = searchParams.get('limit') || '20';

    await connectToDatabase();
    const domain = await getTenantDomain();

    const query: any = { domain };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // CSV Streaming Export Path
    if (limitParam === 'all') {
      const headersList = [
        'Cart ID',
        'Date',
        'Customer Name',
        'Phone',
        'Email',
        'Address',
        'Area',
        'Items List',
        'Total Amount'
      ];
      
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode('\uFEFF' + headersList.join(',') + '\n'));
          
          let pageNum = 1;
          const pageSize = 100;
          let hasMore = true;
          
          while (hasMore) {
            const batchCarts = await AbandonedCart.find(query)
              .sort({ createdAt: -1 })
              .skip((pageNum - 1) * pageSize)
              .limit(pageSize)
              .populate('user', 'name email')
              .lean();
              
            if (batchCarts.length === 0) {
              hasMore = false;
              break;
            }
            
            for (const c of batchCarts as any[]) {
              const itemsText = c.items.map((i: any) => {
                const variantDesc = [i.color, i.size].filter(Boolean).join('/');
                return `• ${i.quantity} x ${i.name}${variantDesc ? ` [${variantDesc}]` : ''} (@৳${i.price})`;
              }).join('\n');
              
              const row = [
                c._id.toString().toUpperCase(),
                format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
                c.fullName || '',
                c.phone || '',
                c.email || 'N/A',
                c.street || 'N/A',
                c.deliveryArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
                itemsText,
                c.totalAmount || 0
              ];
              
              // Neutralize formula injection
              const csvRow = row.map((cell: any) => {
                let val = String(cell ?? '');
                if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
                  val = `'` + val;
                }
                return `"${val.replace(/"/g, '""')}"`;
              }).join(',') + '\n';
              
              controller.enqueue(encoder.encode(csvRow));
            }
            
            pageNum++;
            if (batchCarts.length < pageSize) {
              hasMore = false;
            }
          }
          controller.close();
        }
      });
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8;',
          'Content-Disposition': `attachment; filename=abandoned_carts_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
        }
      });
    }

    // Normal Pagination (Capped at 100 safe maximum)
    const limit = Math.min(100, Math.max(1, parseInt(limitParam)));
    const totalCount = await AbandonedCart.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const carts = await AbandonedCart.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email');

    return NextResponse.json({
      carts,
      totalPages,
      totalCount,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create/update an abandoned cart (Public checkout page)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartToken, fullName, phone, email, street, deliveryArea, items, totalAmount } = body;

    // Strict validation
    if (
      typeof fullName !== 'string' || fullName.trim().length === 0 || fullName.length > 100 ||
      typeof phone !== 'string' || phone.trim().length === 0 || phone.length > 20 ||
      (email !== undefined && email !== null && typeof email !== 'string') ||
      (email && email.length > 100) ||
      (street !== undefined && street !== null && typeof street !== 'string') ||
      (street && street.length > 500) ||
      (deliveryArea !== undefined && deliveryArea !== null && typeof deliveryArea !== 'string') ||
      (deliveryArea && deliveryArea.length > 50)
    ) {
      return NextResponse.json({ message: 'Invalid or malformed checkout details' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ message: 'Invalid items list' }, { status: 400 });
    }

    for (const item of items) {
      if (
        !item || typeof item !== 'object' ||
        typeof item.name !== 'string' || item.name.length > 200 ||
        !mongoose.Types.ObjectId.isValid(item.product) ||
        typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 100 ||
        typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0
      ) {
        return NextResponse.json({ message: 'Invalid item parameters' }, { status: 400 });
      }
    }

    if (typeof totalAmount !== 'number' || !Number.isFinite(totalAmount) || totalAmount < 0) {
      return NextResponse.json({ message: 'Invalid total amount' }, { status: 400 });
    }

    await connectToDatabase();
    const domain = await getTenantDomain();

    const session = await auth();
    const userId = session?.user?.id;

    // Normalize Bangla digits to English digits and sanitize phone
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let normalizedPhone = phone || '';
    for (let i = 0; i < 10; i++) {
      normalizedPhone = normalizedPhone.replace(new RegExp(banglaDigits[i], 'g'), englishDigits[i]);
    }
    let cleanedPhone = normalizedPhone.replace(/[^0-9]/g, '');
    
    // Remove country prefixes (88, +88, 0088) if present
    if (cleanedPhone.startsWith('88')) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.startsWith('0088')) {
      cleanedPhone = cleanedPhone.substring(4);
    }
    
    const cleanPhone = cleanedPhone || phone.replace(/\s+/g, '').trim();
    const token = cartToken || crypto.randomUUID();

    // Atomic update/upsert by phone and domain to prevent concurrent duplicates
    const cart = await AbandonedCart.findOneAndUpdate(
      { phone: cleanPhone, domain },
      {
        $set: {
          user: userId || undefined,
          fullName: fullName.trim(),
          email: email?.trim() || undefined,
          street: street?.trim() || undefined,
          deliveryArea: deliveryArea || undefined,
          items,
          totalAmount,
        },
        $setOnInsert: {
          cartToken: token
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error('Error saving abandoned cart:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE an abandoned cart (Admin/Manager only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'manager')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing cart ID' }, { status: 400 });
    }

    await connectToDatabase();
    const domain = await getTenantDomain();
    await AbandonedCart.findOneAndDelete({ _id: id, domain });

    return NextResponse.json({ message: 'Abandoned cart deleted successfully' });
  } catch (error) {
    console.error('Error deleting abandoned cart:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
