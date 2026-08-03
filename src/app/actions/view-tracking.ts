'use server';

import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import Blog from '@/models/Blog';

export async function trackView(id: string, type: 'product' | 'blog') {
  try {
    await connectToDatabase();
    if (type === 'product') {
      await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });
    } else if (type === 'blog') {
      await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }
  } catch (error) {
    console.error(`Failed to track view for ${type} (${id}):`, error);
  }
}
