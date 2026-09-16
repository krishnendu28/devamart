import { Link } from 'react-router-dom';
import { toast } from './Toast';
import Icon from './Icons';

export default function Footer() {
  function sub(e) {
    e.preventDefault();
    const em = new FormData(e.target).get('email');
    if (em) toast('Subscribed — welcome to the DevaMart family');
  }

  return (
    <footer className="site">
      <div className="footer-glow" />
      <div className="container">
        <div className="footer-grid">
          <div className="ft-brand">
            <div className="brand">
              <span className="logo"><Icon name="lamp" size={26} /></span>
              <span><h1>DevaMart</h1><small>Puja &amp; Astrology</small></span>
            </div>
            <p>Authentic puja kits, idols, rudraksha and healing crystals — delivered with respect to your rituals. Serving devotees across India.</p>
            <form className="newsletter" onSubmit={sub}>
              <input className="input" name="email" type="email" placeholder="Email for new kits & offers" required />
              <button className="btn sm" type="submit">Join</button>
            </form>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop?category=puja-samagri-kits">Puja Samagri &amp; Kits</Link>
            <Link to="/shop?category=idols">Bigraha / Idols</Link>
            <Link to="/shop?category=rudraksha">Rudraksha &amp; Malas</Link>
            <Link to="/shop?category=healing-crystals">Healing Crystals</Link>
            <Link to="/shop?category=decor-furniture">Décor &amp; Furniture</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/track">Track Order</Link>
          </div>
          <div>
            <h4>Help</h4>
            <p><Icon name="phone" size={15} /> +91 90000 00000</p>
            <p><Icon name="mail" size={15} /> support@devamart.in</p>
            <p><Icon name="clock" size={15} /> 9 AM – 8 PM IST</p>
            <div className="pay-chips">
              <span>UPI</span><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>COD</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} DevaMart Spiritual Store. All rights reserved.</span>
          <span className="social">
            <a href="#" onClick={e => { e.preventDefault(); toast('Instagram coming soon'); }}>Instagram</a>
            <a href="#" onClick={e => { e.preventDefault(); toast('YouTube coming soon'); }}>YouTube</a>
            <a href="#" onClick={e => { e.preventDefault(); toast('WhatsApp coming soon'); }}>WhatsApp</a>
          </span>
        </div>
      </div>
    </footer>
  );
}