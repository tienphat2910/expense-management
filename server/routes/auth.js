const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "nguoidung123"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "matkhau123"
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email hoặc username đã tồn tại
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;

        // Validate input
        if (!username || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username đã tồn tại'
            });
        }

        // TODO: Hash password trước khi lưu (sử dụng bcrypt)
        // const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            password, // TODO: Thay bằng hashedPassword
            fullName,
            preferences: {
                currency: 'VND',
                timezone: 'Asia/Ho_Chi_Minh',
                language: 'vi',
                theme: 'light'
            }
        });

        await newUser.save();

        // TODO: Generate JWT token
        // const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: newUser,
                // token
            }
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "matkhau123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ username và mật khẩu'
            });
        }

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc mật khẩu không đúng'
            });
        }

        // TODO: Compare password with hashed password
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        const isPasswordValid = (password === user.password); // Temporary

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc mật khẩu không đúng'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // TODO: Generate JWT token
        // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user,
                // token
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token trong middleware
        // const userId = req.user.id;

        res.status(200).json({
            success: true,
            message: 'TODO: Implement JWT authentication middleware'
        });

    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', async (req, res) => {
    try {
        // TODO: Invalidate JWT token (add to blacklist hoặc clear từ client)
        
        res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công'
        });

    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
