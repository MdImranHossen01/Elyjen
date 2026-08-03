import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import GlobalSettings from '@/models/GlobalSettings';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const domain = req.headers.get('x-tenant-domain') || 'elyjen.shop';
    const settings = await GlobalSettings.findOne({ domain });
    
    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const domain = req.headers.get('x-tenant-domain') || 'elyjen.shop';
    const body = await req.json();
    
    const settings = await GlobalSettings.findOneAndUpdate(
      { domain },
      { $push: { testimonials: body } },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings.testimonials);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const domain = req.headers.get('x-tenant-domain') || 'elyjen.shop';
    const body = await req.json();
    const { id, ...updateData } = body;

    const settings = await GlobalSettings.findOneAndUpdate(
      { domain, 'testimonials._id': id },
      { $set: { 'testimonials.$': { ...updateData, _id: id } } },
      { new: true }
    );

    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const domain = req.headers.get('x-tenant-domain') || 'elyjen.shop';
    const { id } = await req.json();

    const settings = await GlobalSettings.findOneAndUpdate(
      { domain },
      { $pull: { testimonials: { _id: id } } },
      { new: true }
    );

    return NextResponse.json(settings?.testimonials || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
