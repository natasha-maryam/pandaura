import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SharedLayout from "./components/SharedLayout";
import SessionLayout from "./components/SessionLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AskPandaura from "./pages/AskPandaura";
import LogicStudio from "./pages/LogicStudio";
import AutoDocs from "./pages/AutoDocs";
import TagDatabaseManager from "./pages/TagDatabaseManager";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Feedback from "./pages/Feedback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CaseStudies from "./pages/CaseStudies";
import { ModuleStateProvider } from "./contexts/ModuleStateContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SignUpProvider } from "./contexts/SignUpContext";
import { ToastProvider } from "./components/ui/Toast";
import SignUp from "./pages/SignUp";

export default function App() {
  return (
    <AuthProvider>
      <SignUpProvider>
        <ToastProvider>
          <ModuleStateProvider>
        <Router>
        <Routes>
        {/* Authentication & Home */}
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/home" element={<Home />} />
        
        {/* Full Project Workflow - Persistent Sessions */}
        <Route path="/app" element={<Navigate to="/pandaura-as" replace />} />
        <Route path="/pandaura-as" element={<ProtectedRoute><SharedLayout><AskPandaura /></SharedLayout></ProtectedRoute>} />
        <Route path="/logic-studio" element={<ProtectedRoute><SharedLayout><LogicStudio /></SharedLayout></ProtectedRoute>} />
        <Route path="/autodocs" element={<ProtectedRoute><SharedLayout><AutoDocs /></SharedLayout></ProtectedRoute>} />
        <Route path="/tag-database" element={<ProtectedRoute><SharedLayout><TagDatabaseManager /></SharedLayout></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><SharedLayout><Projects /></SharedLayout></ProtectedRoute>} />
        <Route path="/case-studies" element={<ProtectedRoute><SharedLayout><CaseStudies /></SharedLayout></ProtectedRoute>} />
        
        {/* Quick Tools - One-time Sessions */}
        <Route path="/tool/logic" element={<SessionLayout><LogicStudio sessionMode={true} /></SessionLayout>} />
        <Route path="/tool/tags" element={<SessionLayout><TagDatabaseManager sessionMode={true} /></SessionLayout>} />
        <Route path="/tool/autodocs" element={<SessionLayout><AutoDocs sessionMode={true} /></SessionLayout>} />
        <Route path="/tool/signalflow" element={<SessionLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold text-primary">SignalFlow (Coming Soon)</h1><p className="text-muted mt-2">Signal path visualization and tracing</p></div></SessionLayout>} />
        <Route path="/tool/assistant" element={<SessionLayout><AskPandaura sessionMode={true} /></SessionLayout>} />
        
        {/* Standalone Pages */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/case-study-library" element={<CaseStudies />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
        </Router>
          </ModuleStateProvider>
        </ToastProvider>
      </SignUpProvider>
    </AuthProvider>
  );
}
