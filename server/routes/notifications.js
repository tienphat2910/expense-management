const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Savings = require('../models/Savings');
const User = require('../models/User');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo
 *     tags: [Notifications]
 */
router.get('/', async (req, res) => {
    try {
        const { userId, isRead } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        const filter = { userId };
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        const notifications = await Notification.find(filter)
            .populate('data.fromUserId', 'username fullName')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });

    } catch (error) {
        console.error('Lỗi lấy thông báo:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu thông báo đã đọc
 *     tags: [Notifications]
 */
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('Lỗi cập nhật thông báo:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả đã đọc
 *     tags: [Notifications]
 */
router.patch('/read-all', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID là bắt buộc'
            });
        }

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'Đã đánh dấu tất cả đã đọc'
        });

    } catch (error) {
        console.error('Lỗi cập nhật thông báo:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/accept-invite:
 *   post:
 *     summary: Chấp nhận lời mời tiết kiệm
 *     tags: [Notifications]
 */
router.post('/:id/accept-invite', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (notification.type !== 'savings_invite') {
            return res.status(400).json({
                success: false,
                message: 'Thông báo này không phải lời mời tiết kiệm'
            });
        }

        if (notification.inviteStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Lời mời đã được xử lý'
            });
        }

        const savings = await Savings.findById(notification.data.savingsId);

        if (!savings) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục tiết kiệm'
            });
        }

        // Check if user is already a member
        const existingMember = savings.members.find(m => m.userId.toString() === notification.userId.toString());
        if (existingMember) {
            notification.inviteStatus = 'accepted';
            await notification.save();
            
            return res.status(400).json({
                success: false,
                message: 'Bạn đã là thành viên của mục tiết kiệm này'
            });
        }

        // Add user as member
        savings.members.push({
            userId: notification.userId,
            role: 'member',
            contributedAmount: 0,
            joinedAt: new Date()
        });

        savings.isShared = true;
        await savings.save();

        // Update notification status
        notification.inviteStatus = 'accepted';
        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Đã chấp nhận lời mời',
            data: savings
        });

    } catch (error) {
        console.error('Lỗi chấp nhận lời mời:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/decline-invite:
 *   post:
 *     summary: Từ chối lời mời tiết kiệm
 *     tags: [Notifications]
 */
router.post('/:id/decline-invite', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (notification.type !== 'savings_invite') {
            return res.status(400).json({
                success: false,
                message: 'Thông báo này không phải lời mời tiết kiệm'
            });
        }

        if (notification.inviteStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Lời mời đã được xử lý'
            });
        }

        // Update notification status
        notification.inviteStatus = 'declined';
        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Đã từ chối lời mời'
        });

    } catch (error) {
        console.error('Lỗi từ chối lời mời:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
