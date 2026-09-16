import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, money } from '../api';
import { toast } from '../components/Toast';
import Icon from '../components/Icons';
import Diya from '../components/Diya';

const GATEWAYS = [
  { key: 'gpay', label: 'Google Pay', ic: 'G', bg: '#f6fbf5' },
  { key: 'phonepe', label: 'PhonePe', ic: 'Pe', bg: '#f8f3fd' },
  { key: 'paytm', label: 'Paytm', ic: 'Pt', bg: '#f0f7fd' },
  { key: 'upi', label: 'Other UPI App', ic: 'UPI', bg: '#fbf6ec' },
];

function loadRazorpaySdk(key) {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [gateway, setGateway] = useState('gpay');
  const [stage, setStage] = useState('init'); // init | upi | processing | success
  const [upiId, setUpiId] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const sdkError = useRef(null);

  useEffect(() => {
    api('/api/payment/init', { method: 'POST', body: { orderId } })
      .then((s) => { setSession(s); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, [orderId]);

  async function payDemo(fromGateway) {
    setErr('');
    const sel = fromGateway || gateway;
    if (stage === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      setErr('Enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    setStage('processing');
    try {
      const d = await api(`/api/payment/${orderId}/complete`, { method: 'POST', body: { gateway: sel } });
      setSession((s) => ({ ...s, tx: d }));
      setStage('success');
      toast('Payment successful!');
      setTimeout(() => navigate(`/track?order=${d.order_no}&paid=1`), 1800);
    } catch (e) {
      setErr(e.message);
      setStage(stage === 'upi' ? 'upi' : 'init');
    }
  }

  async function openRazorpay() {
    setErr('');
    if (!session?.rzp_order_id) { setErr('Payment session expired — please refresh'); return; }
    setStage('processing');
    const R = await loadRazorpaySdk(session.key_id);
    if (!R) { setErr('Could not load the payment gateway. Please try again.'); setStage('init'); return; }
    const rzp = new R({
      key: session.key_id,
      order_id: session.rzp_order_id,
      name: 'DevaMart',
      description: `Order ${session.order_no}`,
      amount: Math.round(session.amount * 100),
      currency: 'INR',
      theme: { color: '#E23744' },
      modal: { ondismiss: () => setStage('init') },
      handler: async (res) => {
        try {
          const d = await api('/api/payment/razorpay/verify', {
            method: 'POST',
            body: { orderId, rzp_order_id: res.razorpay_order_id, rzp_payment_id: res.razorpay_payment_id, rzp_signature: res.razorpay_signature },
          });
          setSession((s) => ({ ...s, tx: d }));
          setStage('success');
          toast('Payment successful!');
          setTimeout(() => navigate(`/track?order=${d.order_no}&paid=1`), 1800);
        } catch (e) {
          setErr(e.message);
          setStage('init');
        }
      },
    });
    rzp.open();
  }

  function pay() {
    if (session?.mode === 'razorpay') return openRazorpay();
    return payDemo();
  }

  const busy = stage === 'processing';

  if (loading) return <div className="loading" style={{ padding: '76px 0' }}><Diya size={64} label="Preparing secure payment…" /></div>;
  if (err && !session) {
    return (
      <div className="container page">
        <div className="pay-card center">
          <div className="big" style={{ fontSize: 46, color: 'var(--red)' }}><Icon name="warn" size={42} /></div>
          <h2>Payment unavailable</h2>
          <p className="muted">{err}</p>
          <Link to="/orders" className="btn mt">Go to My Orders</Link>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="container page">
        <div className="pay-card center">
          <div className="big" style={{ fontSize: 52, color: 'var(--green)' }}><Icon name="check" size={48} /></div>
          <h2>Payment Successful!</h2>
          <p>Order <b>{session?.tx?.order_no}</b> confirmed.<br />Transaction ref: <b>{session?.tx?.tx_ref}</b></p>
          <div style={{ margin: '10px auto' }}><Diya size={44} /></div>
          <p className="muted small">Redirecting to tracking…</p>
        </div>
      </div>
    );
  }

  const g = GATEWAYS.find((x) => x.key === gateway);
  const isRzp = session?.mode === 'razorpay';

  return (
    <div className="container page">
      <div className="pay-card">
        <div className="center">
          <h2>Secure Payment</h2>
          <p className="muted">Order #{session?.order_no}</p>
        </div>
        <div className="pay-amount">
          <div className="small muted">Amount to pay</div>
          <div className="amt">{money(session?.amount)}</div>
        </div>

        {stage === 'init' && !isRzp && (
          <>
            <div style={{ fontWeight: 700, color: 'var(--red-dark)', marginBottom: 8 }}>Choose your UPI app</div>
            <div className="gateways">
              {GATEWAYS.map((x) => (
                <div key={x.key} className={`gateway ${gateway === x.key ? 'active' : ''}`} onClick={() => setGateway(x.key)}>
                  <span className="g-ic" style={{ background: x.bg, fontWeight: 800, fontSize: 12, letterSpacing: '.5px' }}>{x.ic}</span>
                  <b>{x.label}</b>
                </div>
              ))}
            </div>
            <button className="btn block diya-btn mt" onClick={() => {
              if (gateway === 'upi') setStage('upi');
              else payDemo();
            }} disabled={busy}>
              {busy ? <><Diya size={22} /> Redirecting…</> : <>Continue with {g.label} →</>}
            </button>
          </>
        )}

        {stage === 'init' && isRzp && (
          <>
            <div className="alert info small" style={{ fontSize: '.82rem', marginBottom: 14 }}>
              You will be redirected to the secure <b>Razorpay</b> checkout (UPI · Cards · NetBanking · Wallet).
            </div>
            {err && <div className="alert err">{err}</div>}
            <button className="btn block diya-btn" onClick={pay} disabled={busy}>
              <svg viewBox="0 0 100 70" className="mini-diya" aria-hidden="true">
                <ellipse className="diya-oil" cx="50" cy="54" rx="34" ry="10" />
                <path className="diya-body" d="M16 54 Q30 18 50 16 Q70 18 84 54 Z" />
                <ellipse className="diya-base" cx="50" cy="60" rx="22" ry="6" />
                <ellipse className="diya-flame" cx="50" cy="22" rx="7" ry="14" />
                <ellipse className="diya-flame-core" cx="50" cy="25" rx="3" ry="8" />
              </svg>
              Pay {money(session?.amount)} securely
            </button>
          </>
        )}

        {stage === 'upi' && !isRzp && (
          <>
            <div className="field">
              <label>Enter your UPI ID to pay via {g.label}</label>
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
            </div>
            <div className="alert info small" style={{ fontSize: '.82rem' }}>
              <b>Demo payment:</b> enter any valid-looking UPI ID to simulate a successful payment. Connect real Razorpay keys to go live.
            </div>
            {err && <div className="alert err">{err}</div>}
            <div className="row mt">
              <button className="btn ghost" onClick={() => setStage('init')}>← Back</button>
              <button className="btn block diya-btn" onClick={payDemo} disabled={busy}>
                {busy ? <><Diya size={22} /> Paying…</> : `Pay ${money(session?.amount)}`}
              </button>
            </div>
          </>
        )}

        {stage === 'processing' && (
          <div className="center mt-2" style={{ padding: '20px 0' }}>
            <Diya size={68} />
            <b style={{ marginTop: 8, display: 'block' }}>{isRzp ? 'Secure checkout is opening…' : `Redirecting to ${g?.label}…`}</b>
            <p className="muted small">Please do not close this window.</p>
          </div>
        )}

        <div className="small muted center" style={{ fontSize: '.75rem', marginTop: 14 }}>
          <Icon name="lock" size={12} /> 256-bit secure connection · {isRzp ? 'Powered by Razorpay' : 'Powered by DevaMart UPI Gateway'}
        </div>
      </div>
    </div>
  );
}