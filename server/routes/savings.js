const express = require('express');
const router = express.Router();
const Savings = require('../models/Savings');
const Wallet = require('../models/Wallet');
const SavingsTransaction = require('../models/SavingsTransaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');

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

        // Find savings where user is owner OR member
        const filter = {
            $or: [
                { userId: userId },
                { 'members.userId': userId }
            ]
        };
        
        if (status) {
            filter.status = status;
        }

        const savings = await Savings.find(filter)
            .populate('members.userId', 'username fullName')
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
 * /api/savings/search-users:
 *   get:
 *     summary: Tìm kiếm user theo username
 *     tags: [Savings]
 */
router.get('/search-users', async (req, res) => {
    try {
        const { username, excludeUserId } = req.query;

        if (!username || username.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Username phải có ít nhất 2 ký tự'
            });
        }

        const filter = {
            username: { $regex: username, $options: 'i' }
        };

        if (excludeUserId) {
            filter._id = { $ne: excludeUserId };
        }

        const users = await User.find(filter)
            .select('username fullName')
            .limit(10);

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Lỗi tìm kiếm user:', error);
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
        const savings = await Savings.findById(req.params.id)
            .populate('members.userId', 'username email fullName');

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
        const { amount, walletId, userId } = req.body;

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

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
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

        // Check if user is owner or member
        const isOwner = savings.userId.toString() === userId;
        const memberIndex = savings.members.findIndex(m => m.userId.toString() === userId);
        const isMember = memberIndex !== -1;

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền nạp tiền vào mục tiết kiệm này'
            });
        }

        // Check wallet exists and belongs to the user making the deposit
        const wallet = await Wallet.findOne({ _id: walletId, userId: userId, isActive: true });
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

        // Update member's contributed amount if they are a member
        if (isMember) {
            savings.members[memberIndex].contributedAmount += amount;
        }

        // Check if goal reached
        if (savings.currentAmount >= savings.targetAmount) {
            savings.status = 'completed';
        }

        await savings.save();

        // Save transaction history
        const transaction = new SavingsTransaction({
            savingsId: savings._id,
            userId: userId,
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
        const { amount, walletId, userId } = req.body;

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

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const savings = await Savings.findById(req.params.id);
        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiết kiệm'
            });
        }

        // Only owner can withdraw
        if (savings.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Chỉ chủ sở hữu mới có thể rút tiền'
            });
        }

        if (savings.currentAmount < amount) {
            return res.status(400).json({
                success: false,
                message: 'Số dư tiết kiệm không đủ'
            });
        }

        // Check wallet exists and belongs to user
        const wallet = await Wallet.findOne({ _id: walletId, userId: userId, isActive: true });
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
            userId: userId,
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

/**
 * @swagger
 * /api/savings/{id}/generate-invite:
 *   post:
 *     summary: Tạo link mời tham gia tiết kiệm
 *     tags: [Savings]
 */
router.post('/:id/generate-invite', async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục tiết kiệm'
            });
        }

        // Generate unique invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        savings.inviteToken = inviteToken;
        savings.inviteTokenExpiry = inviteTokenExpiry;
        savings.isShared = true;
        await savings.save();

        res.status(200).json({
            success: true,
            data: {
                inviteToken,
                inviteUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/savings/join/${inviteToken}`,
                expiresAt: inviteTokenExpiry
            }
        });

    } catch (error) {
        console.error('Lỗi tạo link mời:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/join/{token}:
 *   post:
 *     summary: Tham gia tiết kiệm qua link mời
 *     tags: [Savings]
 */
router.post('/join/:token', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const savings = await Savings.findOne({ 
            inviteToken: req.params.token,
            inviteTokenExpiry: { $gt: new Date() }
        }).populate('members.userId', 'username email fullName');

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Link mời không hợp lệ hoặc đã hết hạn'
            });
        }

        // Check if user is already a member
        const existingMember = savings.members.find(m => m.userId._id.toString() === userId);
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã là thành viên của mục tiết kiệm này'
            });
        }

        // Check if user is the owner
        if (savings.userId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Bạn là chủ sở hữu của mục tiết kiệm này'
            });
        }

        // Add user as member
        savings.members.push({
            userId,
            role: 'member',
            contributedAmount: 0,
            joinedAt: new Date()
        });

        await savings.save();

        const updatedSavings = await Savings.findById(savings._id)
            .populate('members.userId', 'username email fullName');

        res.status(200).json({
            success: true,
            message: 'Tham gia tiết kiệm thành công',
            data: updatedSavings
        });

    } catch (error) {
        console.error('Lỗi tham gia tiết kiệm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}/invite-user:
 *   post:
 *     summary: Mời user vào tiết kiệm bằng username
 *     tags: [Savings]
 */
router.post('/:id/invite-user', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const savings = await Savings.findById(req.params.id);

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục tiết kiệm'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy user'
            });
        }

        // Check if user is already a member
        const existingMember = savings.members.find(m => m.userId.toString() === userId);
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'User đã là thành viên của mục tiết kiệm này'
            });
        }

        // Check if user is the owner
        if (savings.userId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'User là chủ sở hữu của mục tiết kiệm này'
            });
        }

        // Check if there's already a pending invitation
        const pendingInvite = await Notification.findOne({
            userId: userId,
            type: 'savings_invite',
            'data.savingsId': savings._id,
            inviteStatus: 'pending'
        });

        if (pendingInvite) {
            return res.status(400).json({
                success: false,
                message: 'Đã có lời mời đang chờ xử lý'
            });
        }

        // Create notification for invited user (don't add to members yet)
        const owner = await User.findById(savings.userId);
        const notification = new Notification({
            userId: userId,
            type: 'savings_invite',
            title: 'Lời mời tiết kiệm',
            message: `${owner.fullName || owner.username} đã mời bạn tham gia tiết kiệm "${savings.name}"`,
            data: {
                savingsId: savings._id,
                fromUserId: savings.userId
            },
            inviteStatus: 'pending'
        });
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Đã gửi lời mời thành công',
            data: notification
        });

    } catch (error) {
        console.error('Lỗi mời user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/savings/{id}/remove-member:
 *   delete:
 *     summary: Xóa thành viên khỏi tiết kiệm
 *     tags: [Savings]
 */
router.delete('/:id/remove-member', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const savings = await Savings.findById(req.params.id);

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục tiết kiệm'
            });
        }

        // Find the member to get their contributed amount
        const member = savings.members.find(m => m.userId.toString() === userId);
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành viên'
            });
        }

        const contributedAmount = member.contributedAmount || 0;

        // If member has contributed money, refund it
        if (contributedAmount > 0) {
            // Find an active wallet of the member to refund
            const memberWallet = await Wallet.findOne({ userId: userId, isActive: true });
            
            if (!memberWallet) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ví của thành viên để hoàn tiền'
                });
            }

            // Refund to member's wallet
            memberWallet.balance += contributedAmount;
            await memberWallet.save();

            // Deduct from savings
            savings.currentAmount -= contributedAmount;

            // Update status if needed
            if (savings.status === 'completed' && savings.currentAmount < savings.targetAmount) {
                savings.status = 'active';
            }

            // Create refund transaction record
            const transaction = new SavingsTransaction({
                savingsId: savings._id,
                userId: userId,
                walletId: memberWallet._id,
                type: 'withdraw',
                amount: contributedAmount,
                balanceAfter: savings.currentAmount,
            });
            await transaction.save();
        }

        // Remove member
        savings.members = savings.members.filter(m => m.userId.toString() !== userId);
        
        // If no members left, set isShared to false
        if (savings.members.length === 0) {
            savings.isShared = false;
        }

        await savings.save();

        const updatedSavings = await Savings.findById(savings._id)
            .populate('members.userId', 'username fullName');

        res.status(200).json({
            success: true,
            message: contributedAmount > 0 
                ? `Xóa thành viên và hoàn ${contributedAmount.toLocaleString('vi-VN')} đ thành công`
                : 'Xóa thành viên thành công',
            data: updatedSavings
        });

    } catch (error) {
        console.error('Lỗi xóa thành viên:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
