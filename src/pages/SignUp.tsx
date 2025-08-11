import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignUpWelcome from '../components/signup/SignUpWelcome';
import SignUpOrgChoice from '../components/signup/SignUpOrgChoice';
import SignUpOrgSetup from '../components/signup/SignUpOrgSetup';
import SignUpAccountBasics from '../components/signup/SignUpAccountBasics';
import SignUpSecurity from '../components/signup/SignUpSecurity';
import SignUpConsent from '../components/signup/SignUpConsent';
import SignUpEnvironment from '../components/signup/SignUpEnvironment';
import SignUpFinish from '../components/signup/SignUpFinish';
import { useAuth } from '../contexts/AuthContext';
import { useSignUp } from '../contexts/SignUpContext';

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { createOrganization, acceptInvite, login } = useAuth();
  const { signUpData, updateSignUpData, clearSignUpData } = useSignUp();
  const navigate = useNavigate();

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleOrgChoice = (choice: 'create' | 'join', data?: any) => {
    updateSignUpData('orgChoice', choice);
    if (choice === 'join' && data) {
      updateSignUpData('inviteData', data);
    }
  };

  const handleOrgData = (data: any) => {
    updateSignUpData('orgData', data);
  };

  const handleAccountData = (data: any) => {
    updateSignUpData('accountData', data);
  };

  const handleSecurityData = (data: any) => {
    updateSignUpData('securityData', data);
  };

  const handleConsentData = (data: any) => {
    updateSignUpData('consentData', data);
  };

  const handleEnvironmentData = (data: any) => {
    updateSignUpData('environmentData', data);
  };

  const handleSubmitSignUp = async () => {
    if (!signUpData.accountData) {
      throw new Error('Account data is required');
    }

    setIsLoading(true);
    
    try {
      // At this point, user and organization should already be created
      // We just need to do a final login to establish the session
      if (signUpData.organizationCreated) {
        // Everything is already set up (organization created, user created, 2FA setup, consent agreed, device binded)
        // Just clear the signup data and navigate to home
        clearSignUpData();
        navigate("/home");
        return; // Exit the function here to prevent further execution
      }

      // Fallback for any remaining creation logic
      if (signUpData.orgChoice === 'create') {
        if (!signUpData.orgData) {
          throw new Error('Organization data is required');
        }

        const result = await createOrganization({
          orgName: signUpData.orgData.orgName,
          industry: signUpData.orgData.industry,
          size: signUpData.orgData.size,
          fullName: signUpData.accountData.fullName,
          email: signUpData.accountData.email,
          password: signUpData.accountData.password
        });

        if (result.success) {
          clearSignUpData();
          navigate('/home');
        } else {
          throw new Error(result.message || 'Failed to create organization');
        }
      } else if (signUpData.orgChoice === 'join') {
        if (!signUpData.inviteData) {
          throw new Error('Invite data is required');
        }

        // Accept invite and join organization
        const result = await acceptInvite({
          code: signUpData.inviteData.code,
          fullName: signUpData.accountData.fullName,
          email: signUpData.accountData.email,
          password: signUpData.accountData.password
        });

        if (result.success) {
          clearSignUpData();
          navigate('/home');
        } else {
          throw new Error(result.message || 'Failed to join organization');
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      // Handle error - you might want to show an error message
      alert('Sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <SignUpWelcome nextStep={nextStep} />;
      case 1:
        return (
          <SignUpOrgChoice
            nextStep={nextStep}
            prevStep={prevStep}
            onOrgChoice={handleOrgChoice}
          />
        );
      case 2:
        // Skip organization setup when joining existing organization
        if (signUpData.orgChoice === 'join') {
          return (
            <SignUpAccountBasics
              nextStep={nextStep}
              prevStep={prevStep}
              onAccountData={handleAccountData}
              isJoining={true}
              inviteData={signUpData.inviteData}
            />
          );
        }
        return (
          <SignUpOrgSetup
            nextStep={nextStep}
            prevStep={prevStep}
            onOrgData={handleOrgData}
            isJoining={false}
            inviteData={signUpData.inviteData}
          />
        );
      case 3:
        // When joining, skip to security step since we handled account basics in step 2
        if (signUpData.orgChoice === 'join') {
          return (
            <SignUpSecurity
              nextStep={nextStep}
              prevStep={prevStep}
              onSecurityData={handleSecurityData}
            />
          );
        }
        return (
          <SignUpAccountBasics
            nextStep={nextStep}
            prevStep={prevStep}
            onAccountData={handleAccountData}
            isJoining={false}
            inviteData={signUpData.inviteData}
          />
        );
      case 4:
        // When joining, this is consent step (shifted by 1)
        if (signUpData.orgChoice === 'join') {
          return (
            <SignUpConsent
              nextStep={nextStep}
              prevStep={prevStep}
              onConsentData={handleConsentData}
            />
          );
        }
        return (
          <SignUpSecurity
            nextStep={nextStep}
            prevStep={prevStep}
            onSecurityData={handleSecurityData}
          />
        );
      case 5:
        // When joining, this is environment step (shifted by 1)  
        if (signUpData.orgChoice === 'join') {
          return (
            <SignUpEnvironment
              nextStep={nextStep}
              prevStep={prevStep}
              onEnvironmentData={handleEnvironmentData}
            />
          );
        }
        return (
          <SignUpConsent
            nextStep={nextStep}
            prevStep={prevStep}
            onConsentData={handleConsentData}
          />
        );
      case 6:
        // When joining, this is finish step (shifted by 1)
        if (signUpData.orgChoice === 'join') {
          return (
            <SignUpFinish
              onComplete={handleSubmitSignUp}
              isLoading={isLoading}
            />
          );
        }
        return (
          <SignUpEnvironment
            nextStep={nextStep}
            prevStep={prevStep}
            onEnvironmentData={handleEnvironmentData}
          />
        );
      case 7:
        return (
          <SignUpFinish
            onComplete={handleSubmitSignUp}
            isLoading={isLoading}
          />
        );
      default:
        return <SignUpWelcome nextStep={nextStep} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-transparent" />
      </div>
      
      <div className="z-10 w-full max-w-md">
        {/* Progress Indicator */}
        {step > 0 && step < 7 && (
          <div className="mb-8">
            <div className="flex justify-center mb-2">
              <span className="text-sm text-secondary">
                Step {step} of 6
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}
