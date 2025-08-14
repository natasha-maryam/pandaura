// Environment-aware Configuration
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEPLOYMENT_MODE === 'development';
const isProduction = import.meta.env.PROD || import.meta.env.VITE_DEPLOYMENT_MODE === 'production';

// Debug environment detection
console.log('🔍 Environment Detection:', {
  'import.meta.env.DEV': import.meta.env.DEV,
  'import.meta.env.PROD': import.meta.env.PROD,
  'import.meta.env.MODE': import.meta.env.MODE,
  'VITE_DEPLOYMENT_MODE': import.meta.env.VITE_DEPLOYMENT_MODE,
  isDevelopment,
  isProduction
});

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('✅ Using explicit API URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect based on environment
  if (isDevelopment) {
    console.log('🔧 Environment: Development - Using localhost:5000');
    return 'http://localhost:5000';
  } else if (isProduction) {
    console.log('🚀 Environment: Production - Using Railway backend');
    return 'https://pandaura-backend-production.up.railway.app';
  }
  
  // Fallback to localhost for on-premise or unknown environments
  console.log('⚠️ Environment: Unknown - Falling back to localhost:5000');
  return 'http://localhost:5000';
};

export const config = {
  // API Configuration
  apiBaseUrl: getApiBaseUrl(),
  
  // Deployment Configuration
  deploymentMode: import.meta.env.VITE_DEPLOYMENT_MODE || 'on-premise',
  appTitle: import.meta.env.VITE_APP_TITLE || 'Pandaura AS (Local)',
  
  // Feature Flags for On-Premise
  features: {
    analytics: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    externalFonts: import.meta.env.VITE_EXTERNAL_FONTS === 'true',
    cdnAssets: import.meta.env.VITE_CDN_ASSETS === 'true',
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    endpoint: import.meta.env.VITE_UPLOAD_ENDPOINT || '/api/upload',
    allowedTypes: ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'],
  },
  
  // Authentication Configuration
  auth: {
    type: import.meta.env.VITE_AUTH_TYPE || 'local',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '28800000'), // 8 hours
  },
  
  // Network Configuration
  network: {
    timeout: 30000, // 30 seconds
    retries: 3,
  },
  
  // On-Premise Specific Settings
  onPremise: {
    showStatus: true,
    offlineMode: true,
    localOnly: true,
  }
};

// Helper function to get current hostname/IP
export const getHostInfo = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  return {
    hostname,
    port,
    isLocal: hostname === 'localhost' || hostname === '127.0.0.1',
    displayUrl: port ? `${hostname}:${port}` : hostname
  };
};

// Debug function to check environment configuration
export const debugConfig = () => {
  console.log('🔍 Environment Debug:', {
    'isDevelopment': isDevelopment,
    'isProduction': isProduction,
    'import.meta.env.DEV': import.meta.env.DEV,
    'import.meta.env.PROD': import.meta.env.PROD,
    'import.meta.env.MODE': import.meta.env.MODE,
    'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
    'Final API URL': config.apiBaseUrl
  });
};

// Check if we're running in offline mode
export const isOffline = () => {
  return !navigator.onLine || config.onPremise.offlineMode;
};

export default config;