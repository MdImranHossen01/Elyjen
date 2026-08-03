import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import { getTenantDomain } from '@/lib/tenant';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    const domain = await getTenantDomain();
    if (!domain) {
      return NextResponse.json({ message: 'Tenant domain is missing' }, { status: 400 });
    }

    const blog = await Blog.findOne({ slug, domain, isPublished: true });

    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error('Error fetching blog detail:', error.message);
    } else {
        console.error('An unknown error occurred while fetching blog detail');
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

