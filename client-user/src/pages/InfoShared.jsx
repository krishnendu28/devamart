import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';

export function useContent(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api(endpoint, { auth: false }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [endpoint]);
  return { data, loading };
}

export function InfoLayout({ children, title, updated, path, description, noindex = false }) {
  return (
    <>
      <Seo title={title} description={description} path={path} noindex={noindex} />
      <div className="container page">
        <div className="section-title">
          <div><h2>{title}</h2>{updated && <span className="sub">Last updated: {updated}</span>}</div>
        </div>
        {children}
      </div>
    </>
  );
}
