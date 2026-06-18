const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all active plans
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE is_active = true ORDER BY price ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get single plan
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE id = $1 AND is_active = true',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

module.exports = router;
