export default function Diya({ size = 56, label }) {
  return (
    <div className="diya" style={{ '--d-size': `${size}px` }} role="status" aria-label={label || 'Processing'}>
      <svg viewBox="0 0 100 70" className="diya-svg" aria-hidden="true">
        <ellipse className="diya-oil" cx="50" cy="54" rx="34" ry="10" />
        <path className="diya-body" d="M16 54 Q30 18 50 16 Q70 18 84 54 Z" />
        <rect className="diya-rim" x="14" y="49" width="72" height="6" rx="3" transform="rotate(-6 50 52)" />
        <ellipse className="diya-base" cx="50" cy="60" rx="22" ry="6" />
        <ellipse className="diya-flame" cx="50" cy="22" rx="7" ry="14" />
        <ellipse className="diya-flame-core" cx="50" cy="25" rx="3" ry="8" />
        <path className="diya-glow" d="M50 8 Q56 20 50 30 Q44 20 50 8 Z" />
      </svg>
      {label && <span className="diya-label">{label}</span>}
    </div>
  );
}