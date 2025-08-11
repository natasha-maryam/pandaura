import React, { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PrivacySection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export default function Privacy() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [privacyFeedback, setPrivacyFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (privacyFeedback.trim()) {
      // In real implementation, this would send to pandauracares@mail.com
      console.log('Privacy feedback:', privacyFeedback);
      setFeedbackSent(true);
      setPrivacyFeedback("");
      setTimeout(() => {
        setFeedbackSent(false);
        setShowFeedback(false);
      }, 2000);
    }
  };

  const privacySections: PrivacySection[] = [
    {
      id: "data-collection",
      title: "What We Don't Collect",
      icon: "🔒",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">We don't collect your code. Ever.</p>
          <p className="text-muted">
            Pandaura AS runs entirely on-premise. Your PLC logic, structured text, tag databases, and any 
            project files never leave your local machine. There's no cloud syncing, no background uploads, 
            and no external servers involved.
          </p>
        </div>
      )
    },
    {
      id: "ai-privacy",
      title: "AI Model Privacy",
      icon: "🧠",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">The AI doesn't train on your data.</p>
          <p className="text-muted">
            The AI features built into Pandaura (like logic generation, signal tracing, and 
            auto-documentation) do not learn from your inputs. Your prompts and results are used in real 
            time to help you — and that's it. Nothing is saved, reused, or sent to a central server.
          </p>
        </div>
      )
    },
    {
      id: "file-uploads",
      title: "Uploaded Files",
      icon: "📂",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">Uploaded files stay local.</p>
          <p className="text-muted">
            Files uploaded for context (like machine specs, manuals, or existing logic files) are only used 
            during that session — they're never saved or transmitted elsewhere. Everything resets when 
            the session ends or the app is closed.
          </p>
        </div>
      )
    },
    {
      id: "case-studies",
      title: "Case Study Consent",
      icon: "🤝",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">Case studies are always opt-in.</p>
          <p className="text-muted">
            We'll only collect feedback or usage examples if you explicitly submit a case study. Even then, 
            all identifying data must be removed by you. If anything sensitive is left in by mistake, we'll 
            delete it immediately upon notice — no questions asked.
          </p>
        </div>
      )
    },
    {
      id: "diagnostics",
      title: "Troubleshooting & Diagnostics (Optional)",
      icon: "🔧",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">You're in control of diagnostics.</p>
          <p className="text-muted">
            If you reach out for support, you can choose whether or not to share technical logs. By default, 
            no diagnostic data is collected or sent. You're always in full control of what you share.
          </p>
        </div>
      )
    },
    {
      id: "user-accounts",
      title: "User Accounts & Sessions",
      icon: "👤",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">No user tracking.</p>
          <p className="text-muted">
            Pandaura doesn't require a cloud login, and we don't track behavior. If we add optional features 
            like user profiles or saved projects in the future, they'll also stay entirely local unless you opt in 
            to share.
          </p>
        </div>
      )
    },
    {
      id: "feedback",
      title: "Feedback You Submit",
      icon: "📧",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">Feedback goes straight to us — nowhere else.</p>
          <p className="text-muted">
            If you submit app or AI feedback, it's sent directly to our internal support email: 
            pandauracares@mail.com. It's never sold, stored in the cloud, or analyzed by third parties. 
            We read it. That's all.
          </p>
        </div>
      )
    },
    {
      id: "user-control",
      title: "Your Control, Always",
      icon: "✅",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">You can clear all local data at any time.</p>
          <p className="text-muted">
            We give you full control to reset, clear, or delete all project data stored locally. You'll always be 
            able to start fresh — no hidden caches, no stored prompts, no buried files.
          </p>
        </div>
      )
    },
    {
      id: "contact",
      title: "Contacting Us",
      icon: "📞",
      content: (
        <div className="space-y-4">
          <p className="text-primary font-medium">Questions about privacy? Reach out to us directly.</p>
          <div className="space-y-2 text-muted">
            <p>Email: <span className="font-mono text-primary">pandauracares@mail.com</span></p>
            <p>Case Study Privacy Team: <span className="font-mono text-primary">privacy@pandauralabs.com</span></p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-light px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-background rounded-md transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-primary">Privacy Policy</h1>
              <p className="text-sm text-secondary">
                <button 
                  onClick={() => navigate("/terms")}
                  className="hover:text-primary transition-colors underline"
                >
                  View Terms of Use
                </button>
              </p>
            </div>
          </div>
          
          {/* Privacy Feedback Bubble */}
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="p-3 hover:bg-background rounded-full transition-colors relative"
            title="Privacy Feedback"
          >
            <MessageCircle className="w-5 h-5 text-secondary" />
            {showFeedback && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-light rounded-lg shadow-lg p-4 z-50">
                <h3 className="font-medium text-primary mb-2">Have ideas for better privacy?</h3>
                <p className="text-xs text-muted mb-3">
                  We take your trust seriously. If there's a privacy feature you think we should add, 
                  or if something feels unclear, let us know.
                </p>
                {feedbackSent ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-green-600">Thank you for your feedback! ✓</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <textarea
                      value={privacyFeedback}
                      onChange={(e) => setPrivacyFeedback(e.target.value)}
                      placeholder="Your privacy feedback..."
                      className="w-full px-3 py-2 bg-background border border-light rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">{privacyFeedback.length}/500</span>
                      <button
                        type="submit"
                        disabled={!privacyFeedback.trim()}
                        className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                    </div>
                  </form>
                )}
                <p className="text-xs text-muted mt-2">
                  Your message goes straight to our core team. All feedback welcome.
                </p>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Privacy Sections */}
        <div className="space-y-4 mb-8">
          {privacySections.map((section) => (
            <div key={section.id} className="bg-surface border border-light rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-secondary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-secondary" />
                )}
              </button>
              
              {expandedSections.has(section.id) && (
                <div className="px-6 pb-6 border-t border-light">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final Note */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <div className="text-2xl mb-2">🔐</div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            We built Pandaura to be local-first — because we know your data is critical.
          </h3>
          <p className="text-muted">
            You control your environment. You own your code. That will never change.
          </p>
        </div>
      </div>
    </div>
  );
}