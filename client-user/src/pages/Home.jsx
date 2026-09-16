import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import ProductCard from '../components/ProductCard';
import Icon from '../components/Icons';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORY_PHOTOS = {
  'puja-samagri-kits': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Hindu_pooja_thali.jpg/960px-Hindu_pooja_thali.jpg',
  'idols': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg/960px-Ganesh_Murti_-_Traditional_Idol_of_Lord_Ganesha_012.jpg',
  'rudraksha': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Rudraksha_mala.jpg/960px-Rudraksha_mala.jpg',
  'healing-crystals': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Amethyst_crystals_close.jpg/960px-Amethyst_crystals_close.jpg',
  'decor-furniture': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Kamatchi_Vilakku.jpg/960px-Kamatchi_Vilakku.jpg',
};

const FALLBACK_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80',
    pos: 'center',
    eyebrow: 'Divine Puja, Delivered',
    title: 'Everything for your ritual in one blessed kit',
    sub: 'Researched samagri checklists, verified rudraksha & yantras, gorgeous idols and healing crystals — ready to pray, right out of the box.',
    chips: ['20+ ready kits', 'Verified rudraksha', 'Panchopchar items'],
    cta1: { label: 'Shop Puja Kits', to: '/shop?category=puja-samagri-kits' },
    cta2: { label: 'Explore All', to: '/shop' },
  },
  {
    img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
    pos: 'center',
    eyebrow: 'Astrology & Healing',
    title: 'Align your energy, decode your stars',
    sub: 'Rudraksha & yantras, healing crystals and celestial décor curated to balance your chakras, attract the right energy and calm your mind.',
    chips: ['Healing crystals', 'Rudraksha & malas', 'Chakra décor'],
    cta1: { label: 'Shop Rudraksha', to: '/shop?category=rudraksha' },
    cta2: { label: 'Crystals', to: '/shop?category=healing-crystals' },
  },
  {
    img: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1600&q=80',
    pos: 'center',
    eyebrow: 'Devotion, Made Modern',
    title: 'Free delivery above ₹499 · COD & UPI',
    sub: 'Track every order live from Packed → Shipped → Delivered. Puja essentials from ₹49, premium kits up to ₹2,999. Yes, we do COD.',
    chips: ['Free ₹499+', 'COD available', 'Live tracking'],
    cta1: { label: 'Start Shopping', to: '/shop' },
    cta2: { label: 'Track My Order', to: '/track' },
  },
];

const ASSURANCE = [
  { icon: 'gem', title: 'Energised & sealed', text: 'Every kit is prepared, energised and sealed before it is dispatched to you.' },
  { icon: 'truck', title: 'Free delivery ₹499+', text: 'Fast, insured shipping across India with order updates at every stage.' },
  { icon: 'refresh', title: '7-day easy returns', text: 'Not the right fit? Send it back within 7 days for a hassle-free return.' },
  { icon: 'shield', title: 'Secure UPI & COD', text: 'Pay by UPI, cards or cash on delivery — protected checkout, every time.' },
];

const TESTIMONIALS = [
  { name: 'Anjali Sharma', city: 'Pune', text: 'The Satyanarayan kit had every single item with the exact quantities. No last-minute running to the market.' },
  { name: 'Rajesh Iyer', city: 'Chennai', text: 'My 5-mukhi rudraksha arrived with an authenticity card and the beads genuinely feel real. Very happy.' },
  { name: 'Priya Nair', city: 'Kochi', text: 'Loved the live tracking — I knew exactly which day my Navratri kit would reach me. Beautiful packaging too.' },
];

function bannerSlides(banners) {
  if (!banners || !banners.length) return FALLBACK_SLIDES;
  return banners.map(b => ({
    img: b.image_url,
    pos: b.pos || 'center',
    eyebrow: b.title || 'DevaMart',
    title: b.title || 'Welcome to DevaMart',
    sub: b.subtitle || '',
    chips: [],
    link: b.link || '/shop',
  }));
}

function splitTitle(t) {
  const words = String(t).split(' ');
  return words.map((w, i) => {
    const last = i === words.length - 1;
    return last
      ? <span key={i} className="w sw" style={{ '--d': `${i * 90}ms` }}><em>{w}</em></span>
      : <span key={i} className="w" style={{ '--d': `${i * 90}ms` }}>{w}</span>;
  });
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [kits, setKits] = useState([]);
  const [banners, setBanners] = useState(FALLBACK_SLIDES);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const ioRef = useRef(null);
  const { user } = useAuth();
  const { add, busy } = useCart();

  const slides = bannerSlides(banners);
  const spotlight = featured.find(p => p.stock > 0) || featured[0];
  const spotOff = spotlight && spotlight.mrp > spotlight.price
    ? Math.round(((spotlight.mrp - spotlight.price) / spotlight.mrp) * 100)
    : 0;

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    Promise.all([
      api('/api/categories', { auth: false }),
      api('/api/products?featured=1', { auth: false }),
      api('/api/products?category=puja-samagri-kits&featured=1', { auth: false }),
      api('/api/banners', { auth: false }),
    ]).then(([c, f, k, b]) => {
      setCategories(c); setFeatured(f); setKits(k);
      if (b && b.length) setBanners(b);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
      ioRef.current = io;
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    }, 80);
    return () => { clearTimeout(t); ioRef.current?.disconnect(); };
  }, [loading]);

  const go = (i) => setSlide((i + slides.length) % slides.length);

  function addSpotlight() {
    if (!spotlight) return;
    if (!user) { toast('Please login to add items to cart'); navigate('/login'); return; }
    add(spotlight.id, 1).then(ok => { if (ok) toast(`Added to cart · ${spotlight.name}`); });
  }

  return (
    <div className="page home-page">
      <section className="container">
        <div className="hero">
          <div className="slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {slides.map((s, i) => (
              <div key={i} className={`slide ${i === slide ? 'active' : ''}`}>
                <div className="slide-bg" style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.pos || 'center' }} />
                <div className="slide-tint" />
                <div className="slide-content">
                  <div className="sc-inner">
                    <span className="eyebrow">{s.eyebrow}</span>
                    <h2>{splitTitle(String(s.title) || '')}</h2>
                    {s.sub && <p>{s.sub}</p>}
                    {s.chips.length > 0 && (
                      <div className="slide-chips">
                        {s.chips.map((c, j) => <span key={j} className="gloss-chip">{c}</span>)}
                      </div>
                    )}
                    <div className="hero-cta">
                      <button className="btn shop-now" onClick={() => navigate(s.cta1 ? s.cta1.to : (s.link || '/shop'))}>
                        {s.cta1 ? s.cta1.label : 'Shop Now'}
                      </button>
                      {s.cta2 && <button className="btn ghost" onClick={() => navigate(s.cta2.to)}>{s.cta2.label}</button>}
                    </div>
                  </div>
                </div>
                {s.img && (
                  <div className="slide-photo">
                    <span className="ph-frame">
                      <img src={s.img} alt={String(s.title) || 'DevaMart collection'} loading={i === 0 ? 'eager' : 'lazy'} />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hero-progress"><i key={slide} /></div>
          <div className="dots">
            {slides.map((_, i) => (
              <button key={i} className={`dot ${i === slide ? 'active' : ''}`} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="assure-strip reveal">
          {ASSURANCE.map((a, i) => (
            <div className="assure" key={i}>
              <span className="a-ic"><Icon name={a.icon} size={22} /></span>
              <div><b>{a.title}</b><span>{a.text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        {loading ? (
          <div className="loading">Loading DevaMart…</div>
        ) : (
          <>
            <div className="section-title reveal">
              <div>
                <span className="eyebrow">Curated collections</span>
                <h2>Shop by Category</h2>
              </div>
              <Link to="/shop" className="view-all">View all →</Link>
            </div>
            <div className="cat-grid stagger">
              {categories.map(c => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="cat-card reveal">
                  <div className="ic"><img src={CATEGORY_PHOTOS[c.slug] || ''} alt={c.name} loading="lazy" /></div>
                  <b>{c.name}</b>
                  <span>{c.product_count} products</span>
                </Link>
              ))}
            </div>

            <div className="section-title reveal">
              <div>
                <span className="eyebrow">Loved the most</span>
                <h2>Bestsellers &amp; Featured</h2>
              </div>
              <Link to="/shop" className="view-all">View all →</Link>
            </div>
            <div className="grid stagger">
              {featured.slice(0, 8).map(p => <div className="reveal" key={p.id}><ProductCard product={p} /></div>)}
            </div>

            <div className="section-title reveal">
              <div>
                <span className="eyebrow">Ready-to-pray</span>
                <h2>Popular Puja Kits</h2>
              </div>
              <Link to="/shop?category=puja-samagri-kits" className="view-all">All kits →</Link>
            </div>
            <div className="grid stagger">
              {kits.filter(k => k.featured).slice(0, 8).map(p => <div className="reveal" key={p.id}><ProductCard product={p} /></div>)}
              {kits.filter(k => k.featured).length === 0 && featured.slice(0, 8).map(p => <div className="reveal" key={p.id}><ProductCard product={p} /></div>)}
            </div>

            {spotlight && (
              <div className="spotlight reveal">
                <div className="spot-media">
                  <img src={spotlight.image} alt={spotlight.name} loading="lazy" />
                  {spotOff > 0 && <span className="spot-save">Save {spotOff}%</span>}
                </div>
                <div className="spot-body">
                  <span className="eyebrow">Deal of the week</span>
                  <h2>{spotlight.name}</h2>
                  <p>{spotlight.description}</p>
                  <div className="spot-price">
                    <b>{money(spotlight.price)}</b>
                    {spotOff > 0 && <><s>{money(spotlight.mrp)}</s><span className="off">save {spotOff}%</span></>}
                  </div>
                  <div className="spot-cta">
                    <button className="btn shop-now" disabled={busy || spotlight.stock === 0} onClick={addSpotlight}>
                      {busy ? 'Adding…' : spotlight.stock === 0 ? 'Sold out' : '+ Add to Cart'}
                    </button>
                    <Link className="btn ghost" to={`/product/${spotlight.id}`}>View details</Link>
                  </div>
                  <span className="spot-note"><Icon name="shield" size={16} /> Authenticity card included · free delivery above ₹499</span>
                </div>
              </div>
            )}

            <div className="story-block reveal">
              <div className="story-media">
                <img src={CATEGORY_PHOTOS['idols']} alt="DevaMart craftsmanship" loading="lazy" />
              </div>
              <div className="story-body">
                <span className="eyebrow">Our story</span>
                <h2>Devotion, made effortless</h2>
                <p>DevaMart began with a simple frustration — a puja that should bring peace was turning into a hunt for missing samagri. So we built kits around researched checklists, sourced idols and crystals from trusted artisans, and verified every rudraksha and yantra we ship.</p>
                <p>Today thousands of homes across India begin their rituals with a DevaMart box: complete, blessed and ready to pray.</p>
                <div className="story-stats">
                  <div><b>70+</b><span>curated products</span></div>
                  <div><b>20+</b><span>ready puja kits</span></div>
                  <div><b>4.8★</b><span>average rating</span></div>
                </div>
              </div>
            </div>

            <div className="value-band reveal">
              <div className="value-head">
                <span className="eyebrow dark">Why DevaMart</span>
                <h2>Why devotees choose us</h2>
              </div>
              <div className="value-grid stagger">
                <div className="v reveal"><b>Nothing missing</b><span>Every kit follows a researched item checklist with right quantities + step-by-step instructions — not random samagri in a box.</span></div>
                <div className="v reveal"><b>Trusted authenticity</b><span>Rudraksha, yantras &amp; crystals are verified and ship with authenticity cards. Can't verify? We replace it.</span></div>
                <div className="v reveal"><b>Honest pricing</b><span>From ₹49 samagri to ₹2,999 premium kits, with clear MRP vs price and a secure checkout.</span></div>
                <div className="v reveal"><b>Live order tracking</b><span>Watch your order move — Packed, Shipped, On The Way, Delivered — on a live timeline.</span></div>
              </div>
            </div>

            <div className="section-title reveal">
              <div>
                <span className="eyebrow">Blessed words</span>
                <h2>What our customers say</h2>
              </div>
            </div>
            <div className="reviews stagger">
              {TESTIMONIALS.map((r, i) => (
                <div className="review reveal" key={i}>
                  <div className="stars">★★★★★</div>
                  <p>{r.text}</p>
                  <div className="who"><b>{r.name}</b><span>{r.city}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
