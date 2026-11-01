import type { Metadata } from 'next';

const image = '/brand/estore-house-icon.png';

export function pageMetadata(title: string, description: string, canonical: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      locale: 'ro_RO',
      siteName: 'E-Store House',
      images: [image],
    },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}
