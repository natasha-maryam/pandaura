import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface SignUpData {
  // Step 1: Organization Choice
  orgChoice: 'create' | 'join' | null;
  
  // Step 2: Invite data (if joining)
  inviteData?: {
    code: string;
    orgName: string;
    role: string;
    email: string;
  };
  
  // Step 2: Organization data (if creating)
  orgData?: {
    orgName: string;
    industry: string;
    size: string;
  };
  
  // Step 3: Account data
  accountData?: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  
  // Step 4: Security data
  securityData?: {
    method: 'totp' | 'sms';
    secret?: string;
    qrCodeUrl?: string;
    code: string;
    verified?: boolean;
  };
  
  // Step 5: Consent data
  consentData?: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingConsent?: boolean;
  };
  
  // Step 6: Environment data
  environmentData?: {
    instanceId?: string;
    fingerprint?: string;
    bound?: boolean;
    manualOverride?: boolean;
    bindingTimestamp?: string;
    setupType?: string;
    preferences?: any;
  };
  
  // Organization creation status
  organizationCreated?: boolean;
  organizationId?: string;
  userId?: string;
}

interface SignUpContextType {
  signUpData: SignUpData;
  updateSignUpData: <K extends keyof SignUpData>(key: K, data: SignUpData[K]) => void;
  clearSignUpData: () => void;
  isComplete: boolean;
}

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

const initialSignUpData: SignUpData = {
  orgChoice: null,
  organizationCreated: false,
};

export const SignUpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [signUpData, setSignUpData] = useState<SignUpData>(initialSignUpData);

  const updateSignUpData = <K extends keyof SignUpData>(key: K, data: SignUpData[K]) => {
    setSignUpData(prev => ({
      ...prev,
      [key]: data
    }));
  };

  const clearSignUpData = () => {
    setSignUpData(initialSignUpData);
  };

  const isComplete = !!(
    signUpData.orgChoice &&
    signUpData.accountData?.fullName &&
    signUpData.accountData?.email &&
    signUpData.accountData?.password &&
    (signUpData.orgChoice === 'join' ? signUpData.inviteData : signUpData.orgData) &&
    signUpData.securityData?.verified &&
    signUpData.consentData?.termsAccepted &&
    signUpData.consentData?.privacyAccepted &&
    signUpData.environmentData &&
    signUpData.organizationCreated
  );

  return (
    <SignUpContext.Provider
      value={{
        signUpData,
        updateSignUpData,
        clearSignUpData,
        isComplete
      }}
    >
      {children}
    </SignUpContext.Provider>
  );
};

export const useSignUp = () => {
  const context = useContext(SignUpContext);
  if (!context) {
    throw new Error('useSignUp must be used within SignUpProvider');
  }
  return context;
};
