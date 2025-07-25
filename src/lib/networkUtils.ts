// Network environment detection utilities

export const isRestrictiveEnvironment = (): boolean => {
  // Check if we're in a hosting environment that blocks external APIs
  const hostname = window.location.hostname;
  
  // Check for common hosting platforms that might have restrictions
  const restrictiveHosts = [
    'fly.dev',
    'vercel.app',
    'netlify.app',
    'herokuapp.com',
    'github.io',
    'surge.sh'
  ];
  
  return restrictiveHosts.some(host => hostname.includes(host));
};

export const shouldUseMockData = (): boolean => {
  // Use mock data in restrictive environments or when explicitly set
  return isRestrictiveEnvironment() || import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

export const getNetworkConfig = () => {
  const isRestricted = isRestrictiveEnvironment();
  
  return {
    weatherTimeout: isRestricted ? 2000 : 8000,
    geocodingTimeout: isRestricted ? 1500 : 5000,
    authTimeout: isRestricted ? 2000 : 8000,
    enableRetries: !isRestricted,
    useMockWeather: isRestricted,
  };
};
