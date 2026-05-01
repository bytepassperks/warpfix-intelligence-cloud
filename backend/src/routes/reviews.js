const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get reviews for a repository
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT r.*, repo.full_name as repo_name 
       FROM reviews r
       LEFT JOIN repositories repo ON repo.id = r.repository_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ reviews: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get public review stats (for webhook-triggered reviews)
router.get('/public-stats', async (req, res) => {
  try {
    const [totalResult, recentResult, issuesResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM reviews`),
      query(
        `SELECT r.id, r.pr_number, r.pr_title, r.created_at, repo.full_name as repo_name 
         FROM reviews r
         LEFT JOIN repositories repo ON repo.id = r.repository_id
         ORDER BY r.created_at DESC LIMIT 20`
      ),
      query(
        `SELECT 
           COALESCE(SUM((review_data->>'critical_count')::int), 0) as critical,
           COALESCE(SUM((review_data->>'warning_count')::int), 0) as warnings,
           COALESCE(SUM((review_data->>'nitpick_count')::int), 0) as nitpicks,
           COALESCE(SUM((review_data->>'praise_count')::int), 0) as praise
         FROM reviews`
      ),
    ]);

    res.json({
      total_reviews: parseInt(totalResult.rows[0].total),
      recent_reviews: recentResult.rows,
      issue_breakdown: issuesResult.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

// Get review detail
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, repo.full_name as repo_name 
       FROM reviews r
       LEFT JOIN repositories repo ON repo.id = r.repository_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ review: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

module.exports = router;
