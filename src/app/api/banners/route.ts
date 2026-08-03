import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Banner from '@/models/Banner';
import { auth } from '@/auth';

// GET all active banners
export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new banner (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !(['admin', 'super_admin'].includes((session.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, image, link, order, isActive } = body;

    if (!title || !image) {
      return NextResponse.json({ message: 'Title and Image are required' }, { status: 400 });
    }

    const newBanner = await Banner.create({
      title,
      image,
      link,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    revalidateTag('banners', 'max');
    revalidatePath('/');

    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

