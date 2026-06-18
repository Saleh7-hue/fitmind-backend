const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user subscriptions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.name as plan_name, p.name_ar, p.price, p.features
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Create subscription (called after successful payment)
router.post('/', authenticateToken, async (req, res) => {
  const { plan_id, payment_method, payment_id, amount_paid } = req.body;

  if (!plan_id) {
    return res.status(400).json({ error: 'plan_id is required' });
  }

  try {
    const plan = await pool.query(
      'SELECT * FROM plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );
    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.rows[0].duration_months);

    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, payment_method, payment_id, amount_paid, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, plan_id, payment_method, payment_id, amount_paid || plan.rows[0].price, endDate]
    );

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Cancel subscription
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE subscriptions SET status='cancelled'
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription cancelled', subscription: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
