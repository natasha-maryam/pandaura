#!/usr/bin/env node

// Script to verify environment configuration
console.log('=== Environment Configuration Check ===');

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

console.log('Node Environment:', process.env.NODE_ENV);
console.log('Vite Environment Variables:');
console.log('  VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
console.log('  VITE_DEPLOYMENT_MODE:', process.env.VITE_DEPLOYMENT_MODE);

console.log('\nExpected behavior:');
if (isDev) {
  console.log('  ✓ Development mode: Should use http://localhost:5000');
} else if (isProd) {
  console.log('  ✓ Production mode: Should use https://pandaura-backend-production.up.railway.app');
} else {
  console.log('  ⚠ Unknown mode: Will fallback to localhost');
}

console.log('\nTo test:');
console.log('  Development: npm run dev');
console.log('  Production: npm run build && npm run preview');
console.log('=====================================');
