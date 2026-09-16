import { useContent, InfoLayout } from './InfoShared';

export default function Terms() {
  const { data, loading } = useContent('/api/content/terms');
  if (loading) return <div className="loading">Loading terms…</div>;
  return (
    <InfoLayout title={data.title} updated={data.updated}>
      <div className="prose">
        {data.sections.map(([h, body], i) => (
          <section key={i}>
            <h3>{h}</h3>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </InfoLayout>
  );
}