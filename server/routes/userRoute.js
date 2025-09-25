const express = require('express');
const router = express.Router();
const pool = require('../configs/db'); 
const {protect} = require('../middlewares/authMiddlware'); 
router.get('/profile', protect, async (req, res) => {
    try {
        const userId = req.user.id; 
        const result = await pool.query(
            'SELECT username, email FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const user = result.rows[0];
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;