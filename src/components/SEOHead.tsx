
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "DripMuse - Your Personal AI Stylist",
  description = "Transform your wardrobe with AI-powered fashion recommendations. Upload your clothes, get personalized styling for any occasion.",
  keywords = "AI stylist, fashion recommendations, personal styling, wardrobe analysis, color palette",
  image = "https://lovable.dev/opengraph-image-p98pqg.png",
  url = "https://dripmuse.com",
  type = "website",
  noIndex = false
}) => {
  const fullTitle = title.includes('DripMuse') ? title : `${title} | DripMuse`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
};
