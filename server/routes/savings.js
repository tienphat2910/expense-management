const express = require('express');
const router = express.Router();
const Savings = require('../models/Savings');
const Wallet = require('../models/Wallet');
const SavingsTransaction = require('../models/SavingsTransaction');

/**
 * @swagger
 * /api/savings:
 *   get:
 *     summary: Lấy danh sách tiết kiệm
 *     tags: [Savings]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Danh sách tiết kiệm
 */
router.get('/', async (req, res) => {
    try {
        const { userId, status } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const filter = { userId };
        if (status) {
            filter.status = status;
        }

        const savings = await Savings.find(filter)
            .sort({ createdAt: -1 });

        const totalSaved = savings
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + s.currentAmount, 0);

        res.status(200).json({
            success: true,
            data: {
                savings,
                totalSaved
            }
        });

    } catch (error) {
        console.error('Lỗi lấy danh sách tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}:
 *   get:
 *     summary: Lấy chi tiết tiết kiệm
 *     tags: [Savings]
 */
router.get('/:id', async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        res.status(200).json({
            success: true,
            data: savings
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings:
 *   post:
 *     summary: Tạo tiết kiệm mới
 *     tags: [Savings]
 */
router.post('/', async (req, res) => {
    try {
        const { userId, name, description, targetAmount, deadline, icon, color } = req.body;

        if (!userId || !name || !targetAmount) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const savings = new Savings({
            userId,
            name,
            description,
            targetAmount,
            deadline,
            icon: icon || 'PiggyBank',
            color: color || '#3b82f6'
        });

        await savings.save();

        res.status(201).json({
            success: true,
            message: 'Tạo tiết kiệm thành công',
            data: savings
        });

    } catch (error) {
        console.error('Lỗi tạo tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}/deposit:
 *   post:
 *     summary: Nạp tiền vào tiết kiệm
 *     tags: [Savings]
 */
router.post('/:id/deposit', async (req, res) => {
    try {
        const { amount, walletId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền không hợp lệ'
            });
        }

        if (!walletId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ví nguồn'
            });
        }

        const savings = await Savings.findById(req.params.id);
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        if (savings.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Tiết kiệm không ở trạng thái hoạt động'
            });
        }

        // Check wallet exists and belongs to user
        const wallet = await Wallet.findOne({ _id: walletId, userId: savings.userId, isActive: true });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ví'
            });
        }

        // Check wallet balance
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Số dư ví không đủ'
            });
        }

        // Deduct from wallet
        wallet.balance -= amount;
        await wallet.save();

        // Add to savings
        savings.currentAmount += amount;

        // Check if goal reached
        if (savings.currentAmount >= savings.targetAmount) {
            savings.status = 'completed';
        }

        await savings.save();

        // Save transaction history
        const transaction = new SavingsTransaction({
            savingsId: savings._id,
            userId: savings.userId,
            walletId: wallet._id,
            type: 'deposit',
            amount: amount,
            balanceAfter: savings.currentAmount,
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Nạp tiền thành công',
            data: savings
        });

    } catch (error) {
        console.error('Lỗi nạp tiền:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}/withdraw:
 *   post:
 *     summary: Rút tiền từ tiết kiệm
 *     tags: [Savings]
 */
router.post('/:id/withdraw', async (req, res) => {
    try {
        const { amount, walletId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền không hợp lệ'
            });
        }

        if (!walletId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ví đích'
            });
        }

        const savings = await Savings.findById(req.params.id);
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        if (savings.currentAmount < amount) {
            return res.status(400).json({
                success: false,
                message: 'Số dư tiết kiệm không đủ'
            });
        }

        // Check wallet exists and belongs to user
        const wallet = await Wallet.findOne({ _id: walletId, userId: savings.userId, isActive: true });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ví'
            });
        }

        // Add to wallet
        wallet.balance += amount;
        await wallet.save();

        // Deduct from savings
        savings.currentAmount -= amount;

        // Update status if needed
        if (savings.status === 'completed' && savings.currentAmount < savings.targetAmount) {
            savings.status = 'active';
        }

        await savings.save();

        // Save transaction history
        const transaction = new SavingsTransaction({
            savingsId: savings._id,
            userId: savings.userId,
            walletId: wallet._id,
            type: 'withdraw',
            amount: amount,
            balanceAfter: savings.currentAmount,
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Rút tiền thành công',
            data: savings
        });

    } catch (error) {
        console.error('Lỗi rút tiền:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}:
 *   put:
 *     summary: Cập nhật tiết kiệm
 *     tags: [Savings]
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, description, targetAmount, deadline, icon, color, status } = req.body;

        const savings = await Savings.findById(req.params.id);
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        if (name) savings.name = name;
        if (description !== undefined) savings.description = description;
        if (targetAmount) savings.targetAmount = targetAmount;
        if (deadline !== undefined) savings.deadline = deadline;
        if (icon) savings.icon = icon;
        if (color) savings.color = color;
        if (status) savings.status = status;

        await savings.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thành công',
            data: savings
        });

    } catch (error) {
        console.error('Lỗi cập nhật tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}:
 *   delete:
 *     summary: Xóa tiết kiệm
 *     tags: [Savings]
 */
/**
 * @swagger
 * /api/savings/{id}/transactions:
 *   get:
 *     summary: Lấy lịch sử giao dịch tiết kiệm
 *     tags: [Savings]
 */
router.get('/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, month, year } = req.query;

        const savings = await Savings.findById(id);
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter
        const filter = { savingsId: id };
        
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
            filter.createdAt = { $gte: startDate, $lte: endDate };
        }

        const [transactions, total] = await Promise.all([
            SavingsTransaction.find(filter)
                .populate('walletId', 'name type')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            SavingsTransaction.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Lỗi lấy lịch sử giao dịch:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);
        
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        // Warn if there's money in savings
        if (savings.currentAmount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng rút hết tiền trước khi xóa mục tiết kiệm'
            });
        }

        await Savings.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Xóa tiết kiệm thành công'
        });

    } catch (error) {
        console.error('Lỗi xóa tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
