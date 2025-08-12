/**
 * Color utility functions for project components
 * These colors match the design system used in pages/Projects.tsx
 */

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'in progress': return 'bg-blue-100 text-blue-700';
    case 'active': return 'bg-blue-100 text-blue-700'; // Map 'active' to 'in progress' color
    case 'archived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export const getVendorColor = (vendor: string) => {
  if (!vendor || vendor === 'N/A') {
    return 'bg-gray-100 text-gray-500';
  }
  
  switch (vendor.toLowerCase()) {
    case 'rockwell':
    case 'rockwell automation': 
      return 'bg-red-100 text-red-700';
    case 'siemens': 
      return 'bg-teal-100 text-teal-700';
    case 'beckhoff': 
      return 'bg-orange-100 text-orange-700';
    case 'schneider':
    case 'schneider electric':
      return 'bg-green-100 text-green-700';
    case 'omron':
      return 'bg-blue-100 text-blue-700';
    default: 
      return 'bg-gray-100 text-gray-600';
  }
};

export const getClientColor = (client: string) => {
  if (!client || client === 'N/A') {
    return 'bg-gray-100 text-gray-500';
  }
  // Optional: Add client-specific colors if needed
  return 'bg-purple-100 text-purple-700';
};
