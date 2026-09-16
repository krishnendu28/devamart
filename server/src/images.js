const db = require('./db');

const CATEGORY_PHOTOS = {
  'puja-samagri-kits': [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Decorated_Thali_in_Our_Pooja_Place.jpg/960px-Decorated_Thali_in_Our_Pooja_Place.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/fd/Puja_vessels.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Puja_thali.jpg/960px-Puja_thali.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Hindu_pooja_thali.jpg/960px-Hindu_pooja_thali.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Happy_Diwali_-_Festival_of_light.jpg/960px-Happy_Diwali_-_Festival_of_light.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/An_oil_lamp_17_10_2010.JPG/960px-An_oil_lamp_17_10_2010.JPG',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Diya_oil_lamp.jpg/960px-Diya_oil_lamp.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Diya_Lamp.jpg/960px-Diya_Lamp.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Burning_incense_sticks_at_Wutai_Shan.jpg/960px-Burning_incense_sticks_at_Wutai_Shan.jpg',
  ],
  idols: [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_011.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_011.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_020.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_020.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Hindu_idol_3.jpg/960px-Hindu_idol_3.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Lord_Ganesh_idol_of_Hindu_God.jpg/960px-Lord_Ganesh_idol_of_Hindu_God.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/Hand_made_idols_of_Hindu_Gods.jpg/960px-Hand_made_idols_of_Hindu_Gods.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Mahadev-Nageshwar.jpg/960px-Mahadev-Nageshwar.jpg',
  ],
  rudraksha: [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/RudrakshaBeads.jpg/960px-RudrakshaBeads.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudraksha_mala.jpg/960px-Rudraksha_mala.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/45/Elaeocarpus_ganitrus_fruit_or_Rudraksha_fruit.jpg',
  ],
  'healing-crystals': [
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Amethyst._Magaliesburg%2C_South_Africa.jpg/960px-Amethyst._Magaliesburg%2C_South_Africa.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Crystal_Amethyst_IMO_9016911.jpg/960px-Crystal_Amethyst_IMO_9016911.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Amethyst_Crystal_%282933050796%29.jpg/960px-Amethyst_Crystal_%282933050796%29.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Amethyst_crystals_close.jpg/960px-Amethyst_crystals_close.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Rose_Quartz_Macro_1.JPG/960px-Rose_Quartz_Macro_1.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/5/56/Rose_quartz_specimen.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Dendritic_rose_quartz_Caillois_Donation_MNHN.jpg/960px-Dendritic_rose_quartz_Caillois_Donation_MNHN.jpg',
  ],
  'decor-furniture': [
    'https://upload.wikimedia.org/wikipedia/commons/8/8a/Mandir_puja_celebration.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Indian_Arati_diya.jpg/960px-Indian_Arati_diya.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/A_lit_Diyo.jpg/960px-A_lit_Diyo.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/19th-century_Sukunda_ritual_lamp%2C_Newar_Nepal.jpg/960px-19th-century_Sukunda_ritual_lamp%2C_Newar_Nepal.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Kamatchi_Vilakku.jpg/960px-Kamatchi_Vilakku.jpg',
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Diya_Pujan_at_Ganga_Aarti_at_Dashashwamedh_Ghat%2C_Varanasi.jpg/960px-Diya_Pujan_at_Ganga_Aarti_at_Dashashwamedh_Ghat%2C_Varanasi.jpg',
  ],
};

const CATEGORY_COLORS = {
  'puja-samagri-kits': ['#7a1f1f', '#dc9a2d'],
  'idols': ['#5c1f14', '#c98a2d'],
  'rudraksha': ['#4a3b24', '#8a6f3c'],
  'healing-crystals': ['#3d3a5c', '#7b6fae'],
  'decor-furniture': ['#5d3a21', '#b08350'],
  'default': ['#7a1f1f', '#d8a24a'],
};

let catSlugCache = null;
function slugFor(p) {
  if (p && p.category_slug) return p.category_slug;
  if (p && p.category_id != null) {
    if (!catSlugCache) {
      catSlugCache = new Map(db.prepare('SELECT id, slug FROM categories').all().map(c => [c.id, c.slug]));
    }
    return catSlugCache.get(p.category_id) || 'default';
  }
  return 'default';
}

function resolveImage(p) {
  if (p && p.image) return p.image;
  const slug = p ? slugFor(p) : 'default';
  const pool = CATEGORY_PHOTOS[slug] || [];
  const key = p ? (p.product_id ?? p.id ?? 1) : 1;
  if (pool.length) return pool[Math.abs(Number(key) || 1) % pool.length];
  return `/images/placeholder/${key}.svg`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function svgPlaceholder(product, category) {
  const [c1, c2] = CATEGORY_COLORS[(category || {}).slug] || CATEGORY_COLORS.default;
  const name = esc(product.name);
  const sku = esc(product.sku || '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf3e3"/>
      <stop offset="100%" stop-color="#f3e3c3"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <rect x="12" y="12" width="576" height="576" fill="none" stroke="${c1}" stroke-width="4" stroke-dasharray="14 8"/>
  <circle cx="300" cy="270" r="120" fill="${c1}" opacity="0.06"/>
  <circle cx="300" cy="270" r="120" fill="none" stroke="${c1}" stroke-width="3" opacity="0.35"/>
  <text x="300" y="330" font-size="150" text-anchor="middle" fill="${c1}" opacity="0.14" font-family="Nirmala UI, Sakkal Majalla, serif">ॐ</text>
  <text x="300" y="430" font-size="34" font-weight="bold" fill="${c1}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">${name}</text>
  <text x="300" y="470" font-size="22" fill="#8a6a3c" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">DevaMart · Puja &amp; Astrology</text>
  <text x="300" y="520" font-size="18" fill="${c2}" text-anchor="middle" font-family="Consolas, monospace">${sku}</text>
</svg>`;
}

function parseJson(v) { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; } }

function productToView(p) {
  if (!p) return p;
  const view = { ...p, image: resolveImage(p) };
  if (p.checklist != null && p.checklist !== '') view.checklist = typeof p.checklist === 'string' ? parseJson(p.checklist) : p.checklist;
  if (p.instructions != null && p.instructions !== '') view.instructions = typeof p.instructions === 'string' ? parseJson(p.instructions) : p.instructions;
  return view;
}

module.exports = { svgPlaceholder, productToView, resolveImage };