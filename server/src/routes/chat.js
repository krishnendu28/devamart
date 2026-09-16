const express = require('express');
const db = require('../db');
const { getAnswer, welcome } = require('../chatbot');

const router = express.Router();

// GET /api/chat/welcome
router.get('/welcome', (req, res) => res.json(welcome()));

// POST /api/chat { message, userId? }
router.post('/', (req, res) => {
  const { message, userId } = req.body || {};
  if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required' });

  const result = getAnswer(message);
  try {
    db.prepare('INSERT INTO chatbot_messages (user_id, sender, message) VALUES (?,?,?)').run(userId || null, 'user', String(message).slice(0, 1000));
    db.prepare('INSERT INTO chatbot_messages (user_id, sender, message) VALUES (?,?,?)').run(userId || null, 'bot', result.answer);
  } catch (e) { /* non-critical */ }

  res.json({ reply: result.answer, intent: result.intent, suggestions: result.suggestions });
});

module.exports = router;