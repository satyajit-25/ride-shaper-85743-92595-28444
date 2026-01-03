import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: object;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'Intelligent Car Recommendation System';
const DEFAULT_DESCRIPTION = 'Find your perfect car with our AI-powered recommendation system. Get personalized suggestions based on your preferences, budget, and lifestyle.';
const DEFAULT_KEYWORDS = 'car recommendation, AI car finder, car comparison, car buying guide, best cars India, car suggestions, automobile recommendation';
const DEFAULT_OG_IMAGE = '/favicon.png';
const SITE_NAME = 'Intelligent Car Recommendation System';
const BASE_URL = 'https://car-recommendation.lovable.app';

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  structuredData,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullCanonicalUrl = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  // Default structured data for the website
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    applicationCategory: 'AutomotiveApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bhubaneswar',
        addressCountry: 'India',
      },
    },
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

// Pre-configured SEO components for specific pages
export const HomeSEO = () => (
  <SEO
    title="Home"
    description="Discover your perfect car with our intelligent AI-powered recommendation system. Get personalized car suggestions based on your budget, preferences, and lifestyle."
    canonicalUrl="/home"
    keywords="car recommendation, AI car finder, best cars India, car buying guide, personalized car suggestions"
  />
);

export const FindCarSEO = () => (
  <SEO
    title="Find Your Perfect Car"
    description="Use our AI-powered car finder to get personalized recommendations. Tell us your preferences and let our intelligent system find the best cars for you."
    canonicalUrl="/find-car"
    keywords="find car, car search, AI car recommendation, car finder tool, best car for me"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Find Your Perfect Car',
      description: 'AI-powered car recommendation tool',
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'Car Finder Tool',
        applicationCategory: 'AutomotiveApplication',
      },
    }}
  />
);

export const CompareFinancingSEO = () => (
  <SEO
    title="Compare Car Financing"
    description="Compare financing options for your selected cars. Calculate EMI, interest rates, and find the best loan options for your dream car."
    canonicalUrl="/compare-financing"
    keywords="car financing, car loan comparison, EMI calculator, car loan interest rates, auto loan"
    structuredData={{
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: 'Car Financing Calculator',
      description: 'Compare and calculate car loan options',
      category: 'Auto Loan',
    }}
  />
);

export const FavoritesSEO = () => (
  <SEO
    title="My Favorite Cars"
    description="View and manage your saved favorite cars. Compare your shortlisted vehicles and make an informed decision."
    canonicalUrl="/favorites"
    keywords="saved cars, favorite cars, car wishlist, car comparison"
    noIndex={true}
  />
);

export const ComparisonHistorySEO = () => (
  <SEO
    title="Comparison History"
    description="View your past car comparisons and financing calculations. Track your car research journey."
    canonicalUrl="/comparison-history"
    keywords="car comparison history, saved comparisons, car research"
    noIndex={true}
  />
);

export const AuthSEO = () => (
  <SEO
    title="Login or Sign Up"
    description="Sign in or create an account to access personalized car recommendations, save favorites, and track your car buying journey."
    canonicalUrl="/auth"
    keywords="login, sign up, car recommendation account, register"
  />
);

export default SEO;
