const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Lấy danh sách giao dịch
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 */
router.get('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const { userId, type, categoryId, startDate, endDate, page = 1, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }

        const filter = {
            userId,
        };

        if (type) filter.type = type;
        if (categoryId) filter.categoryId = categoryId;
        if (startDate || endDate) {
            filter.transactionDate = {};
            if (startDate) filter.transactionDate.$gte = new Date(startDate);
            if (endDate) filter.transactionDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const transactions = await Transaction.find(filter)
            .populate('categoryId', 'name icon color type')
            .populate('walletId', 'name type color')
            .sort({ transactionDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Lỗi lấy transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Lấy chi tiết giao dịch
 *     tags: [Transactions]
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
 *         description: Chi tiết giao dịch
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id)
            .populate('categoryId', 'name icon color type')
            .populate('walletId', 'name type color')
            .populate('userId', 'username email fullName');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Lỗi lấy transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Tạo giao dịch mới
 *     tags: [Transactions]
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
 *               - type
 *               - amount
 *               - transactionDate
 *             properties:
 *               categoryId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *                 example: 150000
 *               currency:
 *                 type: string
 *                 default: "VND"
 *               description:
 *                 type: string
 *                 example: "Ăn trưa tại nhà hàng"
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank_transfer, credit_card, e_wallet, other]
 *               location:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo giao dịch thành công
 */
router.post('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const {
            userId,
            categoryId,
            walletId,
            type,
            amount,
            currency = 'VND',
            description,
            transactionDate,
            paymentMethod = 'cash',
            location,
            tags,
            notes
        } = req.body;

        // Validate required fields
        if (!userId || !categoryId || !walletId || !type || !amount || !transactionDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Find or create category
        let category = await Category.findOne({ name: categoryId, userId, type });
        if (!category) {
            // Create new category if not exists
            category = new Category({
                userId,
                name: categoryId,
                type,
                icon: req.body.categoryIcon || '',
                color: req.body.categoryColor || (type === 'income' ? '#10b981' : '#ef4444')
            });
            await category.save();
        }

        // Verify wallet exists and belongs to user
        const wallet = await Wallet.findOne({ _id: walletId, userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ví hoặc ví không thuộc về bạn'
            });
        }

        // Check if wallet has enough balance for expense
        if (type === 'expense' && wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Số dư ví không đủ cho giao dịch này'
            });
        }

        const newTransaction = new Transaction({
            userId,
            categoryId: category._id,
            walletId,
            type,
            amount,
            currency,
            description,
            transactionDate,
            paymentMethod,
            location,
            tags,
            notes
        });

        await newTransaction.save();

        // Update wallet balance
        if (type === 'income') {
            wallet.balance += amount;
        } else {
            wallet.balance -= amount;
        }
        await wallet.save();

        // TODO: Update budget spent if exists

        const populatedTransaction = await Transaction.findById(newTransaction._id)
            .populate('categoryId', 'name icon color type')
            .populate('walletId', 'name type color');

        res.status(201).json({
            success: true,
            message: 'Tạo giao dịch thành công',
            data: populatedTransaction
        });

    } catch (error) {
        console.error('Lỗi tạo transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Cập nhật giao dịch
 *     tags: [Transactions]
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

        const transaction = await Transaction.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name icon color type');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật giao dịch thành công',
            data: transaction
        });

    } catch (error) {
        console.error('Lỗi cập nhật transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Xóa giao dịch
 *     tags: [Transactions]
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

        const transaction = await Transaction.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa giao dịch thành công'
        });

    } catch (error) {
        console.error('Lỗi xóa transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions/summary/current:
 *   get:
 *     summary: Lấy tổng quan thu chi hiện tại
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tổng quan thu chi
 */
router.get('/summary/current', async (req, res) => {
    try {
        // TODO: Implement summary logic
        res.status(200).json({
            success: true,
            message: 'TODO: Implement summary calculation'
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

module.exports = router;
