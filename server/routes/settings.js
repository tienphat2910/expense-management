const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Savings = require('../models/Savings');
const SavingsTransaction = require('../models/SavingsTransaction');

/**
 * @swagger
 * /api/settings/reset-data:
 *   delete:
 *     summary: Xóa tất cả dữ liệu của user
 *     tags: [Settings]
 */
router.delete('/reset-data', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        // Delete all user data in parallel
        await Promise.all([
            Transaction.deleteMany({ userId }),
            Wallet.deleteMany({ userId }),
            Savings.deleteMany({ userId }),
            SavingsTransaction.deleteMany({ userId })
        ]);

        res.status(200).json({
            success: true,
            message: 'Đã xóa tất cả dữ liệu thành công'
        });

    } catch (error) {
        console.error('Lỗi xóa dữ liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
