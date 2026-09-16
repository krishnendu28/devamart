// DevaMart in-built chatbot knowledge base.
// Simple, fast keyword-intent matcher - no external API required.

const KB = [
  {
    id: 'greeting',
    keys: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening'],
    answer: 'Namaste, welcome to DevaMart! I can help you with puja kits, idols, rudraksha, healing crystals, prices, orders, delivery and payment. What would you like to know?',
  },
  {
    id: 'puja_kit',
    keys: ['puja kit', 'pooja kit', 'samagri', 'kit contents', 'what is in', 'kit include', 'starter kit', 'premium kit'],
    answer: 'Our Puja Kits are complete, ready-to-use sets. We have Daily Puja Starter (₹499), Daily Puja Premium (₹899), Griha Pravesh Essential (₹1,099), Griha Pravesh Premium (₹1,999), Satyanarayan (₹1,199), Lakshmi (₹899), Lakshmi-Ganesh (₹1,099), Saraswati (₹899), Ganesh (₹799), Shiv (₹799), Shivratri (₹899), Hanuman (₹799), Janmashtami (₹899), Kali Essential (₹1,299), Kali Premium (₹2,199), Durga Home (₹1,699), Durga Premium (₹2,999), Havan Essential (₹899), Havan Premium (₹1,499) and Navratri (₹999). Every kit has a researched item checklist and printed instructions.',
  },
  {
    id: 'idols',
    keys: ['idol', 'murti', 'bigraha', 'ganesha', 'ganesh', 'lakshmi', 'saraswati', 'shiva', 'durga', 'kali', 'krishna', 'hanuman', 'ram', 'jagannath', 'vishnu', 'shani'],
    answer: 'We stock 15 idol designs: Ganesha, Lakshmi, Saraswati, Shiva, Durga, Kali, Krishna, Radha-Krishna, Hanuman, Ram Darbar, Jagannath Trio, Vishnu, Lakshmi-Narayan, Shani Dev and the Ganesh-Lakshmi pair. Small & medium sizes start at ₹499. Material/size variants are added as demand grows.',
  },
  {
    id: 'rudraksha',
    keys: ['rudraksha', 'mukhi', 'mala', 'tulsi', 'sphatik', 'yantra', 'pendant', 'bracelet'],
    answer: 'Our Rudraksha range includes 5/6/7/8 Mukhi beads (₹199–₹449), Rudraksha Mala (₹899), Tulsi Mala (₹299), Sphatik Mala (₹499), Crystal Mala (₹599), Shri Yantra (₹649), Navagraha Yantra (₹799), Kuber Yantra (₹549), Ganesh & Durga Yantras (₹449), Navagraha Pendant (₹699) and Rudraksha Bracelet (₹349). Every authenticity-sensitive product ships with a certification/authenticity card.',
  },
  {
    id: 'crystals',
    keys: ['crystal', 'quartz', 'amethyst', 'citrine', 'tourmaline', 'tiger', 'aventurine', 'carnelian', 'chakra'],
    answer: 'We offer Clear Quartz, Rose Quartz, Amethyst, Citrine, Black Tourmaline, Tiger Eye, Green Aventurine, Carnelian, a Crystal Bracelet and the 7-Chakra Set (₹249–₹999). These are for spiritual wellness and meditation practices — they are not medical treatments or cures.',
  },
  {
    id: 'decor',
    keys: ['chowki', 'singhasan', 'asana', 'décor', 'decor', 'thali', 'toran', 'mandir', 'storage box', 'furniture'],
    answer: 'Our Décor & Furniture range: Wooden Puja Chowki (₹999), Decorative Chowki (₹799), Small Idol Singhasan (₹549), Brass Singhasan (₹899), Puja Asana (₹249), Mandir Backdrop (₹399), Puja Storage Box (₹649), Decorative Puja Thali (₹299), Mandir Toran (₹249) and Puja Decoration Set (₹499).',
  },
  {
    id: 'authenticity',
    keys: ['authentic', 'genuine', 'original', 'real', 'fake', 'verification', 'certified', 'certificate'],
    answer: 'Trust matters to us. Rudraksha, yantras and crystals go through a verification/authenticity policy — each such product carries an authenticity card and lab-checked sourcing. If any authenticity-sensitive item fails verification, we replace or refund it fully.',
  },
  {
    id: 'price',
    keys: ['price', 'cost', 'how much', 'rate', 'kitna', 'paisa', 'cheap', 'discount'],
    answer: 'Prices range from ₹49 for samagri to ₹2,999 for premium puja kits. Every product page shows the price and MRP with the discount. Orders above ₹499 get FREE delivery; below that a flat ₹49 shipping applies.',
  },
  {
    id: 'shipping',
    keys: ['shipping', 'delivery', 'deliver', 'courier', 'how long', 'kab', 'when will', 'free delivery'],
    answer: 'We deliver across India. Orders above ₹499 ship FREE; otherwise it is ₹49. Typical dispatch is within 24–48 hours and delivery takes 3–6 working days depending on your pincode. You can track live status — Packed → Shipped → On The Way → Delivered.',
  },
  {
    id: 'track',
    keys: ['track', 'tracking', 'where is my order', 'order status', 'status of order', 'kaha'],
    answer: 'To track your order go to “Track Order” in the menu and enter your order number (starts with DM). You will see a live timeline: Order Placed → Packed → Shipped → On The Way → Delivered. You can also see it under My Orders.',
  },
  {
    id: 'payment',
    keys: ['payment', 'pay', 'cod', 'cash on delivery', 'upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'online'],
    answer: 'You can pay by Cash on Delivery (COD) or online. Online payments support Google Pay, PhonePe, Paytm and other UPI apps. Admin sees every order immediately — both prepaid and COD.',
  },
  {
    id: 'returns',
    keys: ['return', 'refund', 'replace', 'exchange', 'damaged', 'broken', 'wrong item'],
    answer: 'If an item arrives damaged, broken or wrong, raise a request within 48 hours with an unboxing photo/video and we will replace or refund it. Perishable samagri and opened crystals cannot be returned for hygiene reasons. See Terms & Conditions for the full policy.',
  },
  {
    id: 'order_help',
    keys: ['order', 'buy', 'purchase', 'how to order', 'add to cart', 'checkout'],
    answer: 'Ordering is simple: (1) Browse Shop or Explore, (2) tap Add to Cart, (3) open Cart, (4) Checkout with your full address, (5) choose COD or Online payment, (6) place the order. You will get an order number to track.',
  },
  {
    id: 'account',
    keys: ['account', 'login', 'signup', 'sign up', 'register', 'password', 'forgot'],
    answer: 'Tap the account icon to Sign Up or Login with your name, email and password. Your cart and orders are saved to your account. If you forgot your password, contact support and we will help you reset it.',
  },
  {
    id: 'contact',
    keys: ['contact', 'support', 'help', 'call', 'phone', 'email', 'whatsapp', 'helpline'],
    answer: 'You can reach us at support@devamart.in or on WhatsApp +91 90000 00000, 9 AM – 8 PM IST. You can also use the Contact Us page to send us a message and we will reply within one working day.',
  },
  {
    id: 'muhurat',
    keys: ['muhurat', 'auspicious', 'shubh', 'time', 'tithi', 'panchang', 'puja time', 'when to do puja'],
    answer: 'For most home poojas, the shubh muhurat is during Brahma Muhurat (approx 4:30–6:00 AM) or in the evening aarti period. For major ceremonies like Griha Pravesh or Satyanarayan, we recommend checking the daily panchang or consulting your family priest. Our kit booklets list the ideal steps and timings.',
  },
  {
    id: 'bulk',
    keys: ['bulk', 'wholesale', 'reseller', 'large quantity', 'corporate', 'dealer'],
    answer: 'Yes! We support bulk and wholesale orders for temples, societies, event houses and resellers. Share quantity and pincode via Contact Us and our team will send a special quote within 24 hours.',
  },
  {
    id: 'thank',
    keys: ['thank', 'thanks', 'dhanyavad', 'shukriya'],
    answer: 'You are most welcome. May your pooja bring peace and prosperity. Anything else I can help with?',
  },
];

const FALLBACK = 'I am not fully sure about that yet, but our team can help. You can ask me about puja kits, idols, rudraksha, healing crystals, prices, delivery, COD/online payment, order tracking or returns. Or reach us at support@devamart.in / WhatsApp +91 90000 00000.';

function score(message, keys) {
  const text = message.toLowerCase();
  let s = 0;
  for (const k of keys) {
    if (text.includes(k)) s += k.split(' ').length * 2 + k.length / 10;
  }
  return s;
}

function getAnswer(message) {
  const text = String(message || '').toLowerCase().trim();
  if (!text) return { intent: 'fallback', answer: FALLBACK, suggestions: defaultSuggestions() };

  let best = null;
  let bestScore = 0;
  for (const entry of KB) {
    const s = score(text, entry.keys);
    if (s > bestScore) { bestScore = s; best = entry; }
  }
  if (!best || bestScore === 0) {
    return { intent: 'fallback', answer: FALLBACK, suggestions: defaultSuggestions() };
  }
  return { intent: best.id, answer: best.answer, suggestions: defaultSuggestions() };
}

function defaultSuggestions() {
  return ['Puja kit prices', 'Track my order', 'Payment options', 'Healing crystals', 'Return policy'];
}

function welcome() {
  return {
    intent: 'welcome',
    answer: 'Namaste, I am Devam, your DevaMart assistant. Ask me anything about our puja kits, idols, rudraksha, crystals, delivery, payment or order tracking.',
    suggestions: defaultSuggestions(),
  };
}

module.exports = { getAnswer, welcome };