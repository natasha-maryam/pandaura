import React, { useState } from "react";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Save, 
  Upload, 
  FileText, 
  Image, 
  Shield,
  Info,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CaseStudy {
  id: string;
  title: string;
  status: 'draft' | 'completed';
  lastModified: string;
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  isExpanded: boolean;
}

export default function CaseStudies() {
  const navigate = useNavigate();
  
  // Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Mock existing case studies
  const [caseStudies] = useState<CaseStudy[]>([
    { id: '1', title: 'Water Treatment Automation', status: 'completed', lastModified: '2 days ago' },
    { id: '2', title: 'Packaging Line Integration', status: 'draft', lastModified: '1 week ago' },
  ]);

  // Form sections state
  const [formSections, setFormSections] = useState<FormSection[]>([
    { id: 'overview', title: 'Project Overview', description: 'Basic project information and scope', isExpanded: true },
    { id: 'challenge', title: 'Technical Challenge', description: 'What made this project unique or difficult', isExpanded: false },
    { id: 'pandaura', title: 'How Pandaura Helped', description: 'Which features were used and their impact', isExpanded: false },
    { id: 'outcome', title: 'Outcome & Results', description: 'Final results and client feedback', isExpanded: false },
    { id: 'media', title: 'Media Uploads', description: 'Screenshots, PDFs, and documentation', isExpanded: false },
    { id: 'privacy', title: 'Privacy & Security', description: 'Data protection and sharing preferences', isExpanded: false },
  ]);

  // Form data
  const [selectedProject, setSelectedProject] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    industry: '',
    platforms: [] as string[],
    scope: '',
    timeline: '',
    challenge: '',
    uniqueAspects: '',
    featuresUsed: [] as string[],
    howPandauraHelped: '',
    aiUsed: '',
    timeSavings: '',
    outcome: '',
    clientQuote: '',
    metrics: '',
    removeClientData: true,
    confirmNoSensitiveData: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Tooltip content
  const tooltips = {
    selectProject: "Link this case study to an existing project for automatic data import",
    projectTitle: "Give your case study a clear, descriptive title that highlights the key achievement",
    plcPlatforms: "Select all PLC platforms that were used in this project",
    scopeSummary: "Briefly describe what the project covered - scope, systems involved, and scale",
    finalOutcome: "Describe the successful completion and measurable results of the project",
    uploadFiles: "Upload project documentation, screenshots, or technical diagrams (max 10MB each)"
  };

  // Tooltip component
  const Tooltip = ({ id, content }: { id: string; content: string }) => {
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const iconRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      }
      setActiveTooltip(id);
    };

    return (
      <>
        <div ref={iconRef} className="relative inline-block">
          <Info 
            className="w-4 h-4 inline ml-1 text-muted hover:text-primary cursor-help transition-colors" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </div>
        {activeTooltip === id && (
          <div 
            className="fixed px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 99999
            }}
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </>
    );
  };

  const toggleSection = (sectionId: string) => {
    setFormSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    if (field === 'platforms' || field === 'featuresUsed') {
      setFormData(prev => ({
        ...prev,
        [field]: checked 
          ? [...prev[field as keyof typeof prev] as string[], value]
          : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...', formData);
    alert('Case study saved as draft locally.');
  };

  const handleUploadToHub = () => {
    if (!formData.confirmNoSensitiveData) {
      alert('Please confirm that no sensitive client data is included before uploading.');
      return;
    }
    
    console.log('Uploading to Case Study Hub...', formData);
    
    const confirmUpload = window.confirm(
      "Looks great. Once you submit, your case study will be visible to others on the Pandaura Case Study Hub. Just make sure you've removed anything private — you're always in full control."
    );
    
    if (confirmUpload) {
      alert('✅ Case study uploaded to Pandaura Case Study Hub!');
    }
  };

  const industries = [
    'Oil & Gas', 'Pharmaceutical', 'Food & Beverage', 'OEM', 'Automotive', 
    'Water Treatment', 'Power Generation', 'Manufacturing', 'Chemical', 'Other'
  ];

  const platforms = ['Rockwell', 'Siemens', 'Beckhoff', 'Schneider', 'Omron', 'ABB', 'Other'];

  const pandauraFeatures = [
    'Logic Studio', 'Tag Manager', 'SignalFlow', 'AutoDocs', 'Assistant / Mini'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-light px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-background rounded-md transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-primary">Create a Case Study</h1>
            <p className="text-sm text-secondary">Generate professional case studies from your projects</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Project Selector */}
        <div className="bg-surface border border-light rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Project Selection</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Select Project (Optional)
                <Tooltip id="selectProject" content={tooltips.selectProject} />
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Start from scratch</option>
                <option value="water-treatment">Water Treatment Plant</option>
                <option value="packaging-line">Packaging Line Control</option>
                <option value="hvac-system">HVAC System Integration</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  console.log('Starting new case study...');
                  // Reset form or navigate to new case study
                }}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start New Case Study
              </button>
            </div>
          </div>

          {/* Existing Case Studies */}
          {caseStudies.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-secondary mb-3">Recent Case Studies</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {caseStudies.map((study) => (
                  <button
                    key={study.id}
                    className="text-left p-3 bg-background border border-light rounded-md hover:border-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary">{study.title}</p>
                        <p className="text-xs text-muted">
                          {study.status} • {study.lastModified}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        study.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Case Study Form */}
        <div className="space-y-6">
          {formSections.map((section) => (
            <div key={section.id} className="bg-surface border border-light rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-background transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
                  <p className="text-sm text-muted">{section.description}</p>
                </div>
                {section.isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-secondary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-secondary" />
                )}
              </button>

              {section.isExpanded && (
                <div className="px-6 pb-6 border-t border-light">
                  <div className="pt-6 space-y-4">
                    {section.id === 'overview' && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Project Title
                              <Tooltip id="projectTitle" content={tooltips.projectTitle} />
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="e.g., Smart Water Treatment Integration"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Integrator Name / Company (Optional)
                            </label>
                            <input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="Your company name"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Client Industry</label>
                            <select
                              value={formData.industry}
                              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value="">Select industry...</option>
                              {industries.map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Timeline (Optional)</label>
                            <input
                              type="text"
                              value={formData.timeline}
                              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="e.g., 3 months, Q1 2024"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            PLC Platforms Used
                            <Tooltip id="plcPlatforms" content={tooltips.plcPlatforms} />
                          </label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {platforms.map(platform => (
                              <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.platforms.includes(platform)}
                                  onChange={(e) => handleCheckboxChange('platforms', platform, e.target.checked)}
                                  className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2"
                                />
                                <span className="text-sm text-primary">{platform}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Scope Summary
                            <Tooltip id="scopeSummary" content={tooltips.scopeSummary} />
                          </label>
                          <textarea
                            value={formData.scope}
                            onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                            placeholder="Describe the overall project scope and objectives..."
                          />
                        </div>
                      </>
                    )}

                    {section.id === 'challenge' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            What was the original challenge or complexity?
                          </label>
                          <textarea
                            value={formData.challenge}
                            onChange={(e) => setFormData(prev => ({ ...prev, challenge: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                            placeholder="Describe the technical challenges you faced..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            What made this project unique or difficult?
                          </label>
                          <textarea
                            value={formData.uniqueAspects}
                            onChange={(e) => setFormData(prev => ({ ...prev, uniqueAspects: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                            placeholder="What set this project apart from typical automation work..."
                          />
                        </div>
                      </>
                    )}

                    {section.id === 'pandaura' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Which Pandaura AS features were used?
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {pandauraFeatures.map(feature => (
                              <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.featuresUsed.includes(feature)}
                                  onChange={(e) => handleCheckboxChange('featuresUsed', feature, e.target.checked)}
                                  className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2"
                                />
                                <span className="text-sm text-primary">{feature}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Describe how Pandaura made the project easier or faster
                          </label>
                          <textarea
                            value={formData.howPandauraHelped}
                            onChange={(e) => setFormData(prev => ({ ...prev, howPandauraHelped: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                            placeholder="Explain the specific ways Pandaura helped..."
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Any AI-generated logic or documents used?
                            </label>
                            <textarea
                              value={formData.aiUsed}
                              onChange={(e) => setFormData(prev => ({ ...prev, aiUsed: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                              rows={3}
                              placeholder="Describe AI assistance received..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Time savings or value gained? (Optional)
                            </label>
                            <textarea
                              value={formData.timeSavings}
                              onChange={(e) => setFormData(prev => ({ ...prev, timeSavings: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                              rows={3}
                              placeholder="Quantify benefits if possible..."
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'outcome' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Final project outcome
                            <Tooltip id="finalOutcome" content={tooltips.finalOutcome} />
                          </label>
                          <textarea
                            value={formData.outcome}
                            onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                            rows={4}
                            placeholder="Describe the successful outcome and results..."
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              What did the client say? (Optional quote/testimonial)
                            </label>
                            <textarea
                              value={formData.clientQuote}
                              onChange={(e) => setFormData(prev => ({ ...prev, clientQuote: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                              rows={3}
                              placeholder="Client feedback or testimonial..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                              Did Pandaura reduce time, errors, or handoff problems?
                            </label>
                            <textarea
                              value={formData.metrics}
                              onChange={(e) => setFormData(prev => ({ ...prev, metrics: e.target.value }))}
                              className="w-full px-3 py-2 bg-background border border-light rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                              rows={3}
                              placeholder="Specific improvements achieved..."
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'media' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Upload Files (Optional)
                            <Tooltip id="uploadFiles" content={tooltips.uploadFiles} />
                          </label>
                          <div className="border-2 border-dashed border-light rounded-lg p-6 text-center">
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <div className="space-y-2">
                                <div className="flex justify-center">
                                  <div className="flex space-x-2">
                                    <Image className="w-8 h-8 text-muted" />
                                    <FileText className="w-8 h-8 text-muted" />
                                  </div>
                                </div>
                                <p className="text-primary">Click to upload files</p>
                                <p className="text-xs text-muted">Screenshots, PDFs, exported logic blocks</p>
                                <p className="text-xs text-muted">Max 10MB per file • JPG, PNG, PDF, DOC</p>
                              </div>
                            </label>
                          </div>
                        </div>

                        {uploadedFiles.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-secondary mb-2">Uploaded Files</h4>
                            <div className="space-y-2">
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-background border border-light rounded-md">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-muted" />
                                    <span className="text-sm text-primary">{file.name}</span>
                                    <span className="text-xs text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                  <button
                                    onClick={() => removeFile(index)}
                                    className="text-error hover:text-error-dark transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {section.id === 'privacy' && (
                      <>
                        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-primary mb-2">Privacy & Security Controls</h4>
                              <p className="text-sm text-muted">
                                You're always in control. Please double-check that any identifying info is removed — we'll never expose sensitive details.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.removeClientData}
                              onChange={(e) => setFormData(prev => ({ ...prev, removeClientData: e.target.checked }))}
                              className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2 mt-1"
                            />
                            <div>
                              <span className="text-sm font-medium text-primary">Remove client-identifying data</span>
                              <p className="text-xs text-muted">Automatically sanitize client names and sensitive information (recommended)</p>
                            </div>
                          </label>

                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.confirmNoSensitiveData}
                              onChange={(e) => setFormData(prev => ({ ...prev, confirmNoSensitiveData: e.target.checked }))}
                              className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2 mt-1"
                            />
                            <div>
                              <span className="text-sm font-medium text-primary">I confirm this case study contains no confidential or sensitive client data</span>
                              <p className="text-xs text-muted">Required before uploading to public Case Study Hub</p>
                            </div>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="bg-surface border border-light rounded-lg p-6">
            <div className="flex flex-wrap gap-4 justify-between">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-6 py-3 bg-background border border-light rounded-md hover:border-accent transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>

              <button
                onClick={handleUploadToHub}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload to Case Study Hub
              </button>
            </div>
            
            <p className="text-xs text-muted mt-3 text-center">
              Drafts are stored locally only. Uploading shares your case study publicly with the automation community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}