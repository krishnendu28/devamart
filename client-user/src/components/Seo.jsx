import { useEffect } from 'react';

export const SITE_URL = 'https://devamart-shop.vercel.app';
const DEFAULT_TITLE = 'DevaMart — Authentic Puja Kits, Idols, Rudraksha & Healing Crystals';
const DEFAULT_DESC = 'Shop authentic puja samagri kits, idols, rudraksha malas, yantras and healing crystals at DevaMart. Free delivery above ₹499, COD & UPI, live order tracking across India.';

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Lightweight per-page SEO: title, description, canonical, Open Graph,
 * Twitter card and optional JSON-LD structured data.
 */
export default function Seo({ title, description, path = '/', image, jsonLd, noindex = false, type = 'website' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | DevaMart` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    const ogImage = image || `${SITE_URL}/logo.jpeg`;

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setLink('canonical', url);

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'DevaMart');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ogImage);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', ogImage);

    let script = document.getElementById('dm-page-jsonld');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'dm-page-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      const s = document.getElementById('dm-page-jsonld');
      if (s) s.remove();
    };
  }, [title, description, path, image, jsonLd, noindex, type]);

  return null;
}

export function productJsonLd(product) {
  if (!product) return null;
  const images = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.description || '').slice(0, 500),
    sku: product.sku || `DM-${product.id}`,
    image: images,
    category: product.category_name,
    brand: { '@type': 'Brand', name: 'DevaMart' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.available === 0 || product.coming_soon === 1
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'DevaMart' },
    },
  };
}

export { DEFAULT_TITLE, DEFAULT_DESC };
