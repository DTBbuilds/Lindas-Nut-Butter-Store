/**
 * Admin Controller
 * 
 * Provides comprehensive admin functionality for managing the store,
 * including customer management, order processing, and analytics
 */

// Import model helper to avoid circular dependency issues
const { getOrder, getTransaction, getProduct, getFeedback, getCustomer } = require('../utils/modelHelper');
const mongoose = require('mongoose');

// Get admin dashboard summary statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get model references using the helper
    const Order = getOrder();
    const Transaction = getTransaction();
    const Product = getProduct();
    const Feedback = getFeedback();
    const Customer = getCustomer();
    
    // Get orders count
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    // Get revenue stats
    const revenueAggregation = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'PAID'
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const todayRevenueAggregation = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'PAID',
          createdAt: { $gte: startOfToday, $lte: endOfToday }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const monthRevenueAggregation = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'PAID',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get product stats
    const productsCount = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: {
        $lte: ['$stockQuantity', '$lowStockThreshold']
      }
    });
    
    // Get transaction stats
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get feedback stats
    const feedbackCount = await Feedback.countDocuments();
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$ratings.overall' },
          averageNps: { $avg: '$recommendationScore' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format the response
    const stats = {
      orders: {
        total: totalOrders,
        today: todayOrders,
        month: monthOrders
      },
      revenue: {
        total: revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0,
        today: todayRevenueAggregation.length > 0 ? todayRevenueAggregation[0].totalRevenue : 0,
        month: monthRevenueAggregation.length > 0 ? monthRevenueAggregation[0].totalRevenue : 0
      },
      products: {
        total: productsCount,
        lowStock: lowStockProducts
      },
      transactions: {
        byStatus: transactionStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      },
      feedback: {
        total: feedbackCount,
        averageRating: feedbackStats.length > 0 ? feedbackStats[0].averageRating.toFixed(1) : 0,
        averageNps: feedbackStats.length > 0 ? feedbackStats[0].averageNps.toFixed(1) : 0
      }
    };
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard statistics',
      error: error.message
    });
  }
};

// Get recent orders for admin dashboard
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get Order model using the helper
    const Order = getOrder();

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders',
      error: error.message
    });
  }
};

// Get recent transactions for admin dashboard
exports.getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get Transaction model using the helper
    const Transaction = getTransaction();

    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('orderId', 'referenceNumber customer.name status paymentStatus');
    
    return res.status(200).json({
      success: true,
      data: transactions || []
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    // Return empty data with 200 status to prevent client errors
    return res.status(200).json({
      success: true,
      data: []
    });
  }
};

// Get very recent transactions (last 5 minutes) for real-time updates
exports.getRealtimeTransactions = async (req, res) => {
  try {
    // Get very recent transactions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Get Transaction model using the helper
    const Transaction = getTransaction();

    const transactions = await Transaction.find({
      timestamp: { $gte: fiveMinutesAgo }
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('orderId', 'referenceNumber customer.name status paymentStatus');
    
    return res.status(200).json({
      success: true,
      data: transactions || [],
      meta: {
        timeWindow: '5 minutes',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching realtime transactions:', error);
    // Return empty data with 200 status to prevent client errors
    return res.status(200).json({
      success: true,
      data: [],
      meta: {
        timeWindow: '5 minutes',
        timestamp: new Date(),
        error: error.message
      }
    });
  }
};

// Get monthly sales data for charts
exports.getMonthlySalesData = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    // Get Order model using the helper
    const Order = getOrder();
    
    const monthlySales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'PAID',
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          sales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Fill in missing months with zero values
    const monthlyData = Array(12).fill().map((_, i) => {
      const month = i + 1;
      const found = monthlySales.find(item => item._id === month);
      
      return {
        month,
        sales: found ? found.sales : 0,
        count: found ? found.count : 0
      };
    });
    
    return res.status(200).json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error getting monthly sales data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly sales data',
      error: error.message
    });
  }
};

// Get product sales rankings
exports.getProductSalesRankings = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const query = { paymentStatus: 'PAID' };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get Order model using the helper
    const Order = getOrder();
    
    const productSales = await Order.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    return res.status(200).json({
      success: true,
      data: productSales
    });
  } catch (error) {
    console.error('Error getting product sales rankings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product sales rankings',
      error: error.message
    });
  }
};

// Get recent feedback for admin dashboard
exports.getRecentFeedback = async (req, res) => {
  try {
    // Get Feedback model using the helper
    const Feedback = getFeedback();
    
    // Check if Feedback model is available
    if (!Feedback) {
      console.error('Feedback model not available');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Fetch feedback with populated order details
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); // Use lean() for better performance
    
    if (!feedback || feedback.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching recent feedback:', error);
    // Return empty array with 200 status to prevent client errors
    return res.status(200).json({
      success: true,
      data: [],
      error: error.message
    });
  }
};
