import { unstable_cache } from 'next/cache';
import connectToDatabase from './db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import Banner from '@/models/Banner';
import Blog from '@/models/Blog';
import FAQ from '@/models/FAQ';
import GlobalSettings from '@/models/GlobalSettings';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';

// Helper to serialize MongoDB data safely and remove Mongoose metadata/non-serializable types
const serialize = (data: any) => {
  if (!data) return null;
  return JSON.parse(JSON.stringify(data));
};

/**
 * CACHE_TAGS constants for consistency
 */
export const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  banners: 'banners',
  blogs: 'blogs',
  faqs: 'faqs',
  settings: 'settings',
  coupons: 'coupons',
};

// --- PRODUCTS ---

export const getCachedProducts = (_domain?: string, query = {}, limit = 10, sort: any = { createdAt: -1 }) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const products = await Product.find({ isPublished: true, ...query })
          .populate('categories')
          .sort(sort as any)
          .limit(limit)
          .lean();
        return serialize(products);
      } catch (error) {
        console.error('Error fetching cached products:', error);
        return [];
      }
    },
    ['products-list', JSON.stringify(query), limit.toString(), JSON.stringify(sort)],
    { revalidate: 31536000, tags: [CACHE_TAGS.products] }
  )();
};

export const getCachedProductBySlug = (_domain: string | undefined, slug: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const product = await Product.findOne({ slug, isPublished: true })
          .populate('categories')
          .lean();
        return serialize(product);
      } catch (error) {
        console.error('Error fetching cached product by slug:', error);
        return null;
      }
    },
    ['product-detail', slug],
    { revalidate: 31536000, tags: [CACHE_TAGS.products] }
  )();
};

export const getTrendingProducts = (_domain?: string, limit = 10) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topSellingItems = await Order.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'Cancelled' } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.product', totalSales: { $sum: '$items.quantity' } } },
          { $sort: { totalSales: -1 } },
          { $limit: limit }
        ]);

        const topSellingIds = topSellingItems.map(item => item._id);

        let trendingProducts = await Product.find({
          _id: { $in: topSellingIds },
          isPublished: true
        }).populate('categories').lean();

        trendingProducts.sort((a: any, b: any) => {
          const aSales = topSellingItems.find(item => item._id.toString() === a._id.toString())?.totalSales || 0;
          const bSales = topSellingItems.find(item => item._id.toString() === b._id.toString())?.totalSales || 0;
          return bSales - aSales;
        });

        if (trendingProducts.length < limit) {
          const remaining = limit - trendingProducts.length;
          const topRated = await Product.find({
            _id: { $nin: trendingProducts.map(p => p._id) },
            isPublished: true,
            ratings: { $gt: 0 }
          })
            .populate('categories')
            .sort({ ratings: -1, numReviews: -1 } as any)
            .limit(remaining)
            .lean();
          trendingProducts = [...trendingProducts, ...topRated] as any;
        }

        if (trendingProducts.length < limit) {
          const remaining = limit - trendingProducts.length;
          const topViewed = await Product.find({
            _id: { $nin: trendingProducts.map(p => p._id) },
            isPublished: true,
            views: { $gt: 0 }
          })
            .populate('categories')
            .sort({ views: -1 } as any)
            .limit(remaining)
            .lean();
          trendingProducts = [...trendingProducts, ...topViewed] as any;
        }

        if (trendingProducts.length < limit) {
          const remaining = limit - trendingProducts.length;
          const latest = await Product.find({
            _id: { $nin: trendingProducts.map(p => p._id) },
            isPublished: true
          })
            .populate('categories')
            .sort({ createdAt: -1 } as any)
            .limit(remaining)
            .lean();
          trendingProducts = [...trendingProducts, ...latest] as any;
        }

        return serialize(trendingProducts);
      } catch (error) {
        console.error('Error fetching trending products:', error);
        return [];
      }
    },
    ['trending-products', limit.toString()],
    { revalidate: 3600, tags: [CACHE_TAGS.products] }
  )();
};

// --- CATEGORIES ---

export const getCachedCategories = (_domain?: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const categories = await Category.find({ isActive: true })
          .populate('parentCategory', 'name')
          .sort({ createdAt: -1 })
          .lean();
        return serialize(categories);
      } catch (error) {
        console.error('Error fetching cached categories:', error);
        return [];
      }
    },
    ['categories-list'],
    { revalidate: 31536000, tags: [CACHE_TAGS.categories] }
  )();
};

// --- BANNERS ---

export const getCachedBanners = (_domain?: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const banners = await Banner.find({ isActive: true })
          .sort({ order: 1 })
          .lean();
        return serialize(banners);
      } catch (error) {
        console.error('Error fetching cached banners:', error);
        return [];
      }
    },
    ['banners-list'],
    { revalidate: 60, tags: [CACHE_TAGS.banners] }
  )();
};

// --- BLOGS ---

export const getCachedBlogs = (_domain?: string, limit = 10) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const blogs = await Blog.find({ isPublished: true })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return serialize(blogs);
      } catch (error) {
        console.error('Error fetching cached blogs:', error);
        return [];
      }
    },
    ['blogs-list', limit.toString()],
    { revalidate: 31536000, tags: [CACHE_TAGS.blogs] }
  )();
};

export const getCachedBlogBySlug = (_domain: string | undefined, slug: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const blog = await Blog.findOne({ slug, isPublished: true }).lean();
        return serialize(blog);
      } catch (error) {
        console.error('Error fetching cached blog by slug:', error);
        return null;
      }
    },
    ['blog-detail', slug],
    { revalidate: 31536000, tags: [CACHE_TAGS.blogs] }
  )();
};

// --- FAQs ---

export const getCachedFAQs = (_domain?: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 }).lean();
        return serialize(faqs);
      } catch (error) {
        console.error('Error fetching cached FAQs:', error);
        return [];
      }
    },
    ['faqs-list'],
    { revalidate: 31536000, tags: [CACHE_TAGS.faqs] }
  )();
};

// --- SETTINGS ---

export const getCachedSettings = (_hostname?: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const settings = await GlobalSettings.findOne().lean();
        return serialize(settings);
      } catch (error) {
        console.error('Error fetching cached settings:', error);
        return null;
      }
    },
    ['settings-global'],
    { tags: [CACHE_TAGS.settings], revalidate: 3600 }
  )();
};

// --- COUPONS ---

export const getCachedActiveCoupon = (_domain?: string) => {
  return unstable_cache(
    async () => {
      try {
        await connectToDatabase();
        const coupon = await Coupon.findOne({
          isActive: true,
          expiryDate: { $gt: new Date() }
        }).sort({ createdAt: -1 }).lean();
        return serialize(coupon);
      } catch (error) {
        console.error('Error fetching cached active coupon:', error);
        return null;
      }
    },
    ['active-coupon'],
    { revalidate: 3600, tags: [CACHE_TAGS.coupons] }
  )();
};

