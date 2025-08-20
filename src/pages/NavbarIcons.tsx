import React, { useState, useEffect, useRef } from "react";
import { Plug, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NavbarIcons() {
  const [activeDropdown, setActiveDropdown] = useState<"integrations" | "profile" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const toggleDropdown = (type: typeof activeDropdown) => {
    setActiveDropdown(prev => (prev === type ? null : type));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="flex space-x-4 items-center relative">
      {/* Integrations Icon */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("integrations")}
          title="Integrations"
          className="p-2 rounded hover:bg-gray-200"
        >
          <Plug className="w-5 h-5" />
        </button>
        {activeDropdown === "integrations" && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded shadow-lg p-4 text-sm z-50">
            <div className="font-semibold mb-3 text-primary">
              Productivity Tools
            </div>
            <ul className="space-y-3">
              <li
                onClick={() => {
                  console.log("Connecting to Google Drive API...");
                  alert("Google Drive integration would be configured here");
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span>Google Drive API</span>
              </li>
              <li
                onClick={() => {
                  console.log("Connecting to Google Docs API...");
                  alert("Google Docs integration would be configured here");
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📄</span>
                </div>
                <span>Google Docs API</span>
              </li>
              <li
                onClick={() => {
                  console.log("Connecting to Dropbox API...");
                  alert("Dropbox integration would be configured here");
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📦</span>
                </div>
                <span>Dropbox API</span>
              </li>
              <li
                onClick={() => {
                  console.log("Connecting to Excel API...");
                  alert("Excel API integration would be configured here");
                  setActiveDropdown(null);
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📊</span>
                </div>
                <span>Excel API</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Profile Icon */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("profile")}
          title="User Profile"
          className="p-2 rounded-full border hover:bg-gray-200"
        >
          <User className="w-5 h-5" />
        </button>
        {activeDropdown === "profile" && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg py-2 text-sm z-50">
            <ul className="text-gray-800">
              <li
                onClick={() => {
                  console.log("Navigating to profile...");
                  navigate("/profile", { state: { from: location.pathname } });
                  setActiveDropdown(null);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                👤 Profile
              </li>

              <li
                onClick={() => {
                  console.log("Navigating to feedback...");
                  navigate("/feedback");
                  setActiveDropdown(null);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                💬 Feedback
              </li>
              <li
                onClick={() => {
                  console.log("Navigating to privacy...");
                  navigate("/privacy");
                  setActiveDropdown(null);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                🔐 Privacy
              </li>
              <li
                onClick={() => {
                  console.log("Navigating to case study library...");
                  navigate("/case-study-library");
                  setActiveDropdown(null);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                📂 Case Studies
              </li>
              <li
                onClick={() => {
                  logout();
                  navigate("/signin");
                  setActiveDropdown(null);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
