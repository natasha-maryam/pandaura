import React, { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TermsSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function Terms() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would download a PDF version
    console.log('Downloading Terms of Use PDF...');
    alert('PDF download would be available in production version.');
  };

  const termsSections: TermsSection[] = [
    {
      id: "introduction",
      title: "Introduction",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Welcome to Pandaura AS. These Terms of Use govern your use of the Pandaura AS software 
            platform, licensed and operated by Pandaura Labs AS. By using our software, you agree to the 
            terms below. If you do not agree, you should not use the software.
          </p>
        </div>
      )
    },
    {
      id: "scope",
      title: "Scope of Use",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Pandaura AS is licensed software designed for use in professional industrial automation 
            environments. You may use the software solely within your organization for engineering, 
            configuration, logic generation, and automation project development.
          </p>
        </div>
      )
    },
    {
      id: "licensing",
      title: "Licensing & Ownership",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Pandaura AS is licensed, not sold. All rights, title, and interest in the software—including 
            AI-generated logic, interface design, and proprietary workflows—remain the property of 
            Pandaura Labs AS.
          </p>
          <p className="text-muted">
            You may not reverse engineer, decompile, or resell the software without express written 
            permission.
          </p>
        </div>
      )
    },
    {
      id: "responsibilities",
      title: "User Responsibilities",
      content: (
        <div className="space-y-4">
          <ul className="space-y-2 text-muted list-disc list-inside">
            <li>You are responsible for how the software is used within your organization.</li>
            <li>You must ensure only authorized users access the software.</li>
            <li>You agree not to use Pandaura AS for unlawful or unsafe automation tasks.</li>
          </ul>
        </div>
      )
    },
    {
      id: "ai-content",
      title: "AI-Generated Content",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Pandaura AS includes AI systems that assist in generating automation logic. While powerful, 
            this logic may require review by qualified engineers.
          </p>
          <p className="text-muted font-medium">
            You remain solely responsible for validating and approving all outputs used in real-world 
            environments.
          </p>
        </div>
      )
    },
    {
      id: "data-privacy",
      title: "Data & Privacy",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Pandaura AS is a fully on-premise platform. We do not collect or transmit user data, logic, or 
            documents externally.
          </p>
          <p className="text-muted font-medium">
            Your data remains 100% within your environment, under your control.
          </p>
        </div>
      )
    },
    {
      id: "updates",
      title: "Software Updates",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Any software updates or patches will be delivered offline, and it is your responsibility to apply 
            them. Pandaura Labs is not liable for issues arising from the use of outdated software versions.
          </p>
        </div>
      )
    },
    {
      id: "warranty",
      title: "Warranty Disclaimer",
      content: (
        <div className="space-y-4">
          <p className="text-muted font-medium">
            Pandaura AS is provided "as is" without warranties of any kind.
          </p>
          <p className="text-muted">
            We do not guarantee uninterrupted operation, nor do we accept liability for logic errors, 
            production downtime, or misconfigurations caused by user input or AI-generated suggestions.
          </p>
        </div>
      )
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            To the maximum extent permitted by law, Pandaura Labs AS shall not be liable for any indirect, 
            incidental, or consequential damages resulting from the use of Pandaura AS.
          </p>
          <p className="text-muted">
            Your sole remedy for dissatisfaction with the software is to stop using it.
          </p>
        </div>
      )
    },
    {
      id: "termination",
      title: "Termination",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            Pandaura Labs reserves the right to revoke access or terminate licenses if terms are violated or 
            if the software is used in breach of ethical or legal standards.
          </p>
        </div>
      )
    },
    {
      id: "governing-law",
      title: "Governing Law",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            These Terms are governed by the laws of Norway. Any disputes shall be resolved in the 
            appropriate courts of Oslo, Norway.
          </p>
        </div>
      )
    },
    {
      id: "contact",
      title: "Contact",
      content: (
        <div className="space-y-4">
          <p className="text-muted">
            For licensing inquiries or enterprise agreements, please contact your Pandaura Labs 
            representative directly.
          </p>
          <p className="text-xs text-muted italic">
            (Note: No public email or feedback form is provided on this page.)
          </p>
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
              <h1 className="text-xl font-semibold text-primary">Terms of Use</h1>
              <p className="text-sm text-secondary">
                <button 
                  onClick={() => navigate("/privacy")}
                  className="hover:text-primary transition-colors underline"
                >
                  View Privacy Policy
                </button>
              </p>
            </div>
          </div>
          
          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download Terms of Use (PDF)
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-2">Terms of Use</h2>
          <p className="text-sm text-muted">Last Updated: August 5, 2025</p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4 mb-8">
          {termsSections.map((section) => (
            <div key={section.id} className="bg-surface border border-light rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-background transition-colors"
              >
                <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
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

        {/* Footer */}
        <div className="text-center text-sm text-muted">
          <p>
            For questions about these terms, please contact your Pandaura Labs representative.
          </p>
        </div>
      </div>
    </div>
  );
}