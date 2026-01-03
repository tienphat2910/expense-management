const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { specs, swaggerUi } = require('./swagger');
require("dotenv").config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
// Tăng giới hạn payload cho upload ảnh (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Expense Management API Documentation"
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/settings', require('./routes/settings'));

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI không được định nghĩa trong biến môi trường");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("✅ Kết nối MongoDB thành công");
        console.log('📊 Database: Expense Management');
        console.log('🌍 Timezone: Asia/Ho_Chi_Minh (GMT+7)');
        console.log('💰 Currency: VND (Việt Nam Đồng)');
    })
    .catch((err) => {
        console.error("❌ Lỗi kết nối MongoDB:", err);
        process.exit(1);
    });

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "🚀 Server đang chạy!"
 */
app.get("/", (req, res) => {
    res.send("🚀 Expense Management API đang chạy!");
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: API status endpoint
 *     description: Get API status and information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Expense Management API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 timezone:
 *                   type: string
 *                   example: "Asia/Ho_Chi_Minh"
 *                 currency:
 *                   type: string
 *                   example: "VND"
 *                 database:
 *                   type: string
 *                   example: "Connected"
 */
app.get("/api/status", (req, res) => {
    res.json({
        status: "OK",
        message: "Expense Management API is running",
        version: "1.0.0",
        timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        timezone: "Asia/Ho_Chi_Minh",
        currency: "VND",
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        environment: process.env.NODE_ENV || "development"
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File quá lớn'
        });
    }

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy endpoint này'
    });
});

// Khởi chạy server
const server = app.listen(PORT, () => {
    console.log(`\n🌐 Server chạy tại: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📅 Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    console.log(`\n💡 Sử dụng: npm run dev để chạy với nodemon\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ Đã đóng kết nối MongoDB');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n\n⏳ Đang đóng kết nối...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('✅ Đã đóng kết nối MongoDB');
            process.exit(0);
        });
    });
});
