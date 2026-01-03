const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [cash, bank, ewallet, credit-card, investment, other]
 *         balance:
 *           type: number
 *         currency:
 *           type: string
 *           default: VND
 *         description:
 *           type: string
 *         icon:
 *           type: string
 *         color:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get all wallets for the user
 *     tags: [Wallets]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive wallets
 *     responses:
 *       200:
 *         description: List of wallets with total balance
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Get userId from JWT token
    const { userId } = req.query;
    const { includeInactive } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const filter = { userId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const wallets = await Wallet.find(filter).sort({ createdAt: -1 });
    
    // Calculate total balance across all wallets
    const totalBalance = wallets.reduce((sum, wallet) => {
      if (wallet.isActive) {
        return sum + wallet.balance;
      }
      return sum;
    }, 0);

    res.json({ 
      success: true, 
      data: {
        wallets,
        totalBalance,
        count: wallets.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallets', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   get:
 *     summary: Get wallet by ID
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet details
 */
router.get('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    
    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }

    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wallet', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Create a new wallet
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet created successfully
 */
router.post('/', async (req, res) => {
  try {
    const wallet = new Wallet(req.body);
    await wallet.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Wallet created successfully', 
      data: wallet 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error creating wallet', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   put:
 *     summary: Update a wallet
 *     tags: [Wallets]
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
 *         description: Wallet updated successfully
 */
router.put('/:id', async (req, res) => {
  try {
    // Allow balance updates for initial setup or corrections
    // Note: Regular balance changes should still go through transactions
    
    const wallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Wallet updated successfully', 
      data: wallet 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error updating wallet', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/wallets/{id}:
 *   delete:
 *     summary: Delete (deactivate) a wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet deactivated successfully
 */
router.delete('/:id', async (req, res) => {
  try {
    // Soft delete - just mark as inactive
    const wallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Wallet deactivated successfully', 
      data: wallet 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting wallet', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/wallets/{id}/transactions:
 *   get:
 *     summary: Get transactions for a specific wallet
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of wallet transactions
 */
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ walletId: id })
      .populate('categoryId', 'name icon color type')
      .populate('walletId', 'name type')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ walletId: id });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet transactions',
      error: error.message
    });
  }
});

module.exports = router;
