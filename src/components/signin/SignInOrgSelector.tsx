import React, { useState } from "react";
import { Building2, Users, ArrowRight } from "lucide-react";
import { Button } from "../ui";
import logo from "../../assets/logo.png";
import { OrgInfo } from "../../contexts/AuthContext";

interface SignInOrgSelectorProps {
  organizations: OrgInfo[];
  onOrgSelect: (org: OrgInfo) => void;
  userEmail: string;
  isLoading?: boolean;
}

export default function SignInOrgSelector({
  organizations,
  onOrgSelect,
  userEmail,
  isLoading = false
}: SignInOrgSelectorProps) {
  const [selectedOrg, setSelectedOrg] = useState<OrgInfo | null>(null);

  const handleContinue = () => {
    if (selectedOrg) {
      onOrgSelect(selectedOrg);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Editor':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Viewer':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOrgSizeDisplay = (size?: string) => {
    if (!size) return '';
    
    const sizeMap: { [key: string]: string } = {
      'startup': '1-10 employees',
      'small': '11-50 employees', 
      'medium': '51-200 employees',
      'large': '201-1000 employees',
      'enterprise': '1000+ employees'
    };
    
    return sizeMap[size] || size;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden py-20 px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-transparent" />
      </div>
      
      {/* Logo Section */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <img
          src={logo}
          alt="Pandaura AS Logo"
          className="h-16 w-auto filter-none"
          style={{ filter: 'none', imageRendering: 'crisp-edges' }}
        />
        <h1 className="text-2xl font-bold text-primary text-center mt-3">
          Select Organization
        </h1>
        <p className="text-sm text-muted text-center mt-2 max-w-md">
          You have access to multiple organizations. Choose which one to sign in to.
        </p>
        <p className="text-xs text-secondary text-center mt-1">
          Signed in as: <strong>{userEmail}</strong>
        </p>
      </div>
      
      {/* Organization Selection */}
      <div className="w-full max-w-md bg-surface border border-light rounded-lg shadow-card z-10 p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Your Organizations
          </h3>
          
          {/* Organization List */}
          <div className="space-y-3">
            {organizations.map((org) => (
              <div key={org.org_id}>
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-accent/50 ${
                    selectedOrg?.org_id === org.org_id
                      ? 'border-accent bg-accent/5'
                      : 'border-light bg-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="organization"
                    value={org.org_id}
                    checked={selectedOrg?.org_id === org.org_id}
                    onChange={() => setSelectedOrg(org)}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Building2 className="w-8 h-8 text-accent" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-primary">
                            {org.org_name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(org.role)}`}>
                              {org.role}
                            </span>
                            {org.industry && (
                              <span className="text-xs text-muted">
                                {org.industry}
                              </span>
                            )}
                          </div>
                          {org.size && (
                            <p className="text-xs text-muted mt-1 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {getOrgSizeDisplay(org.size)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedOrg?.org_id === org.org_id && (
                        <ArrowRight className="w-5 h-5 text-accent flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!selectedOrg || isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-center text-xs text-muted z-10">
        <p>You can switch organizations later from your profile settings</p>
      </div>
    </div>
  );
}
