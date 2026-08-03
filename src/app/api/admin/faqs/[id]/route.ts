import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import FAQ from '@/models/FAQ';
import { auth } from '@/auth';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'Invalid FAQ ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Whitelist allowed fields and prevent operator injection
    const allowedFields = ['question', 'answer', 'order', 'isActive'];
    const sanitizedUpdate: Record<string, any> = {};
    
    for (const key in body) {
      if (
        allowedFields.includes(key) && 
        !key.startsWith('$') && 
        !key.includes('.')
      ) {
        sanitizedUpdate[key] = body[key];
      }
    }

    await connectToDatabase();
    const domain = await (await import('@/lib/tenant')).getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const faq = await FAQ.findOneAndUpdate({ _id: id, domain }, sanitizedUpdate, { 
      new: true,
      runValidators: true 
    });
    
    if (!faq) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error('Update FAQ Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'Invalid FAQ ID' }, { status: 400 });
    }

    await connectToDatabase();
    const domain = await (await import('@/lib/tenant')).getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }
    const faq = await FAQ.findOneAndDelete({ _id: id, domain });

    if (!faq) {
      return NextResponse.json({ message: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

