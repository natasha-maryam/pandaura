import React from "react";
import pandauraLogo from "../assets/logo.png"; 

export default function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
      <div className="flex flex-col items-center space-y-4">
        <img
          src={pandauraLogo}
          alt="Pandaura Logo"
          className="h-20 w-auto filter grayscale invert brightness-150 animate-pulse"
        />
        <p className="text-white text-sm animate-pulse">Loading Pandaura...</p>
      </div>
    </div>
  );
}
