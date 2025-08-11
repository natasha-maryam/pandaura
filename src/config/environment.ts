// On-Premise Environment Configuration
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
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

// Check if we're running in offline mode
export const isOffline = () => {
  return !navigator.onLine || config.onPremise.offlineMode;
};

export default config;