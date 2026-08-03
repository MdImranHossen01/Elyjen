import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find(
      { isPublished: true },
      { slug: 1, _id: 0 }
    ).lean();

    const slugs = products.map((p: any) => p.slug).filter(Boolean);
    return NextResponse.json(slugs);
  } catch (error) {
    console.error('Warmup API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
