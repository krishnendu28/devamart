const bcrypt = require('bcryptjs');
const db = require('./db');

const CATEGORIES = [
  ['puja-samagri-kits', 'Puja Samagri & Kits', '🪔', 'Complete puja kits and essential samagri for daily and festive worship'],
  ['idols', 'Bigraha / Idols', '🛕', 'Beautiful murtis and idols of your favourite deities'],
  ['rudraksha', 'Rudraksha & Malas', '📿', 'Genuine rudraksha, yantras and sacred malas'],
  ['healing-crystals', 'Healing Crystals', '💎', 'Natural healing crystals and spiritual wellness stones'],
  ['decor-furniture', 'Puja Décor & Furniture', '🏺', 'Puja chowki, singhasan, thali and mandir décor'],
];

const BANNERS = [
  ['Diwali Lakshmi Puja Offer', 'Kits from ₹899 · Free delivery above ₹499', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80', 'center', '/shop?category=puja-samagri-kits'],
  ['Rudraksha & Healing Crystals', 'Verified beads · Chakra décor for mindful living', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80', 'center', '/shop?category=rudraksha'],
  ['Navratri / Festive Season', 'Griha Pravesh, Satyanarayan & special havan kits ready', 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1600&q=80', 'center', '/shop'],
];

const PRODUCTS = [
  // ---------- B. Puja Kits (31-50) ----------
  ['puja-samagri-kits', 'DM-031', 'Daily Puja Starter Kit', 499, 649, 'Everything you need for everyday worship: kapoor, agarbatti, diyas, roli-akshat, kumkum, matchbox and pooja instructions. Includes 16 items.', 100, 1],
  ['puja-samagri-kits', 'DM-032', 'Daily Puja Premium Kit', 899, 1199, 'Premium daily pooja set with 24 items - silver-chandan, bel patra, tulsi leaves, premium agarbatti, ghee diyas, kalash and more with booklet.', 80, 1],
  ['puja-samagri-kits', 'DM-033', 'Griha Pravesh Essential Kit', 1099, 1399, 'House-warming essentials: kalash, supari, moong, betel leaves, swastik chowki peeth, akshat, roli, gomutra & navgraha siddhi. 18 items.', 60],
  ['puja-samagri-kits', 'DM-034', 'Griha Pravesh Premium Kit', 1999, 2499, 'Complete griha pravesh pooja: includes brass kalash set, shankh, ghanta, swastik, camphor, dried fruits, navgraha havan samagri. 30+ items.', 40],
  ['puja-samagri-kits', 'DM-035', 'Satyanarayan Puja Kit', 1199, 1499, 'Full Satyanarayan katha kit - betel leaves, dry fruits, banana, roli, akshat, supari, panchaamrit items and printed katha booklet. Ideal for family puja.', 70],
  ['puja-samagri-kits', 'DM-036', 'Lakshmi Puja Essential Kit', 899, 1199, 'Diwali Lakshmi puja essentials: 5 mukhi rudraksha, kalash, nakli chandi ka vark, lotus seeds, supari, bhog samagri and red chunri. 20 items.', 80, 1],
  ['puja-samagri-kits', 'DM-037', 'Lakshmi-Ganesh Puja Kit', 1099, 1399, 'Combined Lakshmi-Ganesh kit for Diwali & Dhanteras - includes both deity chowki, kalash pair, akshat, roli, itra, kapoor, lotus & bhog. 22 items.', 60],
  ['puja-samagri-kits', 'DM-038', 'Saraswati Puja Kit', 899, 1199, 'Saraswati (Vasant Panchami) kit - pita lepan (haldi-chandan), kalash, adhivastra, pens & books bhog, murti decoration samagri & aarti booklet.', 70],
  ['puja-samagri-kits', 'DM-039', 'Ganesh Puja Kit', 799, 999, 'Ganesh chaturthi essentials - modak papers, dhurva grass, red flowers, kalash, chowki, roli-akshat and 21 durva ganesh decoration items.', 90],
  ['puja-samagri-kits', 'DM-040', 'Shiv Puja Kit', 799, 999, 'Shivling abhishek kit - bel patra, dhatura, bhang leaves, milk, honey, gangajal, roli chandan and shiv murti decoration products. 18 items.', 90],
  ['puja-samagri-kits', 'DM-041', 'Shivratri Puja Kit', 899, 1199, 'Maha Shivratri special: rudraksha, vibhuti, gangajal, belpatra mala, panchamrit elements, clay shivling and bhajan booklet. 20 items.', 60],
  ['puja-samagri-kits', 'DM-042', 'Hanuman Puja Kit', 799, 999, 'Hanuman ji pooja kit - sindoor, chandan, tulsi, gud chane bhog, kapoor, aarti & hanuman chalisa print. 16 items.', 100],
  ['puja-samagri-kits', 'DM-043', 'Janmashtami Puja Kit', 899, 1199, 'Krishna janmashtami kit - swings decoration, peacock feather, makhan-mishri bhog items, kalash, panchamrit and bhog thali. 18 items.', 60],
  ['puja-samagri-kits', 'DM-044', 'Kali Puja Essential Kit', 1299, 1699, 'Kali puja sidhi kit - red hibiscus, sindoor, bhailog items, kalash, chowki and complete samagri for night puja. 20 items.', 40],
  ['puja-samagri-kits', 'DM-045', 'Kali Puja Premium Kit', 2199, 2699, 'Premium kali puja kit with 28 items - includes gomutra, ghritam, madhu, navgraha samagri, kapoor, murti decoration set and printed vidhi.', 25],
  ['puja-samagri-kits', 'DM-046', 'Durga Puja Home Kit', 1699, 2099, 'Durga puja essentials for home - 16 shringar items, kalash, kumkum, chandan, itra, sindoor, pancha ratan & devi murti decoration kit.', 40],
  ['puja-samagri-kits', 'DM-047', 'Durga Puja Premium Home Kit', 2999, 3499, 'Grand durga puja home kit - 35+ items including 108 belpatra, silk vasrra, shringar samagri, dhunuchi, naivaidya and printed puja vidhi.', 20],
  ['puja-samagri-kits', 'DM-048', 'Havan Essential Kit', 899, 1199, 'Havan kit - navgraha samagri, samidha, ghee, chandan, kapoor, akshat, havan kund smaller size and havan mantras booklet.', 70],
  ['puja-samagri-kits', 'DM-049', 'Havan Premium Kit', 1499, 1899, 'Complete havan kit with wooden havan kund, 40 havan dravyas, samidha, ghee can, spirulina ghee, aahuti items & sankalp vidhi booklet.', 40],
  ['puja-samagri-kits', 'DM-050', 'Navratri Puja Kit', 999, 1299, 'Navratri kit - devi murti decoration, kumkum, ghagra-chunri, kalash, navarna rice, akshat, bhog (halwa samagri) and aarti collection.', 60],

  // ---------- C. Idols (51-65) ----------
  ['idols', 'DM-051', 'Ganesha Idol', 599, 799, 'Beautifully crafted Ganesha murti (small) in a festive finish. Brings good beginnings and removes obstacles.', 50, 1],
  ['idols', 'DM-052', 'Lakshmi Idol', 549, 749, 'Shree Lakshmi murti (small) - goddess of wealth and prosperity. Ideal for daily pooja and diwali.', 50, 1],
  ['idols', 'DM-053', 'Saraswati Idol', 549, 749, 'Goddess Saraswati idol (small) - goddess of knowledge, music and arts. Perfect for students and artists.', 50],
  ['idols', 'DM-054', 'Shiva Idol', 499, 699, 'Shiva murti (small) - lord of meditation and destruction of evil. Calm, meditative posture.', 60, 1],
  ['idols', 'DM-055', 'Durga Idol', 649, 849, 'Devi Durga idol (small) - symbol of shakti and protection with artistic detailing.', 40],
  ['idols', 'DM-056', 'Kali Idol', 699, 899, 'Maa Kali idol (small) - fierce form of the goddess, protector against negativity.', 40],
  ['idols', 'DM-057', 'Krishna Idol', 549, 749, 'Bal Krishna murti (small) - lord with flute, cutest additions to any home mandir.', 60, 1],
  ['idols', 'DM-058', 'Radha-Krishna Idol', 799, 999, 'Radha-Krishna idol (small) - symbol of divine love. Handcrafted with fine detailing.', 40],
  ['idols', 'DM-059', 'Hanuman Idol', 499, 699, 'Hanuman ji murti (small) - symbol of strength, devotion and protection from fear.', 60],
  ['idols', 'DM-060', 'Ram Darbar Idol', 1299, 1599, 'Ram Darbar set (small) - Lord Ram, Sita, Lakshman and Hanuman. Beautifully crafted family set.', 30],
  ['idols', 'DM-061', 'Jagannath Trio Idol', 1499, 1799, 'Jagannath, Balabhadra & Subhadra trio (small) - beloved Puri temple style idols.', 25],
  ['idols', 'DM-062', 'Vishnu Idol', 649, 849, 'Lord Vishnu idol (small) - protector and preserver of the universe, reclining or standing posture options.', 40],
  ['idols', 'DM-063', 'Lakshmi-Narayan Pair', 799, 999, 'Lakshmi-Narayan pair (small) - prosperity and harmony for your home mandir.', 35],
  ['idols', 'DM-064', 'Shani Dev Idol', 549, 749, 'Shani Dev idol (small) - black stone finish, for Shani pooja on Saturdays.', 45],
  ['idols', 'DM-065', 'Ganesh-Lakshmi Pair', 749, 949, 'Ganesh-Lakshmi pair (small) - most auspicious combination for wealth and wisdom.', 40],

  // ---------- D. Rudraksha & Sacred Accessories (66-80) ----------
  ['rudraksha', 'DM-066', '5 Mukhi Rudraksha', 199, 299, 'Genuine 5 mukhi rudraksha bead - for health and calm mind. With authenticity card.', 200, 1],
  ['rudraksha', 'DM-067', '6 Mukhi Rudraksha', 249, 349, '6 mukhi rudraksha - associated with Lord Kartikeya, boosts concentration and career.', 200],
  ['rudraksha', 'DM-068', '7 Mukhi Rudraksha', 399, 549, '7 mukhi rudraksha - brings wealth and good fortune. Ideal for Lakshmi blessings.', 150],
  ['rudraksha', 'DM-069', '8 Mukhi Rudraksha', 449, 599, '8 mukhi rudraksha - for overcoming obstacles & protection. Auspicious for Lord Ganesh.', 150],
  ['rudraksha', 'DM-070', 'Rudraksha Mala', 899, 1199, '108 beads 5-mukhi rudraksha mala with silk thread and tassel. Certified +1 spare bead.', 80, 1],
  ['rudraksha', 'DM-071', 'Tulsi Mala', 299, 399, 'Panchavati tulsi mala (108 beads) - spiritual mala for chanting and protection.', 150],
  ['rudraksha', 'DM-072', 'Sphatik Mala', 499, 649, 'Sphatik (crystal) mala - clear quartz beads, great for meditation and mantra japa.', 100],
  ['rudraksha', 'DM-073', 'Crystal Mala', 599, 799, 'Elegant healing crystal mala - selected for its calming energy. 108 beads with tassel.', 80],
  ['rudraksha', 'DM-074', 'Shri Yantra', 649, 849, 'Shri Yantra on copper plate - most powerful yantra for wealth, prosperity and harmony.', 60, 1],
  ['rudraksha', 'DM-075', 'Navagraha Yantra', 799, 999, 'Navagraha yantra - balances all nine planetary energies. Includes puja instructions.', 50],
  ['rudraksha', 'DM-076', 'Kuber Yantra', 549, 749, 'Kuber yantra - for attracting wealth and financial stability. Recommended for shop/home.', 60],
  ['rudraksha', 'DM-077', 'Ganesh Yantra', 449, 599, 'Ganesh yantra - removes obstacles, bestows wisdom and success in new ventures.', 70],
  ['rudraksha', 'DM-078', 'Durga Yantra', 449, 599, 'Durga yantra - protection from negativity and evil eye, courage and strength.', 70],
  ['rudraksha', 'DM-079', 'Navagraha Pendant', 699, 899, 'Navagraha pendant with all nine gems - wearable astrology accessory on gold-plated chain.', 60],
  ['rudraksha', 'DM-080', 'Rudraksha Bracelet', 349, 499, 'Elegant 5-mukhi rudraksha bracelet - wearable protection and calm energy all day.', 100],

  // ---------- E. Healing Crystals (81-90) ----------
  ['healing-crystals', 'DM-081', 'Clear Quartz', 249, 349, 'Natural clear quartz point (15-20g) - amplify energy, clarity of thought. For meditation and décor.', 100, 1],
  ['healing-crystals', 'DM-082', 'Rose Quartz', 249, 349, 'Rose quartz tumbled stone - stone of love, self-compassion and emotional healing.', 100],
  ['healing-crystals', 'DM-083', 'Amethyst', 349, 449, 'Amethyst cluster/piece (12-18g) - calming stone for stress relief and better sleep.', 100, 1],
  ['healing-crystals', 'DM-084', 'Citrine', 349, 449, 'Citrine tumbled stone - abundance, positivity and personal power (natural sunny color).', 90],
  ['healing-crystals', 'DM-085', 'Black Tourmaline', 299, 399, 'Black tourmaline - grounding and protective stone that shields from negative energy.', 90],
  ['healing-crystals', 'DM-086', 'Tiger Eye', 279, 379, 'Tiger eye stone - courage, confidence and focus. Beautiful golden brown bands.', 90],
  ['healing-crystals', 'DM-087', 'Green Aventurine', 299, 399, 'Green aventurine - luck, prosperity and heart healing. Gentle uplifting energy.', 90],
  ['healing-crystals', 'DM-088', 'Carnelian', 299, 399, 'Carnelian tumbled stone - motivation, creativity and vitality. Warm orange energy.', 90],
  ['healing-crystals', 'DM-089', 'Crystal Bracelet', 449, 599, 'Adjustable bracelet of selected healing crystals - wearable daily wellness companion.', 80, 1],
  ['healing-crystals', 'DM-090', '7-Chakra Crystal Set', 999, 1299, 'Complete 7-chakra stone set (red jasper to amethyst) - for chakra balancing and meditation. Boxed.', 40, 1],

  // ---------- F. Décor & Puja Furniture (91-100) ----------
  ['decor-furniture', 'DM-091', 'Wooden Puja Chowki', 999, 1299, 'Handcrafted teak-finish wooden puja chowki (10x10 inch) - sturdy base for murti placement.', 60, 1],
  ['decor-furniture', 'DM-092', 'Decorative Chowki', 799, 999, 'Decorative carved wooden chowki with auspicious motifs - perfect for home mandir.', 60],
  ['decor-furniture', 'DM-093', 'Small Idol Singhasan', 549, 749, 'Small wooden singhasan (throne) for idols - elegant peti style with carvings.', 80],
  ['decor-furniture', 'DM-094', 'Brass Idol Singhasan', 899, 1199, 'Polished brass singhasan platform - premium look for your murti in the mandir.', 50],
  ['decor-furniture', 'DM-095', 'Puja Asana', 249, 349, 'Comfortable red-cotton puja asana (cushion) - for seating during prayer and meditation.', 150],
  ['decor-furniture', 'DM-096', 'Mandir Backdrop', 399, 549, 'Beautiful mandir wallpaper backdrop with Om & lotus design - instantly refreshes your pooja corner.', 100],
  ['decor-furniture', 'DM-097', 'Puja Storage Box', 649, 849, 'Compact spiritual storage box to organise puja samagri - aarti items, roli, kumkum & wicks.', 80],
  ['decor-furniture', 'DM-098', 'Decorative Puja Thali', 299, 399, 'Embossed decorative puja thali with lid - used for aarti and bhog offerings.', 120, 1],
  ['decor-furniture', 'DM-099', 'Mandir Toran', 249, 349, 'Colourful mango-leaf string toran for mandir & door décor - festive and auspicious.', 150],
  ['decor-furniture', 'DM-100', 'Puja Decoration Set', 499, 699, 'Complete mandir decoration set - toran, tinsel, led garland and bhog plate accents.', 80],
];

const FEATURED_EXTRA = [];

const KIT_DETAILS = {
  'DM-031': {
    checklist: [
      'Bhimseni camphor (kapoor) – 25 g sachet',
      'Sandalwood agarbatti – 10 sticks',
      'Hand-rolled cotton wicks – 20 pcs',
      'Brass katori diya – 1 pc',
      'Cow ghee – 100 ml',
      'Roli for tilak – 20 g',
      'Akshat (raw rice + turmeric) – 100 g',
      'Chandan powder – 20 g',
      'Kumkum – 20 g',
      'Haldi – 20 g',
      'Matchbox – 1 pc',
      'Aarti bell (ghanti) – 1 pc',
      'Fresh flower petals (gulal) – 1 pouch',
      'Plain paper for sankalp – 4 sheets'
    ],
    instructions: [
      'Bathe or wipe the idols, and clean the puja corner.',
      'Fill the brass katori with ghee, place one cotton wick and light the diya.',
      'Apply a roli + akshat tilak on the idols and then on yourself.',
      'Light 1–2 agarbatti sticks and offer flower petals to the deity.',
      'Ring the bell and perform aarti by rotating the thali 3 times clockwise.',
      'Offer a fruit or sweet as naivedya, then distribute prasad.'
    ]
  },
  'DM-032': {
    checklist: [
      'Bhimseni camphor – 25 g',
      'Silver-grade chandan covers (chandan chhap) – 6 pcs',
      'Dehydrated bel patra – 21 leaves',
      'Dried tulsi leaves – 1 pouch',
      'Premium sandalwood agarbatti – 20 sticks',
      'Brass ghee katoras – 2 pcs',
      'Cotton wicks – 30 pcs',
      'Cow ghee – 100 ml',
      'Small brass kalash – 1 pc',
      'Roli, kumkum, akshat, haldi – 4 separate pouches',
      'Aarti bell – 1 pc',
      'Matchbox – 1 pc',
      'Itra (attar) – 5 ml',
      'Illustrated daily puja guide – 1 booklet'
    ],
    instructions: [
      'Set up the pooja with the brass kalash filled with water and a tulsi leaf on top.',
      'Light both brass katori diyas with ghee and cotton wicks.',
      'Apply chandan chhap / roli tilak on the deity and yourself.',
      'Chant any preferred mantra (e.g. Om Namah Shivaya) a minimum of 21 times.',
      'Offer bel patra and tulsi leaves while reciting the deity-specific mantra.',
      'Close with aarti and offer naivedya; put out lamps only after aarti.'
    ]
  },
  'DM-033': {
    checklist: [
      'Polished brass kalash – 1 pc',
      'Dry coconut (wrapped) – 1 pc',
      'Mango leaves – 5 pcs',
      'Supari – 5 pcs',
      'Puffed/roasted moong – 100 g',
      'Akshat – 100 g',
      'Roli – 20 g',
      'Haldi – 50 g',
      'Betel leaves – 5 pcs',
      'Swastik chowki peeth (wooden) – 1 pc',
      'Gomutra (cow urine) – 50 ml',
      'Gangajal – 100 ml',
      'Bhimseni camphor – 25 g',
      'Dhoop sticks – 10 pcs',
      'Navgraha siddhi packet – 1 pc',
      'Silver foil (vark) – 1 small pack',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc'
    ],
    instructions: [
      'The previous night, soak the brass kalash in water and keep a mustard-oil lamp burning (akhand diya).',
      'On the day of griha pravesh, fill the kalash with water, place mango leaves and the coconut on top, and set it on the swastik peeth.',
      'The family enters the new home right foot first after sprinkling gangajal & gomutra at the entrance.',
      'Sprinkle gangajal + gomutra in every room, especially corners, while reciting the Vastu Gayatri.',
      'Perform a small Ganesha puja, then the havan/agni sthapana as per the booklet.',
      'Conclude with aarti and distribute prasad after offering naivedya.'
    ]
  },
  'DM-034': {
    checklist: [
      'Large brass kalash with lid – 1 pc',
      'Brass shankh – 1 pc',
      'Brass ghanta (bell) – 1 pc',
      'Swastik chowki peeth – 1 pc',
      'Dry coconut + mango leaves – 1 set',
      'Assorted dry fruits – 200 g',
      'Betel leaves – 10 pcs',
      'Supari – 10 pcs',
      'Roli, akshat, kumkum, haldi – 4 pouches',
      'Gomutra – 100 ml',
      'Gangajal – 200 ml',
      'Navgraha havan samagri – 200 g',
      'Samidha sticks – 20 pcs',
      'Cow ghee – 200 ml',
      'Bhimseni camphor – 50 g',
      'Dhoop + agarbatti – 20 sticks',
      'Silver foil – 1 small pack',
      'Cotton wicks – 20 pcs',
      'Matchbox – 1 pc',
      'Printed griha pravesh vidhi booklet – 1 pc'
    ],
    instructions: [
      'Set the kalash on the swastik peeth with mango leaves and coconut; light the akhand diya the night before.',
      'Worship Ganesha and the navgraha (nine planets) first with the samagri provided.',
      'Perform a full havan: 108 aahutis of ghee, samidha and havan samagri while chanting the Gayatri.',
      'Make the family enter right foot first amid bells; sprinkle gangajal/gomutra in every room.',
      'Offer dry fruits and naivedya, then do aarti with shankh and ghanta.',
      'Distribute prasad and complete the sankalp by donating something in the family name.'
    ]
  },
  'DM-035': {
    checklist: [
      'Satyanarayan katha booklet – 1 pc',
      'Betel leaves – 10 pcs',
      'Supari – 6 pcs',
      'Assorted dry fruits (kaju-kishmish) – 200 g',
      'Dry coconut – 1 pc',
      'Banana – bring fresh at home (4 pcs)',
      'Roli – 20 g',
      'Akshat – 100 g',
      'Chandan powder – 20 g',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Panchaamrit set (milk, curd, ghee, honey, sugar) – mini pouches',
      'Jaggery (gud) – 200 g',
      'Wheat flour (for halwa/prasad) – 200 g',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc'
    ],
    instructions: [
      'Bathe or wipe the idols, and observe the sankalp for the katha (morning, before noon).',
      'Invoke Ganesha, then place the Satyanarayan image with the kalash and light the lamp.',
      'Prepare panchaamrit and halwa as naivedya; offer banana and dry fruits too.',
      'Recite the 5 adhyayas (chapters) of the Satyanarayan katha, offering naivedya after each chapter.',
      'Perform the final aarti and the purnaahuti, then serve prasad to all present.',
      'Complete the vrat by breaking silence/vow only after katha is finished.'
    ]
  },
  'DM-036': {
    checklist: [
      'Geni (small) 5-mukhi rudraksha – 1 pc',
      'Chandi ka vark (silver foil) – 1 small pack',
      'Small brass kalash – 1 pc',
      'Lotus seeds (kamal gatta) – 50 g',
      'Red chunri (dupatta) – 1 pc',
      'Supari – 5 pcs',
      'Betel leaves – 5 pcs',
      'Roli, kumkum, akshat, haldi – 4 pouches',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Itra (attar) – 5 ml',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Lakshmi aarti & mantra card – 1 pc'
    ],
    instructions: [
      'Place the rudraksha on a bed of lotus seeds and keep the chunri red over the Lakshmi image/kalash.',
      'Fill the kalash with water, add vark and akshat, and set it in the puja area.',
      'Light the ghee diyas in the evening (best at dusk) and offer agarbatti & itra.',
      'Chant "Om Shreem Mahalakshmiyei Namah" 108 times while offering flowers.',
      'Offer bhog (sweet) and keep the silver vark for the image as a symbol of prosperity.',
      'Conclude with the Lakshmi aarti and keep the diya burning as long as possible.'
    ]
  },
  'DM-037': {
    checklist: [
      'Mini wooden chowkis – 2 pcs',
      'Kalash pair – 2 pcs',
      'Lakshmi-Ganesh image frame – 1 pc',
      'Red chunri – 1 pc',
      'Lotus seeds – 50 g',
      'Akshat, roli, kumkum, haldi – 4 pouches',
      'Itra (attar) – 5 ml',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Chandi ka vark – 1 small pack',
      'Betel leaves – 5 pcs',
      'Supari – 5 pcs',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Bhog (dry fruits + mishri) – 200 g',
      'Aarti + Lakshmi-Ganesh katha card – 1 pc'
    ],
    instructions: [
      'Place Lakshmi on the right chowki and Ganesha on the left, both over the red chunri.',
      'Fill both kalashes with water, add vark, akshat, and set mango-topped lids.',
      'Light ghee diyas at dusk and offer camphor first to Ganesha, then Lakshmi.',
      'Chant Ganesha mantra 21 times, then Lakshmi mantra 108 times.',
      'Offer mishri-fruit bhog and perform aarti to both deities together.',
      'Distribute prasad; keep the lamp burning till night for Dhanteras/Diwali energy.'
    ]
  },
  'DM-038': {
    checklist: [
      'Pita lepan kit (haldi + chandan paste) – 1 pc',
      'Brass kalash – 1 pc',
      'Yellow adhivastra (cloth) – 1 pc',
      'Marigold petals – 1 pouch',
      'Decor moti (beads) – 1 small pack',
      'Pens + small notebook (knowledge bhog) – 1 set',
      'Roli – 20 g',
      'Akshat – 50 g',
      'Itra (attar) – 5 ml',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Saraswati aarti card – 1 pc'
    ],
    instructions: [
      'Wear yellow/white clothes; apply the pita lepan (haldi-chandan) as the first offering.',
      'Drape the yellow adhivastra over the Saraswati image and place the kalash.',
      'Offer the pens and notebook as "vidya bhog" (symbol of knowledge).',
      'Light the lamp, offer marigold petals and itra.',
      'Chant "Om Aim Saraswati Namah" 108 times.',
      'Perform aarti; then "pad puja" – touch and seek blessings.'
    ]
  },
  'DM-039': {
    checklist: [
      'Modak (paper) moulds – 10 pcs',
      'Dhurva (durva) grass – 1 bundle',
      'Red flower / marigold petals – 1 pouch',
      '21-leaf durva garland – 1 pc',
      'Brass kalash – 1 pc',
      'Mini wooden chowki – 1 pc',
      'Roli – 20 g',
      'Akshat – 50 g',
      'Dry coconut – 1 pc',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Ladoo / modak bhog – 200 g',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc'
    ],
    instructions: [
      'Install the Ganesha murti/image on the covered chowki and set the kalash.',
      'Offer 21 durva leaves (3 blades each) while chanting "Om Sum Ganpataye Namah".',
      'Offer red flowers and the 21-leaf garland.',
      'Light the lamp, then perform abhishek items if any, offering modak as bhog.',
      'Chant "Om Gan Ganpataye Namah" 108 times.',
      'Conclude with Ganesha aarti and distribute modak/ladoo prasad.'
    ]
  },
  'DM-040': {
    checklist: [
      'Dehydrated bel patra – 21 leaves',
      'Dhatura – 5 pcs',
      'Dried bhang leaves – 1 pouch',
      'Open-top milk pouch – 200 ml',
      'Honey – 50 ml',
      'Cow ghee – 50 ml',
      'Gangajal – 100 ml',
      'Curd – 50 ml',
      'Roli – 20 g',
      'Chandan powder – 20 g',
      '5-mukhi rudraksha – 1 pc',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc'
    ],
    instructions: [
      'Perform abhishek of the shivling/murti in order: water, gangajal, milk, curd, honey, then ghee (5 amritas).',
      'Wipe the linga and apply chandan; place rudraksha on it.',
      'Offer 21 bel patra leaves and 5 dhatura, chanting "Om Namah Shivaya" each time.',
      'Offer gangajal to the murti and to the devotees\' heads (optional).',
      'Light the lamp, offer bhang and agarbatti, and do 11 rounds of Om Namah Shivaya.',
      'Conclude with Shiv aarti and distribute prasad (boondi/barfi).'
    ]
  },
  'DM-041': {
    checklist: [
      'Terracotta (clay) shivling – 1 pc',
      '27-bead 5-mukhi rudraksha mala – 1 pc',
      'Vibhuti (sacred ash) – 20 g',
      'Gangajal – 100 ml',
      'Dehydrated bel patra – 21 leaves',
      'Dhatura – 5 pcs',
      'Panchaamrit set (milk, curd, ghee, honey, sugar) – mini pouches',
      'Cow ghee – 50 ml',
      'Cotton wicks – 10 pcs',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Matchbox – 1 pc',
      'Shivratri bhajan + katha card – 1 pc'
    ],
    instructions: [
      'Keep the clay shivling in the puja; observe a fast from sunrise (if you choose to).',
      'Perform panchaamrit abhishek at night (chaturth prahar), offering bel patra and dhatura.',
      'Light the akhand diya and keep it burning across all four prahars of the night.',
      'Chant "Om Namah Shivaya" 108 times per prahar using the rudraksha mala.',
      'Read the Shivratri katha in the middle vigil.',
      'Break the fast after the morning aarti on the next day.'
    ]
  },
  'DM-042': {
    checklist: [
      'Sindoor – 25 g',
      'Chandan powder – 20 g',
      'Dried tulsi leaves – 1 pouch',
      'Gud + chana (jaggery & roasted chickpeas) – 200 g',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 10 sticks',
      'Cotton wicks – 10 pcs',
      'Cow ghee – 50 ml',
      'Matchbox – 1 pc',
      'Laminated Hanuman Chalisa – 1 pc',
      'Hanuman aarti card – 1 pc',
      'Kesari (saffron) flag – 1 pc'
    ],
    instructions: [
      'Apply sindoor (as the "chola") and chandan to the Hanuman murti on every visit.',
      'Offer tulsi leaves (never bel patra to Hanuman).',
      'Light the ghee diya and burn camphor in front of the murti.',
      'Recite the Hanuman Chalisa (or at least 1 doha) after lighting the lamp.',
      'Offer gud-chana (churma style) as bhog on Saturdays.',
      'Conclude with Hanuman aarti; keep the kesari flag near the murti.'
    ]
  },
  'DM-043': {
    checklist: [
      'Mini jhula (swing) for bal-krishna – 1 pc',
      'Peacock feather – 1 pc',
      'Makhan-mishri bhog – 200 g',
      'Brass kalash – 1 pc',
      'Panchaamrit set (milk, curd, ghee, honey, sugar) – mini pouches',
      'Decorative bhog thali – 1 pc',
      'Dried tulsi leaves – 1 pouch',
      'Agarbatti – 10 sticks',
      'Bhimseni camphor – 25 g',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Krishna aarti card – 1 pc'
    ],
    instructions: [
      'Dress the bal-krishna murti, give the peacock feather, and place him in the swing (jhula).',
      'Light the akhand diya to mark Krishna\'s birth at midnight on Janmashtami.',
      'Offer makhan-mishri and panchaamrit as first bhog (no grains on the fasting day).',
      'Rock the jhula gently while chanting "Om Namo Bhagavate Vasudevaya".',
      'Read the Krishna avatar katha; stay awake till midnight.',
      'Perform aarti at midnight and distribute the makhan-mishri prasad.'
    ]
  },
  'DM-044': {
    checklist: [
      'Red hibiscus flowers (dried) – 2 pouches',
      'Sindoor – 50 g',
      'Bhailog (betel-leaf pack for offered items) – 1 pc',
      'Brass kalash – 1 pc',
      'Mini wooden chowki – 1 pc',
      'Gomutra – 50 ml',
      'Bhimseni camphor – 50 g',
      'Agarbatti – 10 sticks',
      'Roli – 20 g',
      'Kumkum – 20 g',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Kali aarti card – 1 pc'
    ],
    instructions: [
      'Perform the puja at night (especially on Kali Puja / Amavasya).',
      'Offer red hibiscus flowers and sindoor to the Devi murti.',
      'Light camphor and ghee diyas in a dark corner after sunset.',
      'Chant "Om Kreem Kalikayai Namah" 108 times (any multiple, minimum 54).',
      'Offer bhailog and naivedya, then invoke protection for the household.',
      'Conclude with Kali aarti; avoid eating till the puja is complete.'
    ]
  },
  'DM-045': {
    checklist: [
      'Everything in the Kali Essential kit, plus:',
      'Statue-ready red chunri – 1 pc',
      'Brass ghanta – 1 pc',
      'Brass shankh – 1 pc',
      'Navgraha samagri packet – 200 g',
      'Silver foil (vark) – 1 small pack',
      'Red flower mala (108 pcs) – 1 pc',
      'Gomutra – 100 ml',
      'Printed Kali puja vidhi booklet – 1 pc',
      'Extra camphor – 50 g',
      'Bhog (coconut + rice + jaggery) pack – 1 pc'
    ],
    instructions: [
      'Set the mandala with the red chunri; install the murti and decorate with the 108 red flower mala.',
      'Dress/worship the Devi, applying sindoor and offering hibiscus.',
      'Perform kalash sthapana, then the "shodashi" shringar as per the vidhi booklet.',
      'Chant Kali panchakshari / tripura mantra as guided (use the booklet for timing).',
      'Burn gomutra-offering in the prescribed manner and offer bhailog/naivedya.',
      'Close with aarti, ring the ghanta and shankh, and distribute prasad after the ritual.'
    ]
  },
  'DM-046': {
    checklist: [
      '16-item shringar set (sindoor, bindi, alta, kajal, chunri, gajra, etc.) – 1 set',
      'Brass kalash – 1 pc',
      'Kumkum – 30 g',
      'Chandan powder – 20 g',
      'Itra (attar) – 5 ml',
      'Sindoor – 25 g',
      'Pancha ratna (5 grains) – 100 g',
      'Murti decoration kit (geta/dora, moti) – 1 pc',
      'Agarbatti – 10 sticks',
      'Bhimseni camphor – 25 g',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Bhog halwa kit (sooji, ghee, sugar, dry fruits) – 1 pack',
      'Durga aarti card – 1 pc'
    ],
    instructions: [
      'Establish the Devi (ghat sthapana) with kalash and light the akhand diya.',
      'Perform the 16 shringar as offering to the murti (as a "suhagin" would).',
      'Offer kumkum, chandan, itra and pancha ratna while chanting "Sarva Mangala Mangalye".',
      'Prepare halwa bhog separately; offer it as naivedya twice a day.',
      'Light camphor and dhoop, and do the Durga aarti each evening.',
      'Distribute prasad among family; on day 9 perform the kanya pujan.'
    ]
  },
  'DM-047': {
    checklist: [
      'Everything in the Durga Home kit, plus:',
      'Silk vastra (yellow/red) – 1 pc',
      '108 bel patra mala – 1 pc',
      'Brass dhunuchi holder – 1 pc',
      'Gold/red dupatta (ghiwa) – 1 pc',
      'Panchamrit set – 1 pc',
      'Havan samagri – 200 g',
      'Full shringar set (deluxe) – 1 pc',
      'Brass ghanta + shankh – 1 set',
      'Printed Durga puja vidhi booklet – 1 pc',
      'Naivedya pack (coconut, rice, mishri) – 1 pc',
      'Extra agarbatti + dhoop – 20 sticks',
      'Extra cow ghee – 100 ml'
    ],
    instructions: [
      'Set up the mandala with ghiwa, install the murti, and drape the silk vastra.',
      'Decorate with the 108 bel patra mala; fill kalash with navarna rice.',
      'Follow the printed vidhi: kalash sthapana, shodashi shringar, and 16 upchar puja.',
      'Perform the dhunuchi dance/offering during evening aarti using the dhunuchi holder.',
      'Do the havan (navagraha) after the main puja on the 8th day.',
      'On the final day perform the visarjan rituals and distribute prasad widely.'
    ]
  },
  'DM-048': {
    checklist: [
      'Copper havan kund (small) – 1 pc',
      'Navgraha havan samagri – 200 g',
      'Samidha sticks – 20 pcs',
      'Cow ghee – 200 ml',
      'Chandan powder – 20 g',
      'Bhimseni camphor – 25 g',
      'Akshat – 100 g',
      'Havan spoon (sruva) – 1 pc',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Dhoop/agarbatti – 10 sticks',
      'Printed havan mantras booklet – 1 pc'
    ],
    instructions: [
      'Place the kund facing east; do the sankalp (vow) for the purpose of the havan.',
      'Invoke Ganesha first, then the navgraha with their individual avahan.',
      'Light the fire, and offer 108 aahutis mixing ghee + havan samagri + sacred words.',
      'Use the sruva to offer ghee; never touch the fire directly.',
      'End with the poornahuti and havan aarti; keep ash (bhasma) respectfully.',
      'Distribute prasad after the fire is extinguished.'
    ]
  },
  'DM-049': {
    checklist: [
      'Wooden havan kund – 1 pc',
      '40 havan dravyas pack – 1 pc',
      'Samidha bundle – 20+ pcs',
      'Ghee can – 500 ml',
      'Aahuti items (milk, honey, sugar, til, rice, mung) – set',
      'Two havan spoons (sruva + sruk) – 2 pcs',
      'Chandan powder – 20 g',
      'Bhimseni camphor – 50 g',
      'Kumkum – 20 g',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Sankalp + mantras vidhi booklet – 1 pc'
    ],
    instructions: [
      'Set the wooden kund east-facing; keep the dravyas in accessible bowls.',
      'Do sankalp, invoke Ganesha and navgraha with the prescribed mantras.',
      'Light the fire, then perform up to 108 aahutis using different dravyas per step.',
      'Add milk, honey, sugar, ghee and dry fruits as per the booklet sequence.',
      'Conclude with poornahuti and havan aarti; keep the ash for tilak.',
      'Serve prasad; the havan area should be cleaned only after fire cools.'
    ]
  },
  'DM-050': {
    checklist: [
      'Devi murti decoration set (chunri + shringar) – 1 pc',
      'Kumkum jar – 50 g',
      'Ghagra-chunri for kanya pujan – 1 set',
      'Brass kalash – 1 pc',
      'Navarna rice mix (9 grains) – 200 g',
      'Akshat – 100 g',
      'Roli – 20 g',
      'Halwa bhog kit (sooji, ghee, sugar, dry fruits) – 1 pack',
      'Chana + puri combos note card – 1 pc',
      'Bhimseni camphor – 25 g',
      'Agarbatti – 20 sticks',
      'Cow ghee – 100 ml',
      'Cotton wicks – 10 pcs',
      'Matchbox – 1 pc',
      'Navratri aarti collection – 1 pc'
    ],
    instructions: [
      'Day 1 (Pratipada): ghat sthapana with kalash and navarna rice; light the akhand diya.',
      'Keep the akhand diya lit for all 9 nights; do the daily navratri aarti.',
      'Offer chunri + shringar each evening and red flowers to the Devi.',
      'Prepare halwa + chana + puri for prasad (see the note card for quantities).',
      'On day 8 or 9, perform kanya pujan – worship 9 young girls with tilak, kumkum and chunri.',
      'Day 9/10: end with havan/visarjan and the "Siddhidaatri" aarti.'
    ]
  }
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function seed() {
  db.exec('DELETE FROM cart_items; DELETE FROM payments; DELETE FROM orders; DELETE FROM products; DELETE FROM categories; DELETE FROM users; DELETE FROM banners; DELETE FROM login_logs; DELETE FROM contact_messages;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','categories','products','orders','payments','banners','login_logs','contact_messages');");

  const insCat = db.prepare('INSERT INTO categories (slug,name,icon,description) VALUES (?,?,?,?)');
  for (const [slug, name, icon, desc] of CATEGORIES) insCat.run(slug, name, icon, desc);

  const insBanner = db.prepare('INSERT INTO banners (title,subtitle,image_url,pos,link,active,sort) VALUES (?,?,?,?,?,1,?)');
  BANNERS.forEach((b, i) => insBanner.run(b[0], b[1], b[2], b[3], b[4], i));

  const catId = db.prepare('SELECT id FROM categories WHERE slug=?');
  const insProd = db.prepare(`
    INSERT INTO products (sku,name,category_id,description,price,mrp,image,stock,active,featured,checklist,instructions)
    VALUES (?,?,?,?,?,?,?,?,1,?,?,?)
  `);

  for (const [catSlug, sku, name, price, mrp, desc, stock, featured] of PRODUCTS) {
    const { id: cid } = catId.get(catSlug);
    const kit = KIT_DETAILS[sku];
    insProd.run(
      sku || `DM-${slugify(name).toUpperCase().slice(0, 12)}`,
      name, cid, desc, price, mrp || Math.round(price * 1.25), '',
      stock, featured ? 1 : 0,
      kit ? JSON.stringify(kit.checklist) : '[]',
      kit ? JSON.stringify(kit.instructions) : '[]'
    );
  }
  // mark some extra products as featured
  const upd = db.prepare('UPDATE products SET featured=1 WHERE name=?');
  for (const n of FEATURED_EXTRA) upd.run(n);

  const adminPass = bcrypt.hashSync('Admin@1234', 10);
  db.prepare('INSERT INTO users (name, phone, email, password_hash, role) VALUES (?,?,?,?,?)')
    .run('DevaMart Admin', '9000000000', 'admin@devamart.in', adminPass, 'admin');

  const userPass = bcrypt.hashSync('User@1234', 10);
  db.prepare('INSERT INTO users (name, phone, email, password_hash, role) VALUES (?,?,?,?,?)')
    .run('Demo User', '9111111111', 'demo@devamart.in', userPass, 'user');

  const counts = {
    products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
    categories: db.prepare('SELECT COUNT(*) c FROM categories').get().c,
  };
  console.log('DevaMart seed complete:', counts);
  console.log('Admin login  -> admin@devamart.in / Admin@1234');
  console.log('User login   -> demo@devamart.in / User@1234');

  return counts;
}

// Run at startup when the DB is brand new (e.g. first cold start on Vercel /tmp).
function autoSeedIfEmpty() {
  const c = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  if (c === 0) {
    try { return seed(); } catch (e) { console.error('auto-seed failed', e); return null; }
  }
  return { skipped: true };
}

if (require.main === module) {
  seed();
} else {
  module.exports = { seed, autoSeedIfEmpty };
}