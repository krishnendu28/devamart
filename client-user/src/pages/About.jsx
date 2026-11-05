import { useContent, InfoLayout } from './InfoShared';

export default function About() {
  const { data, loading } = useContent('/api/content/about');
  if (loading) return <div className="loading">Loading about…</div>;
  return (
    <InfoLayout title={data.title} path="/about" description="DevaMart is an authentic puja, astrology and spiritual wellness store delivering across India.">
      <div className="prose">
        <h3 style={{ color: 'var(--red-dark)', fontSize: '1.1rem' }}>{data.tagline}</h3>
        {data.body.map((p, i) => <p key={i}>{p}</p>)}
        <div className="value-grid">
          {data.values.map(([k, v], i) => (
            <div className="v" key={i}><b>{k}</b><span>{v}</span></div>
          ))}
        </div>
      </div>
    </InfoLayout>
  );
}