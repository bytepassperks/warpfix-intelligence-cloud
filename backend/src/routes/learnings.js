const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get all learnings for user's repos
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT l.*, repo.full_name as repo_name
       FROM learnings l
       LEFT JOIN repositories repo ON repo.id = l.repository_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [userId]
    );
    res.json({ learnings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learnings' });
  }
});

// Get public learnings
router.get('/public', async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, repo.full_name as repo_name
       FROM learnings l
       LEFT JOIN repositories repo ON repo.id = l.repository_id
       ORDER BY l.created_at DESC
       LIMIT 50`
    );
    res.json({ learnings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learnings' });
  }
});

// Create a new learning
router.post('/', requireAuth, async (req, res) => {
  try {
    const { repository_id, rule, category, context, source } = req.body;

    if (!rule) {
      return res.status(400).json({ error: 'Rule is required' });
    }

    const result = await query(
      `INSERT INTO learnings (user_id, repository_id, rule, category, context, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, repository_id, rule, category || 'general', context, source || 'manual']
    );

    res.status(201).json({ learning: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create learning' });
  }
});

// Update a learning
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rule, category, active } = req.body;
    const result = await query(
      `UPDATE learnings SET rule = COALESCE($1, rule), category = COALESCE($2, category),
       active = COALESCE($3, active), updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [rule, category, active, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning not found' });
    }
    res.json({ learning: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update learning' });
  }
});

// Delete a learning
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await query(
      'DELETE FROM learnings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete learning' });
  }
});

// Store learning from PR feedback (internal only — requires internal API key)
router.post('/from-feedback', async (req, res) => {
  const internalKey = req.headers['x-warpfix-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Internal access required' });
  }
  try {
    const { repository_id, user_id, comment_body, pr_number, file_path } = req.body;

    // Extract learning from developer reply to WarpFix review
    const rule = extractLearningFromComment(comment_body);
    if (!rule) {
      return res.json({ stored: false, reason: 'No actionable learning found' });
    }

    const result = await query(
      `INSERT INTO learnings (user_id, repository_id, rule, category, context, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, repository_id, rule, 'feedback', `PR #${pr_number}, ${file_path}`, 'pr_feedback']
    );

    res.status(201).json({ stored: true, learning: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to store learning' });
  }
});

function extractLearningFromComment(comment) {
  if (!comment) return null;

  // Look for explicit instructions
  const patterns = [
    /(?:always|never|prefer|avoid|use|don't)\s+.{10,100}/i,
    /(?:in this repo|in this project|we always|we never|our convention|our pattern)\s+.{10,100}/i,
    /(?:please|should|must)\s+.{10,100}/i,
  ];

  for (const pattern of patterns) {
    const match = comment.match(pattern);
    if (match) return match[0].trim();
  }

  return null;
}

module.exports = router;
