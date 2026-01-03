const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');

/**
 * @swagger
 * /api/statistics/summary:
 *   get:
 *     summary: Tổng quan thu chi
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Tổng quan thu chi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                 totalExpense:
 *                   type: number
 *                 balance:
 *                   type: number
 *                 transactionCount:
 *                   type: number
 */
router.get('/summary', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const { userId, startDate, endDate } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        const filter = {
            userId: new mongoose.Types.ObjectId(userId)
        };

        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) filter.transactionDate.$lte = new Date(endDate);
        }

        const summary = await Transaction.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        let totalIncome = 0;
        let totalExpense = 0;
        let transactionCount = 0;

        summary.forEach(item => {
            if (item._id === 'income') {
                totalIncome = item.total;
                transactionCount += item.count;
            } else if (item._id === 'expense') {
                totalExpense = item.total;
                transactionCount += item.count;
            }
        });

        // Get total balance from all active wallets
        const wallets = await Wallet.find({ 
            userId: new mongoose.Types.ObjectId(userId),
            isActive: true 
        });
        const balance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                balance,
                transactionCount
            }
        });

    } catch (error) {
        console.error('Lỗi lấy summary:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/statistics/monthly:
 *   get:
 *     summary: Thống kê theo tháng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thống kê theo tháng
 */
router.get('/monthly', async (req, res) => {
    try {
        // TODO: Implement monthly statistics
        res.status(200).json({
            success: true,
            message: 'TODO: Implement monthly statistics'
        });

    } catch (error) {
        console.error('Lỗi thống kê monthly:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/statistics/category:
 *   get:
 *     summary: Thống kê theo danh mục
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thống kê theo danh mục
 */
router.get('/category', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        const { type, startDate, endDate } = req.query;

        // const categoryStats = await Transaction.aggregate([
        //     {
        //         $match: {
        //             userId: ...,
        //             type: type || { $in: ['income', 'expense'] },
        //             transactionDate: { ... }
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: '$categoryId',
        //             total: { $sum: '$amount' },
        //             count: { $sum: 1 }
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'categories',
        //             localField: '_id',
        //             foreignField: '_id',
        //             as: 'category'
        //         }
        //     },
        //     { $unwind: '$category' },
        //     { $sort: { total: -1 } }
        // ]);

        res.status(200).json({
            success: true,
            message: 'TODO: Implement category statistics'
        });

    } catch (error) {
        console.error('Lỗi thống kê category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/statistics/trends:
 *   get:
 *     summary: Xu hướng chi tiêu
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Xu hướng chi tiêu theo thời gian
 */
router.get('/trends', async (req, res) => {
    try {
        // TODO: Implement trends analysis
        res.status(200).json({
            success: true,
            message: 'TODO: Implement trends analysis'
        });

    } catch (error) {
        console.error('Lỗi phân tích trends:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/statistics/budget-overview:
 *   get:
 *     summary: Tổng quan ngân sách
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tổng quan ngân sách
 */
router.get('/budget-overview', async (req, res) => {
    try {
        // TODO: Implement budget overview
        res.status(200).json({
            success: true,
            message: 'TODO: Implement budget overview'
        });

    } catch (error) {
        console.error('Lỗi budget overview:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
