const express = require('express');
const db = require('../db');
const { productToView } = require('../images');
const { requireAuth } = require('../middleware');

const router = express.Router();

const CAT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon
  FROM products p JOIN categories c ON c.id = p.category_id
  WHERE p.active = 1
`;

function list(query, params) {
  return db.prepare(query).all(...params).map(productToView);
}

// GET /api/banners - public carousel slides (admin-managed)
router.get('/banners', (req, res) => {
  const rows = db.prepare('SELECT * FROM banners WHERE active=1 ORDER BY sort ASC, id ASC').all();
  res.json(rows);
});

// GET /api/categories
router.get('/categories', (req, res) => {
  const cats = db.prepare(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
    WHERE c.active = 1
    GROUP BY c.id ORDER BY c.id
  `).all();
  res.json(cats);
});

// GET /api/products?category=&q=&featured=
router.get('/products', (req, res) => {
  const { category, q, featured, sort } = req.query;
  const where = [];
  const params = [];

  where.push('p.active = 1');
  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (featured === '1' || featured === 'true') where.push('p.featured = 1');
  if (q) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  let orderBy = 'p.featured DESC, p.id ASC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'name') orderBy = 'p.name ASC';
  else if (sort === 'newest') orderBy = 'p.id DESC';

  const rows = db.prepare(`${CAT_SELECT} AND ${where.join(' AND ')} ORDER BY ${orderBy}`).all(...params);
  res.json(rows.map(productToView));
});

// GET /api/products/:id
router.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT p.*, c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=? AND p.active=1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(productToView(p));
});

module.exports = router;