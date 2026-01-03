const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Lọc theo loại (thu nhập/chi tiêu)
 *     responses:
 *       200:
 *         description: Danh sách categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const { type } = req.query;

        const filter = {
            // userId,
            isActive: true
        };

        if (type) {
            filter.type = type;
        }

        // const categories = await Category.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'TODO: Implement authentication middleware',
            // data: categories
        });

    } catch (error) {
        console.error('Lỗi lấy categories:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Lấy chi tiết category
 *     tags: [Categories]
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
 *         description: Chi tiết category
 *       404:
 *         description: Không tìm thấy category
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy category'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error('Lỗi lấy category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Tạo category mới
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ăn uống"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: "expense"
 *               icon:
 *                 type: string
 *                 example: "🍔"
 *               color:
 *                 type: string
 *                 example: "#FF5733"
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo category thành công
 */
router.post('/', async (req, res) => {
    try {
        // TODO: Lấy userId từ JWT token
        // const userId = req.user.id;
        const { name, type, icon, color, description } = req.body;

        if (!name || !type) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // const newCategory = new Category({
        //     name,
        //     type,
        //     icon: icon || '💰',
        //     color: color || '#3B82F6',
        //     description,
        //     userId
        // });

        // await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'TODO: Implement authentication middleware',
            // data: newCategory
        });

    } catch (error) {
        console.error('Lỗi tạo category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật category
 *     tags: [Categories]
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

        const category = await Category.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy category'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật category thành công',
            data: category
        });

    } catch (error) {
        console.error('Lỗi cập nhật category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Xóa category (soft delete)
 *     tags: [Categories]
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

        // Soft delete
        const category = await Category.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy category'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa category thành công'
        });

    } catch (error) {
        console.error('Lỗi xóa category:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
