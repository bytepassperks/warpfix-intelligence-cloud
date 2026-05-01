const express = require('express');
const { query } = require('../models/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT r.id, r.status, r.confidence_score, r.sandbox_passed, r.pr_url,
              r.error_classification, r.created_at,
              repo.full_name as repo_name
       FROM repairs r
       LEFT JOIN repositories repo ON repo.id = r.repository_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const notifications = result.rows.map((r, idx) => {
      let title, desc;
      if (r.sandbox_passed) {
        title = 'CI repair completed';
        desc = `${r.repo_name || 'Repository'} — ${r.error_classification || 'fix'} applied`;
      } else if (r.status === 'failed') {
        title = 'Repair attempt failed';
        desc = `${r.repo_name || 'Repository'} — confidence ${r.confidence_score}/100`;
      } else {
        title = 'Repair in progress';
        desc = `${r.repo_name || 'Repository'} — analyzing CI failure`;
      }

      if (r.pr_url) {
        const prNum = r.pr_url.match(/\/pull\/(\d+)/)?.[1];
        if (prNum) desc = `PR #${prNum} — ${desc}`;
      }

      return {
        id: r.id,
        title,
        desc,
        time: r.created_at,
        unread: idx < 2,
        pr_url: r.pr_url,
      };
    });

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', notifications: [] });
  }
});

module.exports = router;
