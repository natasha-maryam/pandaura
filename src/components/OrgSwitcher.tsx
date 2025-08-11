import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OrgSwitcher() {
  const { organizations, selectedOrg, setSelectedOrg, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!selectedOrg || organizations.length === 0) {
    return null;
  }

  const handleOrgSwitch = (org: typeof selectedOrg) => {
    if (org && org.org_id !== selectedOrg?.org_id) {
      setSelectedOrg(org);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-light rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-accent/10 rounded">
            <Building2 className="w-4 h-4 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-primary truncate">
              {selectedOrg.org_name}
            </p>
            <p className="text-xs text-secondary">
              {selectedOrg.role}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-light rounded-lg shadow-lg z-50 py-2">
          {/* Current User Info */}
          <div className="px-4 py-2 border-b border-light">
            <p className="text-sm font-medium text-primary">{user?.fullName}</p>
            <p className="text-xs text-secondary">{user?.email}</p>
          </div>

          {/* Organizations List */}
          <div className="py-1">
            <p className="px-4 py-2 text-xs font-medium text-secondary uppercase tracking-wide">
              Organizations
            </p>
            {organizations.map((org) => (
              <button
                key={org.org_id}
                onClick={() => handleOrgSwitch(org)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  org.org_id === selectedOrg?.org_id ? 'bg-accent-light' : ''
                }`}
              >
                <div className="p-1 bg-gray-100 rounded">
                  <Building2 className="w-3 h-3 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">{org.org_name}</p>
                  <p className="text-xs text-secondary">{org.role}</p>
                </div>
                {org.org_id === selectedOrg?.org_id && (
                  <div className="w-2 h-2 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-light pt-1 mt-1">
            {selectedOrg?.role === 'Admin' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to org settings
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-secondary" />
                <span className="text-sm text-primary">Organization Settings</span>
              </button>
            )}
            
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to team management
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary">Team Members</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
