#!/usr/bin/env node
/**
 * DevaMart AI Test - semantic QA over the live/public catalogue, chatbot and
 * content pages.
 *
 * Two judge modes:
 *   1. VISION LLM (real AI): set AI_API_KEY (OpenAI-compatible) + optional
 *      AI_BASE_URL and AI_MODEL. Fetches each product image and asks the model
 *      whether it matches the product name. Also judges chatbot answers.
 *   2. HEURISTIC fallback: no key required. Uses the curated EXPECT map built
 *      from the manual AI review (DM-xxx -> expected image subject) plus
 *      URL reachability + chatbot keyword coverage.
 *
 * Usage:
 *   node ai-test.js [BASE_URL]        (default https://devamart-api.vercel.app)
 * Options:
 *   AI_API_KEY=... AI_MODEL=gpt-4o-mini AI_BASE_URL=https://api.openai.com/v1
 */
const BASE = process.argv[2] || process.env.BASE_URL || 'https://devamart-api.vercel.app';
const API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_BASE = process.env.AI_BASE_URL || 'https://api.openai.com/v1';

/* ---- Curated AI-review ground truth: SKU -> expected image subject ------- */
const EXPECT = {
  'DM-031': 'hindu pooja thali',
  'DM-032': 'decorated thali',
  'DM-033': 'graha pravesh',
  'DM-034': 'kalash puja',
  'DM-035': 'satyanarayan',
  'DM-036': 'lakshmi puja offering',
  'DM-037': 'lakshmi ganesh',
  'DM-038': 'saraswati puja',
  'DM-039': 'ganesh chaturthi',
  'DM-040': 'shiva linga',
  'DM-041': 'shivling abhishek',
  'DM-042': 'hanuman',
  'DM-043': 'krishna janmashtami',
  'DM-044': 'kali idol',
  'DM-045': 'kali murti',
  'DM-046': 'durga puja',
  'DM-047': 'durga puja',
  'DM-048': 'havan kund',
  'DM-049': 'havan kund',
  'DM-050': 'navratri',
  'DM-051': 'ganesha',
  'DM-052': 'lakshmi',
  'DM-053': 'saraswati',
  'DM-054': 'shiva',
  'DM-055': 'durga murti',
  'DM-056': 'kali idol',
  'DM-057': 'krishna statue',
  'DM-058': 'radha krishna',
  'DM-059': 'hanuman',
  'DM-060': 'ram sita laxman',
  'DM-061': 'jagannath idol',
  'DM-062': 'vishnu',
  'DM-063': 'vishnu lakshmi',
  'DM-064': 'shani graha',
  'DM-065': 'ganesha lakshmi',
  'DM-066': 'rudraksha beads',
  'DM-067': 'rudraksha bead',
  'DM-068': 'rudraksha fruit',
  'DM-069': 'rudraksha mala',
  'DM-070': 'rudraksha mala',
  'DM-071': 'tulasi wood mala',
  'DM-072': 'rudraksha quartz mala',
  'DM-073': 'japa mala prayer beads',
  'DM-074': 'sri chakra shri yantra',
  'DM-075': 'navgrah idols',
  'DM-076': 'kuber',
  'DM-077': 'ganesha yantra',
  'DM-078': 'durga yantra',
  'DM-079': 'navgrah idols',
  'DM-080': 'bracelet',
  'DM-081': 'clear quartz',
  'DM-082': 'rose quartz',
  'DM-083': 'amethyst',
  'DM-084': 'citrine',
  'DM-085': 'tourmaline schorl',
  'DM-086': 'tiger eye stone',
  'DM-087': 'aventurine',
  'DM-088': 'carnelian',
  'DM-089': 'rock crystal beads',
  'DM-090': 'quartz elbaite multi',
  'DM-091': 'chowki',
  'DM-092': 'radha krishna altar',
  'DM-093': 'radha raman deities',
  'DM-094': 'throne',
  'DM-095': 'zafu cushion',
  'DM-096': 'home mandir',
  'DM-097': 'wooden box',
  'DM-098': 'puja thali',
  'DM-099': 'toran',
  'DM-100': 'mandir decoration',
};
/* Subjects that must NOT appear in the resolved image for a given SKU. */
const FORBID = {
  'DM-044': ['british museum'],
  'DM-045': ['nimtala'],
  'DM-086': ['panthera', 'amur tiger'],
  'DM-057': ['papilio', 'peacock'],
  'DM-041': ['bull', 'yanamalakuduru'],
  'DM-048': ['varzea', 'brazil'],
  'DM-074': ['river'],
  'DM-075': ['river'],
  'DM-076': ['river'],
  'DM-077': ['river', 'temple'],
  'DM-078': ['river'],
  'DM-072': ['falesina', 'river'],
  'DM-073': ['falesina', 'river'],
  'DM-095': ['dog', 'assche', 'frescoes', 'syria'],
  'DM-093': ['king prajadhipok', 'regalia'],
  'DM-096': ['khmer', 'wat phou', 'laos'],
  'DM-100': ['khmer', 'wat phou', 'laos'],
};
/* ---- Chatbot intent QA -------------------------------------------------- */
const CHAT_INTENTS = [
  { q: 'Do you have puja kits?', kw: ['kit', 'puja'], label: 'puja-kit' },
  { q: 'How can I track my order?', kw: ['track', 'order'], label: 'tracking' },
  { q: 'Can I pay cash on delivery?', kw: ['cod', 'cash', 'delivery'], label: 'payment' },
  { q: 'Do you deliver all over India?', kw: ['deliver', 'india'], label: 'delivery' },
  { q: 'hello', kw: [], label: 'greeting/should-not-error' },
  { q: 'what is your refund policy', kw: [], label: 'fallback-or-answer' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'DevaMart-AITest/1.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}

function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

/* --- Heuristic judge ---------------------------------------------------- */
function heuristicJudge(product) {
  const name = norm(product.name);
  const img = (product.image || '').toLowerCase();
  const exp = (EXPECT[product.sku] || '').toLowerCase();
  const forb = FORBID[product.sku] || [];
  let score = 0;
  const notes = [];
  const expTokens = exp.split(' ').filter(t => t.length > 3);
  const matched = expTokens.filter(t => img.includes(t));
  score += Math.min(matched.length, 3);
  const forbHit = forb.some(f => img.includes(f));
  if (forbHit) { score -= 3; notes.push('forbidden subject present: ' + forb.join(',')); }
  const nameTokens = name.split(' ').filter(t => t.length > 3 && !['puja', 'rare', 'pair', 'set', 'with', 'and'].includes(t));
  const nameHit = nameTokens.filter(t => img.includes(t)).length;
  score += Math.min(nameHit, 2);
  const verdict = forbHit ? 'FAIL' : (matched.length >= 1 || nameHit >= 1 ? 'PASS' : (score >= 1 ? 'WARN' : 'FAIL'));
  return { verdict, score, notes };
}

/* --- Vision LLM judge --------------------------------------------------- */
async function llmJudge(product) {
  const prompt = `You are a product-photo QA bot. Does the image match the product "${product.name}" (${product.sku})? Ignore that it may be stock/photographic art. Answer JSON only: {"match": true|false, "reason": "one short sentence"}.`;
  const body = {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: product.image } },
      ],
    }],
    max_tokens: 90,
    temperature: 0,
  };
  const r = await fetch(`${AI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const txt = j.choices?.[0]?.message?.content || '{}';
  const m = txt.match(/\{[^}]*\}/);
  const parsed = m ? JSON.parse(m[0]) : { match: false, reason: 'unparsable: ' + txt.slice(0, 80) };
  return { verdict: parsed.match ? 'PASS' : 'FAIL', score: parsed.match ? 3 : -3, notes: [parsed.reason] };
}

async function chatJudge(respText, kw) {
  if (API_KEY) {
    const r = await fetch(`${AI_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: `A devotional-store chatbot answered: """${respText}"""\nDoes this answer stay on-topic and helpful for the question? Say ONLY "true" or "false".` }],
        max_tokens: 8, temperature: 0,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (r.ok) {
      const j = await r.json();
      return String(j.choices?.[0]?.message?.content || '').trim().toLowerCase().startsWith('true');
    }
  }
  if (!kw.length) {
    // generic intents must still return something sensible (non-error, non-empty)
    const n = norm(respText);
    return n.length >= 10 && !n.includes('sorry') ? true : n.length >= 4;
  }
  return kw.some(k => norm(respText).includes(k));
}

(async () => {
  const results = { mode: API_KEY ? `vision-LLM (${MODEL})` : 'heuristic (AI-reviewed ground truth map)', base: BASE, products: [], chatbot: [], content: [], reachable: { ok: 0, total: 0, throttled: 0, bad: [] } };
  let fail = 0;
  console.log(`\n=== DevaMart AI Test ===\nbase: ${BASE}\njudge: ${results.mode}\n`);

  // 1. Catalogue
  const cats = await getJson(`${BASE}/api/categories`);
  const products = await getJson(`${BASE}/api/products`);
  console.log(`catalog: ${products.length} products, ${cats.length} categories`);
  if (products.length !== 70) { fail++; console.log('  FAIL: expected 70 products'); }
  if (cats.length !== 5) { fail++; console.log('  FAIL: expected 5 categories'); }

  for (const p of products) {
    let j;
    if (API_KEY) { j = await llmJudge(p).catch(e => ({ verdict: 'LLM-ERR', score: 0, notes: [e.message] })); await sleep(250); }
    else j = heuristicJudge(p);
    results.products.push({ sku: p.sku, name: p.name, verdict: j.verdict, score: j.score, notes: j.notes, image: p.image });
    if (j.verdict === 'FAIL') fail++;
    // reachability (throttled, retry once on 429; 429 = host rate-limit, not broken)
    try {
      let r = await fetch(p.image, { method: 'HEAD', redirect: 'follow' });
      if (r.status === 429) { await sleep(1600); r = await fetch(p.image, { method: 'HEAD', redirect: 'follow' }); }
      results.reachable.total++;
      if (r.status === 200) results.reachable.ok++;
      else if (r.status === 429) results.reachable.throttled = (results.reachable.throttled || 0) + 1, results.reachable.bad.push(`${p.sku} 429(throttle)`);
      else results.reachable.bad.push(`${p.sku} ${r.status}`);
    } catch (e) { results.reachable.bad.push(`${p.sku} ERR`); }
    await sleep(220);
  }
  // unique images
  const imgs = products.map(p => p.image);
  if (new Set(imgs).size < imgs.length) console.log(`  note: ${imgs.length - new Set(imgs).size} duplicate images (intentional share)`);

  const badP = results.products.filter(x => x.verdict !== 'PASS');
  console.log(`product semantic checks: ${results.products.length - badP.length}/${products.length} PASS`);
  badP.forEach(x => console.log(`  ${x.verdict} ${x.sku} ${x.name} :: ${(x.notes || []).join('; ') || '?'}`));

  // 2. Chatbot
  console.log('\nchatbot intents:');
  for (const it of CHAT_INTENTS) {
    let r = null;
    for (let t = 0; t < 2 && !r; t++) {
      r = await fetch(`${BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: it.q }) }).then(x => x.json()).catch(() => null);
      if (!r) await sleep(900);
    }
    const ok = r && r.reply ? await chatJudge(r.reply, it.kw) : false;
    results.chatbot.push({ q: it.q, ok, answer: (r?.reply || '').slice(0, 90) });
    console.log(`  ${ok ? 'PASS' : 'FAIL'} [${it.label}] "${it.q}"`);
    if (!ok) fail++;
    await sleep(120);
  }

  // 3. Content pages
  console.log('\ncontent pages:');
  for (const slug of ['about', 'terms', 'privacy', 'contact']) {
    const page = await getJson(`${BASE}/api/content/${slug}`);
    let text = '';
    if (Array.isArray(page.sections)) text = [page.title, page.updated].concat(page.sections.map(s => Array.isArray(s) ? s.join(' ') : s)).join(' ');
    else if (Array.isArray(page.body)) text = [page.title, page.tagline].concat(page.body).join(' ');
    else text = JSON.stringify(page);
    const len = String(text).length;
    const pass = slug === 'contact' ? len > 40 : len > 400;
    results.content.push({ slug, len, ok: pass });
    console.log(`  ${pass ? 'PASS' : 'WARN'} ${slug} (${len} chars)`);
  }

  // 4. Contact endpoint carries phone
  const contact = await getJson(`${BASE}/api/content/contact`);
  const phoneOk = /(\+91 90381 50556|9038150556)/.test(contact.phone + contact.whatsapp);
  results.contact = { phone: contact.phone, whatsapp: contact.whatsapp, ok: phoneOk };
  console.log(`contact phone ${phoneOk ? 'PASS' : 'FAIL'}: ${contact.phone} / ${contact.whatsapp}`);
  if (!phoneOk) fail++;

  console.log(`\nimage reachability: ${results.reachable.ok}/${results.reachable.total}${results.reachable.throttled ? ` (+${results.reachable.throttled} throttled)` : ''}${results.reachable.bad.length ? '  BAD: ' + results.reachable.bad.join(', ') : ''}`);
  if (results.reachable.bad.length) fail++;

  console.log(`\n=== AI TEST ${fail ? `FAILED (${fail})` : 'PASSED'} ===`);
  require('fs').writeFileSync('ai-test-report.json', JSON.stringify(results, null, 2));
  process.exit(fail ? 1 : 0);
})();