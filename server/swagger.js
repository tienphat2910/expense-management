const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Expense Management API',
            version: '1.0.0',
            description: 'API quản lý thu chi cá nhân với đầy đủ tính năng',
            contact: {
                name: 'API Support',
                email: 'support@expensemanagement.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server'
            },
            {
                url: 'https://api.expensemanagement.com',
                description: 'Production Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập JWT token để xác thực'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        fullName: { type: 'string' },
                        avatar: { type: 'string' },
                        preferences: {
                            type: 'object',
                            properties: {
                                currency: { type: 'string', default: 'VND' },
                                timezone: { type: 'string', default: 'Asia/Ho_Chi_Minh' },
                                language: { type: 'string', default: 'vi' },
                                theme: { type: 'string', default: 'light' }
                            }
                        },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['income', 'expense'] },
                        icon: { type: 'string' },
                        color: { type: 'string' },
                        description: { type: 'string' },
                        userId: { type: 'string' },
                        isDefault: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        categoryId: { type: 'string' },
                        type: { type: 'string', enum: ['income', 'expense'] },
                        amount: { type: 'number' },
                        currency: { type: 'string', default: 'VND' },
                        description: { type: 'string' },
                        transactionDate: { type: 'string', format: 'date-time' },
                        paymentMethod: { 
                            type: 'string', 
                            enum: ['cash', 'bank_transfer', 'credit_card', 'e_wallet', 'other'] 
                        },
                        location: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        notes: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Budget: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        categoryId: { type: 'string' },
                        amount: { type: 'number' },
                        currency: { type: 'string', default: 'VND' },
                        period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                        month: { type: 'number' },
                        year: { type: 'number' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                        spent: { type: 'number' },
                        alertThreshold: { type: 'number' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', default: false },
                        message: { type: 'string' },
                        error: { type: 'string' }
                    }
                }
            }
        },
        tags: [
            { name: 'Health', description: 'Health check endpoints' },
            { name: 'Auth', description: 'Xác thực và đăng nhập' },
            { name: 'Users', description: 'Quản lý người dùng' },
            { name: 'Categories', description: 'Quản lý danh mục thu chi' },
            { name: 'Transactions', description: 'Quản lý giao dịch thu chi' },
            { name: 'Budgets', description: 'Quản lý ngân sách' },
            { name: 'Statistics', description: 'Thống kê và báo cáo' }
        ]
    },
    apis: ['./server.js', './routes/*.js']
};

const specs = swaggerJsDoc(swaggerOptions);

module.exports = { specs, swaggerUi };
