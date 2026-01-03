const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Lấy danh sách ngân sách
 *     tags: [Budgets]
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
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách ngân sách
 */
router.get('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const { month, year, categoryId } = req.query;

        const filter = {
            // userId,
            isActive: true
        };

        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);
        if (categoryId) filter.categoryId = categoryId;

        // const budgets = await Budget.find(filter)
        //     .populate('categoryId', 'name icon color type')
        //     .sort({ startDate: -1 });

        res.status(200).json({
            success: true,
            message: 'TODO: Implement authentication middleware',
            // data: budgets
        });

    } catch (error) {
        console.error('Lỗi lấy budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/budgets/{id}:
 *   get:
 *     summary: Lấy chi tiết ngân sách
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết ngân sách
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await Budget.findById(id)
            .populate('categoryId', 'name icon color type');

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngân sách'
            });
        }

        // Calculate actual spent from transactions
        const actualSpent = await Transaction.aggregate([
            {
                $match: {
                    userId: budget.userId,
                    categoryId: budget.categoryId,
                    type: 'expense',
                    transactionDate: {
                        $gte: budget.startDate,
                        $lte: budget.endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const spent = actualSpent.length > 0 ? actualSpent[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                ...budget.toJSON(),
                spent,
                remaining: Math.max(0, budget.amount - spent),
                percentageUsed: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
                isOverBudget: spent > budget.amount
            }
        });

    } catch (error) {
        console.error('Lỗi lấy budget:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Tạo ngân sách mới
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - amount
 *               - period
 *               - year
 *               - startDate
 *               - endDate
 *             properties:
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 5000000
 *               currency:
 *                 type: string
 *                 default: "VND"
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               alertThreshold:
 *                 type: number
 *                 default: 80
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo ngân sách thành công
 */
router.post('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const {
            categoryId,
            amount,
            currency = 'VND',
            period,
            month,
            year,
            startDate,
            endDate,
            alertThreshold = 80,
            notes
        } = req.body;

        if (!categoryId || !amount || !period || !year || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // const newBudget = new Budget({
        //     userId,
        //     categoryId,
        //     amount,
        //     currency,
        //     period,
        //     month,
        //     year,
        //     startDate,
        //     endDate,
        //     alertThreshold,
        //     notes
        // });

        // await newBudget.save();

        res.status(201).json({
            success: true,
            message: 'TODO: Implement authentication middleware',
            // data: newBudget
        });

    } catch (error) {
        console.error('Lỗi tạo budget:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Cập nhật ngân sách
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const budget = await Budget.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name icon color type');

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngân sách'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật ngân sách thành công',
            data: budget
        });

    } catch (error) {
        console.error('Lỗi cập nhật budget:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Xóa ngân sách (soft delete)
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const budget = await Budget.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngân sách'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa ngân sách thành công'
        });

    } catch (error) {
        console.error('Lỗi xóa budget:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
