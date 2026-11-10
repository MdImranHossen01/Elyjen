import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';
import { auth } from '@/auth';
import mongoose from 'mongoose';
import { purgeCloudflareCache } from '@/lib/cloudflareCache';

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

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: 'Invalid Banner ID' }, { status: 400 });
    }

    const body = await req.json();
    await connectToDatabase();

    const banner = await Banner.findOneAndUpdate({ _id: id }, body, { new: true });
    
    if (!banner) {
      return NextResponse.json({ message: 'Banner not found' }, { status: 404 });
    }

    purgeCloudflareCache().catch(() => {});

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Update Banner Error:', error);
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
      return NextResponse.json({ message: 'Invalid Banner ID' }, { status: 400 });
    }

    await connectToDatabase();
    const banner = await Banner.findOneAndDelete({ _id: id });

    if (!banner) {
      return NextResponse.json({ message: 'Banner not found' }, { status: 404 });
    }

    // Delete banner images from Cloudflare R2
    const imagesToDelete = [banner.image, (banner as any).imageUrl, (banner as any).mobileImageUrl].filter(Boolean);
    if (imagesToDelete.length > 0) {
      try {
        const { deleteMultipleFromR2 } = await import('@/lib/r2');
        await deleteMultipleFromR2(imagesToDelete);
      } catch (r2Err) {
        console.error('Failed to delete banner images from Cloudflare R2:', r2Err);
      }
    }

    purgeCloudflareCache().catch(() => {});

    return NextResponse.json({ message: 'Banner deleted successfully and image removed from R2' });
  } catch (error) {
    console.error('Delete Banner Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

