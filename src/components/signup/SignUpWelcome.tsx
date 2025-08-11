import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { Button } from "../ui";

interface SignUpWelcomeProps {
  nextStep: () => void;
}

export default function SignUpWelcome({ nextStep }: SignUpWelcomeProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="Pandaura AS Logo"
            className="h-20 w-auto filter-none mb-6"
            style={{ filter: "none", imageRendering: "crisp-edges" }}
          />
          
          <h1 className="text-2xl font-bold text-primary text-center mb-2">
            Welcome to Pandaura AS
          </h1>
          
          <p className="text-secondary text-center mb-8">
            Your complete industrial automation platform for PLCs, SCADA, and robotics
          </p>

          <div className="w-full space-y-4">
            <Button
              onClick={nextStep}
              className="w-full"
              size="lg"
            >
              Create Organization / Join Team
            </Button>
            
            <Button
              onClick={() => navigate('/signin')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-muted">
            <p>Secure • On-Premise • Zero Trust</p>
          </div>
        </div>
      </div>
    </div>
  );
}
