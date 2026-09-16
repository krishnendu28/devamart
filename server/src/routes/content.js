const express = require('express');
const db = require('../db');

const router = express.Router();

const TERMS = {
  title: 'Terms & Conditions',
  updated: 'September 2026',
  sections: [
    ['1. Acceptance of Terms', 'By accessing or purchasing from DevaMart you agree to these Terms & Conditions. If you do not agree, please do not use the platform.'],
    ['2. Products & Descriptions', 'Puja kits, samagri, idols, rudraksha, yantras, crystals and décor are sourced and packed with care. Handmade and natural products may carry slight variations in colour, texture or finish. Such variation is not a defect.'],
    ['3. Authenticity Policy', 'Where authenticity matters (rudraksha, yantras, crystals, gemstones), products are verified and shipped with an authenticity card. If verification fails, we offer a full replacement or refund.'],
    ['4. Wellness Disclaimer', 'Healing crystals and spiritual accessories are sold for spiritual, cultural and wellness practices only. They are not medicines and must not be treated as a cure, treatment or substitute for professional medical advice.'],
    ['5. Pricing & Payment', 'All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise. You may pay by Cash on Delivery (COD) or through supported online UPI gateways (Google Pay, PhonePe, Paytm and other UPI apps).'],
    ['6. Shipping', 'Orders above ₹499 ship free; a flat ₹49 applies below that. Dispatch is typically within 24–48 hours. Delivery usually takes 3–6 working days depending on the destination.'],
    ['7. Cancellation, Returns & Refunds', 'Report damaged, broken or wrong items within 48 hours of delivery with an unboxing photo/video for a replacement or refund. Opened crystals and perishable samagri cannot be returned for hygiene reasons. Refunds for prepaid orders are credited to the original payment method within 5–7 working days.'],
    ['8. Order Tracking', 'Every order carries a unique order number starting with “DM”. You can track it live under “Track Order”.'],
    ['9. Prohibited Use', 'You agree not to misuse the platform, place fraudulent orders, or scrape/copy our content, images or catalogue.'],
    ['10. Limitation of Liability', 'DevaMart’s liability in any dispute is limited to the value of the affected order. We are not liable for indirect or consequential losses.'],
    ['11. Governing Law', 'These terms are governed by the laws of India, with jurisdiction in the courts of the seller’s registered location.'],
  ],
};

const PRIVACY = {
  title: 'Privacy Policy',
  updated: 'September 2026',
  sections: [
    ['1. Information We Collect', 'We collect the information you provide when you sign up or order: name, email, phone number, delivery address and order details. We do not store your card or UPI PIN — online payments are processed by the payment gateway.'],
    ['2. How We Use It', 'Your data is used to create your account, process and deliver orders, provide support, send order updates and improve our services.'],
    ['3. Sharing', 'We share only what is necessary with delivery partners and payment gateways to fulfil your order. We never sell your personal data.'],
    ['4. Cookies & Storage', 'We use browser storage to keep you logged in and to remember your cart. You can clear this any time from your browser.'],
    ['5. Security', 'Passwords are stored in hashed form and access to the admin panel is role-restricted. We use industry-standard safeguards, though no system can be guaranteed 100% secure.'],
    ['6. Your Rights', 'You may request access, correction or deletion of your account data by writing to support@devamart.in.'],
    ['7. Children', 'Our services are intended for users 18 years and above. We do not knowingly collect data from minors.'],
    ['8. Changes', 'We may update this policy from time to time. The latest version will always be available on this page.'],
  ],
};

const ABOUT = {
  title: 'About DevaMart',
  tagline: 'Your trusted partner in devotion, tradition and spiritual wellness.',
  body: [
    'DevaMart was born from a simple belief — that devotion should never be complicated. Arranging the right samagri, finding a pure rudraksha, or organising a complete Griha Pravesh kit often means running to multiple shops and still missing something.',
    'So we curated everything a household needs for daily and festive worship: ready-to-use Puja Kits with researched item checklists and instructions, beautifully crafted idols, verified rudraksha and yantras, healing crystals for wellness, and puja décor that makes your mandir feel special.',
    'Every kit is assembled by hand. Every authenticity-sensitive product is checked. Every order is packed with the respect a ritual deserves.',
    'Today DevaMart serves families, temples, societies and event organisers across India. We are on a mission to make authentic, affordable and complete puja shopping available to everyone — delivered to the doorstep.',
  ],
  values: [
    ['Authenticity', 'Verified sourcing and authenticity cards on rudraksha, yantras and crystals.'],
    ['Completeness', 'Kits with real item checklists and step-by-step instructions — nothing missing.'],
    ['Affordability', 'Honest pricing with kits starting at ₹499 and free delivery above ₹499.'],
    ['Respect', 'Handcrafted packing and support that understands your rituals and timings.'],
  ],
};

router.get('/terms', (req, res) => res.json(TERMS));
router.get('/privacy', (req, res) => res.json(PRIVACY));
router.get('/about', (req, res) => res.json(ABOUT));

router.get('/contact', (req, res) => {
  res.json({
    title: 'Contact Us',
    email: 'support@devamart.in',
    phone: '+91 90000 00000',
    whatsapp: '+91 90000 00000',
    hours: 'Mon – Sun, 9:00 AM – 8:00 PM IST',
    address: 'DevaMart Spiritual Store, 2nd Floor, Temple Road, Bengaluru, Karnataka 560001',
  });
});

router.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !message) return res.status(400).json({ error: 'Name and message are required' });
  db.prepare('INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)')
    .run(name.trim(), email || null, phone || null, String(message).slice(0, 4000));
  res.status(201).json({ ok: true, message: 'Thank you! Our team will get back to you within one working day.' });
});

module.exports = router;