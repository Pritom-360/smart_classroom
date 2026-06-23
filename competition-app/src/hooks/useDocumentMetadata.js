import { useEffect } from 'react';

export default function useDocumentMetadata({ title, description, canonicalUrl, ogType = 'website', ogImage }) {
  useEffect(() => {
    // 1. Update document title
    const fullTitle = `${title} | Catalyst Smart Classroom`;
    document.title = fullTitle;

    // 2. Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // 3. Update canonical link
    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // 4. Update Open Graph (OG) tags
    const updateOgTag = (property, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOgTag('og:title', fullTitle);
    updateOgTag('og:description', description);
    updateOgTag('og:type', ogType);
    if (ogImage) {
      updateOgTag('og:image', ogImage);
    }
    if (canonicalUrl) {
      updateOgTag('og:url', canonicalUrl);
    }
  }, [title, description, canonicalUrl, ogType, ogImage]);
}
