import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SharedLayout from "./components/SharedLayout";
import EULA from "./pages/EULA";
import SessionLayout from "./components/SessionLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import AskPandaura from "./pages/AskPandaura";
import LogicStudio from "./pages/LogicStudio";
import AutoDocs from "./pages/AutoDocs";
import TagDatabaseManager from "./components/tags/TagDatabaseManagerNew";
// import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import Feedback from "./pages/Feedback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CaseStudies from "./pages/CaseStudies";
import ProjectsDebug from "./pages/ProjectsDebug";
import { ModuleStateProvider } from "./contexts/ModuleStateContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SignUpProvider } from "./contexts/SignUpContext";
import { ToastProvider } from "./components/ui/Toast";
import { ProjectSyncProvider } from "./contexts/ProjectSyncContext";
import { debugConfig } from "./config/environment";
import SignUp from "./pages/SignUp";

// Component to handle smart root redirect
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Always redirect to signup for simplicity - signup page will handle auth redirects appropriately
  return <Navigate to="/signup" replace />;
}

export default function App() {
  // Log configuration on app startup
  React.useEffect(() => {
    debugConfig();
  }, []);

  return (
    <AuthProvider>
      <SignUpProvider>
        <ToastProvider>
          <ModuleStateProvider>
  <Router>
  <Routes>
        {/* Authentication & Home */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signup" element={<SignUp />} />
  <Route path="/signin" element={<SignIn />} />
  <Route path="/eula" element={<EULA />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home/projects" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home/projects/:projectId" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home/quick-tools" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        
        {/* Debug Routes (Development Only) */}
        <Route path="/debug/projects" element={<ProtectedRoute><ProjectsDebug /></ProtectedRoute>} />
        {/* <Route path="/debug/auth" element={<AuthDebugPage />} /> */}
        
        {/* Full Project Workflow - Persistent Sessions */}
        <Route path="/app" element={<Navigate to="/pandaura-as" replace />} />
        <Route path="/pandaura-as" element={<ProtectedRoute><SharedLayout><AskPandaura /></SharedLayout></ProtectedRoute>} />
        <Route path="/logic-studio" element={<ProtectedRoute><SharedLayout><ErrorBoundary><LogicStudio /></ErrorBoundary></SharedLayout></ProtectedRoute>} />
        <Route path="/autodocs" element={<ProtectedRoute><SharedLayout><AutoDocs /></SharedLayout></ProtectedRoute>} />
        <Route path="/tag-database" element={<ProtectedRoute><SharedLayout><ErrorBoundary><TagDatabaseManager /></ErrorBoundary></SharedLayout></ProtectedRoute>} />
        <Route path="/tag-database/:projectId" element={<ProtectedRoute><SharedLayout><ErrorBoundary><TagDatabaseManager /></ErrorBoundary></SharedLayout></ProtectedRoute>} />
        {/* <Route path="/projects" element={<ProtectedRoute><SharedLayout><Projects /></SharedLayout></ProtectedRoute>} /> */}
        <Route path="/case-studies" element={<ProtectedRoute><SharedLayout><CaseStudies /></SharedLayout></ProtectedRoute>} />
        
        {/* Project Workspace - All tools with project context */}
        <Route path="/workspace/:projectId/pandaura-as" element={<ProtectedRoute><ProjectSyncProvider><SharedLayout><AskPandaura /></SharedLayout></ProjectSyncProvider></ProtectedRoute>} />
        <Route path="/workspace/:projectId/logic-studio" element={<ProtectedRoute><ProjectSyncProvider><SharedLayout><ErrorBoundary><LogicStudio /></ErrorBoundary></SharedLayout></ProjectSyncProvider></ProtectedRoute>} />
        <Route path="/workspace/:projectId/autodocs" element={<ProtectedRoute><ProjectSyncProvider><SharedLayout><AutoDocs /></SharedLayout></ProjectSyncProvider></ProtectedRoute>} />
        <Route path="/workspace/:projectId/tag-database" element={<ProtectedRoute><ProjectSyncProvider><SharedLayout><ErrorBoundary><TagDatabaseManager /></ErrorBoundary></SharedLayout></ProjectSyncProvider></ProtectedRoute>} />
        <Route path="/workspace/:projectId/case-studies" element={<ProtectedRoute><ProjectSyncProvider><SharedLayout><CaseStudies /></SharedLayout></ProjectSyncProvider></ProtectedRoute>} />
        
        {/* Quick Tools - One-time Sessions */}
        <Route path="/tool/logic" element={<SessionLayout><ErrorBoundary><LogicStudio sessionMode={true} /></ErrorBoundary></SessionLayout>} />
        <Route path="/tool/tags" element={<SessionLayout><ErrorBoundary><TagDatabaseManager sessionMode={true} /></ErrorBoundary></SessionLayout>} />
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
