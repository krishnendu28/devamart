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

const PRODUCT_PHOTOS = {
  'DM-031': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Hindu_pooja_thali.jpg/960px-Hindu_pooja_thali.jpg',
  'DM-032': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Decorated_Thali_in_Our_Pooja_Place.jpg/960px-Decorated_Thali_in_Our_Pooja_Place.jpg',
  'DM-033': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Graha_pravesh.jpg',
  'DM-034': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Kalash_puja_in_weddings.jpg/960px-Kalash_puja_in_weddings.jpg',
  'DM-035': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Shree_Satyanarayan_Bhagwan_Puja.jpg/960px-Shree_Satyanarayan_Bhagwan_Puja.jpg',
  'DM-036': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Tiler_Naru_-_Kojagari_Lakshmi_Puja_Offering_-_Bengali_Brahman_Family_-_Howrah_20171005173335.jpg/960px-Tiler_Naru_-_Kojagari_Lakshmi_Puja_Offering_-_Bengali_Brahman_Family_-_Howrah_20171005173335.jpg',
  'DM-037': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Lakshmi_%26_Ganesh_%288062958864%29.jpg/960px-Lakshmi_%26_Ganesh_%288062958864%29.jpg',
  'DM-038': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Saraswati_puja_at_home_02.jpg/960px-Saraswati_puja_at_home_02.jpg',
  'DM-039': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Ganesh_Chaturthi_Celebrations.jpg/960px-Ganesh_Chaturthi_Celebrations.jpg',
  'DM-040': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Shiva_Linga_1.jpg/960px-Shiva_Linga_1.jpg',
  'DM-041': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Shivling-rudra_abhishek_of_lord_shiv.jpg',
  'DM-042': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Hampi_-_Uddana_Veerabhadra_Temple_-_Hanuman_-_2.jpg/960px-Hampi_-_Uddana_Veerabhadra_Temple_-_Hanuman_-_2.jpg',
  'DM-043': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Krishna_janmashtami_5.jpg/960px-Krishna_janmashtami_5.jpg',
  'DM-044': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Idol_of_goddess_Kali_kept_near_Nimtala_ghat_for_Visarjan_or_Immersion_in_the_waters_of_river_Hooghly.jpg/960px-Idol_of_goddess_Kali_kept_near_Nimtala_ghat_for_Visarjan_or_Immersion_in_the_waters_of_river_Hooghly.jpg',
  'DM-045': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Murti_de_la_diosa_Kali%2C_British_Museum.jpg/960px-Murti_de_la_diosa_Kali%2C_British_Museum.jpg',
  'DM-046': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Kolkata_Durga_Puja_Pandle_1.jpg/960px-Kolkata_Durga_Puja_Pandle_1.jpg',
  'DM-047': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Durga_Burdwan_03_10_2011.JPG/960px-Durga_Burdwan_03_10_2011.JPG',
  'DM-048': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Pooja_and_Havan_Kund_1.jpg/960px-Pooja_and_Havan_Kund_1.jpg',
  'DM-049': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Havan_kund_%28_Fire_pit_%29.jpg/960px-Havan_kund_%28_Fire_pit_%29.jpg',
  'DM-050': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Navratri_Golu_-_Dashavatara.JPG/960px-Navratri_Golu_-_Dashavatara.JPG',
  'DM-051': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Ganesha_in_the_Indian_Museum%2C_Kolkata.jpg/960px-Ganesha_in_the_Indian_Museum%2C_Kolkata.jpg',
  'DM-052': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Lakshmi_by_Raja_Ravi_Varma.jpg/960px-Lakshmi_by_Raja_Ravi_Varma.jpg',
  'DM-053': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Saraswati_Murti_ValMorinQC_2007.jpg/960px-Saraswati_Murti_ValMorinQC_2007.jpg',
  'DM-054': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Little_Shiva_edited.jpg/960px-Little_Shiva_edited.jpg',
  'DM-055': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Devi_Durga_Murti_Navaratri_2.jpg',
  'DM-056': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Idol_of_goddess_Kali_kept_near_Nimtala_ghat_for_Visarjan_or_Immersion_in_the_waters_of_river_Hooghly.jpg/960px-Idol_of_goddess_Kali_kept_near_Nimtala_ghat_for_Visarjan_or_Immersion_in_the_waters_of_river_Hooghly.jpg',
  'DM-057': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/A_Krishna_statue_with_flowers_at_Janmashtami.jpg/960px-A_Krishna_statue_with_flowers_at_Janmashtami.jpg',
  'DM-058': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Radha_Krishna_Idol%2C_Lalji_Temple%2C_Kalna.jpg/960px-Radha_Krishna_Idol%2C_Lalji_Temple%2C_Kalna.jpg',
  'DM-059': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Hanuman_Murti%2C_Parmarth_Ashram%2C_Rishikesh.jpg/960px-Hanuman_Murti%2C_Parmarth_Ashram%2C_Rishikesh.jpg',
  'DM-060': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Ram%2C_sita%2C_laxman_murti_01.jpg/960px-Ram%2C_sita%2C_laxman_murti_01.jpg',
  'DM-061': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Idol_of_Jagannath_in_Chariot.jpg/960px-Idol_of_Jagannath_in_Chariot.jpg',
  'DM-062': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Vishnu_figure_in_the_Chandigarh_art_museum_01.jpg/960px-Vishnu_figure_in_the_Chandigarh_art_museum_01.jpg',
  'DM-063': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Statue_of_Vishnu_and_Lakshmi.jpg',
  'DM-064': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Shani_graha.JPG/960px-Shani_graha.JPG',
  'DM-065': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Ganesha_Saraswati_Lakshmi_in_Hindu_Temple_Malaysia.jpg/960px-Ganesha_Saraswati_Lakshmi_in_Hindu_Temple_Malaysia.jpg',
  'DM-066': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/RudrakshaBeads.jpg/960px-RudrakshaBeads.jpg',
  'DM-067': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Rudraksha_Bead.jpg/960px-Rudraksha_Bead.jpg',
  'DM-068': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Elaeocarpus_ganitrus_fruit_or_Rudraksha_fruit.jpg',
  'DM-069': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Rudraksha_mala_with_36_beads_and_108_mukhi%27s.jpg/960px-Rudraksha_mala_with_36_beads_and_108_mukhi%27s.jpg',
  'DM-070': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudraksha_mala.jpg/960px-Rudraksha_mala.jpg',
  'DM-071': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Japa_mala_%28prayer_beads%29_of_Tulasi_wood_with_108_beads_-_20040101-01.jpg',
  'DM-072': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Japamala_com_sementes_de_rudraksha_e_quartzo_rosa.jpg/960px-Japamala_com_sementes_de_rudraksha_e_quartzo_rosa.jpg',
  'DM-073': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Different_types_of_Japa_mala_%28prayer_beads%29_selling_in_Varanasi%2C_India.jpg/960px-Different_types_of_Japa_mala_%28prayer_beads%29_selling_in_Varanasi%2C_India.jpg',
  'DM-074': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Sree_Chakram.JPG/960px-Sree_Chakram.JPG',
  'DM-075': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Navgrah_idols_at_Maa_Durga_Sai_Baba_Temple_in_Orlando.jpg/960px-Navgrah_idols_at_Maa_Durga_Sai_Baba_Temple_in_Orlando.jpg',
  'DM-076': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Kuber_-_Hindu_god_of_wealth.JPG/960px-Kuber_-_Hindu_god_of_wealth.JPG',
  'DM-077': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Ganesha_Yantra.jpg/960px-Ganesha_Yantra.jpg',
  'DM-078': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Durga_Yantra.jpg/960px-Durga_Yantra.jpg',
  'DM-079': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Navgrah_idols_at_Maa_Durga_Sai_Baba_Temple_in_Orlando.jpg/960px-Navgrah_idols_at_Maa_Durga_Sai_Baba_Temple_in_Orlando.jpg',
  'DM-080': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Bracelet_de_b%C3%A9nitier_11-o.lau-F123.LA931.jpg/960px-Bracelet_de_b%C3%A9nitier_11-o.lau-F123.LA931.jpg',
  'DM-081': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Single_clear_quartz%2C_rock_crystal_2.jpg/960px-Single_clear_quartz%2C_rock_crystal_2.jpg',
  'DM-082': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Rose_Quartz_Macro_1.JPG/960px-Rose_Quartz_Macro_1.JPG',
  'DM-083': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Amethyst._Magaliesburg%2C_South_Africa.jpg/960px-Amethyst._Magaliesburg%2C_South_Africa.jpg',
  'DM-084': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Quartz_Citrine_Crystals_in_Their_Natural_Form.jpg',
  'DM-085': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Schorl_-_Galil%C3%A9ia%2C_Minas_Gerais%2C_Brazil.jpg/960px-Schorl_-_Galil%C3%A9ia%2C_Minas_Gerais%2C_Brazil.jpg',
  'DM-086': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Tiger_eye_tumbled_stone_mineral.jpg',
  'DM-087': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Aventurine.jpg',
  'DM-088': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Carnelian_sard_%28mineral_specimen%29.jpg/960px-Carnelian_sard_%28mineral_specimen%29.jpg',
  'DM-089': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Glass_and_rock_crystal_beads_MET_sf151301color.jpg/960px-Glass_and_rock_crystal_beads_MET_sf151301color.jpg',
  'DM-090': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Elbaite-Quartz-Albite-278472.jpg',
  'DM-091': 'https://upload.wikimedia.org/wikipedia/commons/2/23/AMBAGARH_CHOWKI_%2C_BHARAT_MATA_CHOWK.jpg',
  'DM-092': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Radha_Krishna_ISKCON_Mayapur.jpg/960px-Radha_Krishna_ISKCON_Mayapur.jpg',
  'DM-093': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Chhote_Radha_Raman_Deities_Shahji_Temple_Vrindavan.jpg/960px-Chhote_Radha_Raman_Deities_Shahji_Temple_Vrindavan.jpg',
  'DM-094': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/King_Prajadhipok_on_Throne_and_Bearers_of_Royal_Regalia_1925.png/960px-King_Prajadhipok_on_Throne_and_Bearers_of_Royal_Regalia_1925.png',
  'DM-095': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Sojiji_zafus.jpg/960px-Sojiji_zafus.jpg',
  'DM-096': 'https://upload.wikimedia.org/wikipedia/commons/d/de/Sai_Niwas_Home_Mandir.jpg',
  'DM-097': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Box_with_locking_handles%2C_wooden_0096_-_DPLA_-_1e56454ecc79dfc947b2c7495dd30650.jpg/960px-Box_with_locking_handles%2C_wooden_0096_-_DPLA_-_1e56454ecc79dfc947b2c7495dd30650.jpg',
  'DM-098': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Puja_thali.jpg/960px-Puja_thali.jpg',
  'DM-099': 'https://upload.wikimedia.org/wikipedia/commons/2/20/Toran_Embellishments%2C_Great_Stupa%2C_Sanchi.jpg',
  'DM-100': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Rajivalochan_mandir-decoration_in_a_pillar.JPG/960px-Rajivalochan_mandir-decoration_in_a_pillar.JPG',
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
  if (p && p.sku && PRODUCT_PHOTOS[p.sku]) return PRODUCT_PHOTOS[p.sku];
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