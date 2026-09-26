import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';

// High-speed in-memory cache for dashboard analytics (30s TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const isRefresh = searchParams.get('refresh') === 'true';

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = parsedFrom;
      }
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = parsedTo;
      }
    }
    endDate.setHours(23, 59, 59, 999);

    const cacheKey = `${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`;

    if (!isRefresh) {
      const cached = statsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=15',
          },
        });
      }
    }

    await connectToDatabase();

    // Reusable match query for successful orders
    const deliveredStatusMatch = {
      status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
      createdAt: { $gte: startDate, $lte: endDate },
      deletedAt: null
    };

    // Execute all independent queries concurrently using Promise.all
    const [
      chartData,
      expenseStatsResult,
      userStatsResult,
      userOrderStatsResult,
      pendingOrdersCount,
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers
    ] = await Promise.all([
      // 1. Chart Data with daily revenue, orders, COGS, deliveryCharge, profit
      Order.aggregate([
        { $match: deliveredStatusMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
            cogs: { 
              $sum: { 
                $sum: {
                  $map: {
                    input: '$items',
                    as: 'item',
                    in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                  }
                }
              }
            },
            deliveryCharge: { $sum: '$deliveryCharge' }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
            orders: 1,
            cogs: 1,
            deliveryCharge: 1,
            profit: { $subtract: [{ $subtract: ['$revenue', '$cogs'] }, '$deliveryCharge'] }
          }
        },
        { $sort: { date: 1 } }
      ]),

      // 2. All Expenses & Ads in a single aggregation
      Expense.aggregate([
        { 
          $match: { 
            date: { $gte: startDate, $lte: endDate }
          } 
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            totalAdSpend: {
              $sum: {
                $cond: [{ $eq: ['$category', 'Ads'] }, '$amount', 0]
              }
            }
          }
        }
      ]),

      // 3. User stats in a single aggregation
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
            activeSubscribers: { $sum: { $cond: ['$isSubscriptionActive', 1, 0] } },
            totalWalletTokens: { $sum: { $ifNull: ['$walletBalance', 0] } }
          }
        }
      ]),

      // 4. New vs Returning users in a database-level count
      Order.aggregate([
        { 
          $match: { 
            deletedAt: null,
            createdAt: { $gte: startDate, $lte: endDate }
          } 
        },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        {
          $group: {
            _id: null,
            newUsersCount: { $sum: { $cond: [{ $eq: ['$count', 1] }, 1, 0] } },
            returningUsersCount: { $sum: { $cond: [{ $gt: ['$count', 1] }, 1, 0] } }
          }
        }
      ]),

      // 5. Pending Orders Count
      Order.countDocuments({ status: 'Order Placed', deletedAt: null }),

      // 6. Recent 5 Orders
      Order.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('slug totalAmount status createdAt user')
        .populate('user', 'name email')
        .lean(),

      // 7. Low Stock Products
      Product.find({ stock: { $lt: 5 } })
        .limit(5)
        .select('name stock price')
        .lean(),

      // 8. Top Selling Products
      Order.aggregate([
        { $match: deliveredStatusMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            quantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // 9. Top Customers
      Order.aggregate([
        { $match: deliveredStatusMatch },
        {
          $group: {
            _id: '$user',
            totalSpend: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpend: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: '$userData' },
        {
          $project: {
            name: '$userData.name',
            email: '$userData.email',
            totalSpend: 1,
            orderCount: 1
          }
        }
      ])
    ]);

    // Derive totals directly from chartData without redundant aggregate
    let totalRevenue = 0;
    let salesCount = 0;
    let totalCOGS = 0;
    let totalDeliveryCharge = 0;

    for (const day of (chartData || [])) {
      totalRevenue += (day.revenue || 0);
      salesCount += (day.orders || 0);
      totalCOGS += (day.cogs || 0);
      totalDeliveryCharge += (day.deliveryCharge || 0);
    }

    const expenseData = expenseStatsResult[0] || {};
    const totalExpenses = expenseData.totalExpenses || 0;
    const totalAdSpend = expenseData.totalAdSpend || 0;

    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const netProfit = grossProfit - totalExpenses;
    const roas = totalAdSpend > 0 ? Number((totalRevenue / totalAdSpend).toFixed(2)) : 0;

    const userData = userStatsResult[0] || {};
    const totalUsers = userData.totalUsers || 0;
    const activeSubscribers = userData.activeSubscribers || 0;
    const totalWalletTokens = userData.totalWalletTokens || 0;

    const userOrderData = userOrderStatsResult[0] || {};
    const newUsersCount = userOrderData.newUsersCount || 0;
    const returningUsersCount = userOrderData.returningUsersCount || 0;

    // Simple Forecasting: Average Daily Revenue * 30
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const avgDailyRevenue = totalRevenue / daysInRange;
    const projectedMonthlyRevenue = avgDailyRevenue * 30;

    const responsePayload = {
      stats: {
        totalRevenue,
        salesCount,
        totalUsers,
        pendingOrdersCount,
        activeSubscribers,
        totalWalletTokens,
        totalCOGS,
        totalExpenses,
        grossProfit,
        netProfit,
        roas,
        totalAdSpend,
        newUsersCount,
        returningUsersCount,
        projectedMonthlyRevenue
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      chartData
    };

    // Cache the result
    if (statsCache.size > 50) {
      statsCache.clear();
    }
    statsCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=15',
      },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
