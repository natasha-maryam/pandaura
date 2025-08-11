import React, { useState } from "react";
import { 
  ChevronDown, 
  Upload, 
  Download, 
  X, 
  Check, 
  FileText, 
  Database, 
  Settings, 
  Eye,
  Bot,
  Plus,
  Minus,
  Zap
} from "lucide-react";
import PandauraOrb from "../components/PandauraOrb";

interface DocumentCard {
  id: string;
  title: string;
  description: string;
  status: 'ready' | 'pending' | 'generating';
  source: string;
  formats: string[];
  selected: boolean;
}

interface UploadedFile {
  name: string;
  tag: string;
  status: 'analyzed' | 'pending';
  type: 'logic' | 'spec' | 'io' | 'doc';
}

interface ClientInfo {
  companyName: string;
  projectName: string;
  projectId: string;
  contactName: string;
  contactEmail: string;
  siteAddress: string;
  deliveryDate: string;
  integratorCompany: string;
}

interface AutoDocsProps {
  sessionMode?: boolean;
}

export default function AutoDocs({ sessionMode = false }: AutoDocsProps) {
  const [logicSource, setLogicSource] = useState("logic-studio");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    companyName: "",
    projectName: "",
    projectId: "",
    contactName: "",
    contactEmail: "",
    siteAddress: "",
    deliveryDate: "",
    integratorCompany: "Pandaura Automation Systems"
  });

  const [documents, setDocuments] = useState<DocumentCard[]>([
    {
      id: 'functional-desc',
      title: 'Functional Description',
      description: 'Comprehensive system operation description',
      status: 'ready',
      source: 'Logic Studio ST Code',
      formats: ['DOCX', 'PDF', 'TXT'],
      selected: false
    },
    {
      id: 'sequence-ops',
      title: 'Sequence of Operations',
      description: 'Step-by-step operational procedures',
      status: 'ready',
      source: 'Logic Studio ST Code',
      formats: ['DOCX', 'PDF'],
      selected: false
    },
    {
      id: 'tag-database',
      title: 'Tag Database',
      description: 'Complete I/O and variable listing',
      status: 'ready',
      source: 'Tag Database Manager',
      formats: ['XLSX', 'CSV'],
      selected: false
    },
    {
      id: 'io-map',
      title: 'I/O Map',
      description: 'Physical input/output assignments',
      status: 'ready',
      source: 'Logic Studio Analysis',
      formats: ['XLSX', 'PDF'],
      selected: false
    },
    {
      id: 'logic-summary',
      title: 'Logic Summary Report',
      description: 'High-level logic overview and statistics',
      status: 'ready',
      source: 'Logic Studio ST Code',
      formats: ['DOCX', 'PDF'],
      selected: false
    },
    {
      id: 'hmi-tags',
      title: 'HMI Tag List',
      description: 'Human Machine Interface tag definitions',
      status: 'pending',
      source: 'Auto-detected from Logic',
      formats: ['XLSX', 'CSV'],
      selected: false
    },
    {
      id: 'alarm-list',
      title: 'Alarm List',
      description: 'System alarm definitions and responses',
      status: 'ready',
      source: 'Logic Studio Analysis',
      formats: ['XLSX', 'DOCX'],
      selected: false
    },
    {
      id: 'revision-history',
      title: 'Revision History / Change Log',
      description: 'Project version control and modifications',
      status: 'ready',
      source: 'Auto-generated',
      formats: ['DOCX', 'PDF'],
      selected: false
    }
  ]);

  const handleLogicSourceChange = (value: string) => {
    setLogicSource(value);
    setShowUploadPanel(value === "import");
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      name: file.name,
      tag: getFileTag(file.name),
      status: 'pending',
      type: getFileType(file.name)
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate analysis
    setTimeout(() => {
      setUploadedFiles(prev => 
        prev.map(f => newFiles.some(nf => nf.name === f.name) ? {...f, status: 'analyzed'} : f)
      );
    }, 2000);
  };

  const getFileTag = (filename: string): string => {
    const ext = filename.toLowerCase();
    if (ext.includes('.st') || ext.includes('.acd') || ext.includes('.s7p')) return '[Logic]';
    if (ext.includes('.xlsx') || ext.includes('.csv')) return '[I/O List]';
    if (ext.includes('.docx') || ext.includes('.pdf')) return '[Functional Spec]';
    return '[Document]';
  };

  const getFileType = (filename: string): 'logic' | 'spec' | 'io' | 'doc' => {
    const ext = filename.toLowerCase();
    if (ext.includes('.st') || ext.includes('.acd') || ext.includes('.s7p')) return 'logic';
    if (ext.includes('.xlsx') || ext.includes('.csv')) return 'io';
    if (ext.includes('.docx') || ext.includes('.pdf')) return 'spec';
    return 'doc';
  };

  const toggleDocumentSelection = (id: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id ? { ...doc, selected: !doc.selected } : doc
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = documents.every(doc => doc.selected);
    setDocuments(prev => 
      prev.map(doc => ({ ...doc, selected: !allSelected }))
    );
  };

  const exportSelected = () => {
    const selected = documents.filter(doc => doc.selected);
    if (selected.length === 0) {
      alert("Please select documents to export");
      return;
    }
    
    console.log("Exporting documents:", selected.map(d => d.title));
    alert(`Generating ${selected.length} document(s)...\nDownload will begin shortly.`);
  };

  const previewContent = selectedPreview ? documents.find(d => d.id === selectedPreview) : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Bar */}
      <header className="bg-white border-b border-light px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">AutoDocs</h1>
          
          {/* Logic Source Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={logicSource}
                onChange={(e) => handleLogicSourceChange(e.target.value)}
                className="border border-light rounded px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="logic-studio">Use Logic from Logic Studio</option>
                <option value="import">Import Logic / Docs</option>
              </select>
            </div>

            {/* Export Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-muted hover:text-primary px-3 py-2"
              >
                {documents.every(d => d.selected) ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={exportSelected}
                className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Selected
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Client Information Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowClientInfo(!showClientInfo)}
              className="flex items-center gap-2 w-full p-3 bg-white border border-light rounded-md hover:bg-gray-50 transition-colors"
            >
              {showClientInfo ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="text-sm font-medium">Add Client Information (Optional)</span>
            </button>

            {showClientInfo && (
              <div className="mt-3 p-4 bg-white border border-light rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Client Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientInfo.companyName}
                      onChange={(e) => setClientInfo(prev => ({...prev, companyName: e.target.value}))}
                      className="w-full border border-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="e.g., Acme Manufacturing"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientInfo.projectName}
                      onChange={(e) => setClientInfo(prev => ({...prev, projectName: e.target.value}))}
                      className="w-full border border-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="e.g., Batch Mixing Control System"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Project ID / Reference</label>
                    <input
                      type="text"
                      value={clientInfo.projectId}
                      onChange={(e) => setClientInfo(prev => ({...prev, projectId: e.target.value}))}
                      className="w-full border border-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="e.g., PRJ-2025-001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Date of Delivery <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={clientInfo.deliveryDate}
                      onChange={(e) => setClientInfo(prev => ({...prev, deliveryDate: e.target.value}))}
                      className="w-full border border-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted mb-1">Site Address / Location</label>
                    <textarea
                      value={clientInfo.siteAddress}
                      onChange={(e) => setClientInfo(prev => ({...prev, siteAddress: e.target.value}))}
                      className="w-full border border-light rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      rows={2}
                      placeholder="Installation site address..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Smart Upload Panel */}
          {showUploadPanel && (
            <div className="mb-6 p-4 bg-white border border-light rounded-md">
              <h3 className="text-lg font-medium mb-4">Smart Upload Panel</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted mb-2">
                  Drag & drop files here or{" "}
                  <button className="text-accent hover:underline">browse files</button>
                </p>
                <p className="text-xs text-muted">
                  Supported: .ACD, .S7P, .XML, .ST, .TXT, .DOCX, .PDF, .XLSX, .CSV
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  accept=".acd,.s7p,.xml,.st,.txt,.docx,.pdf,.xlsx,.csv"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs bg-accent-light text-accent px-2 py-1 rounded">
                          {file.tag}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          file.status === 'analyzed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {file.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                        </span>
                      </div>
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-muted hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Document Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 bg-white border rounded-md cursor-pointer transition-all ${
                  doc.selected ? 'border-accent bg-accent-light' : 'border-light hover:border-gray-300'
                }`}
                onClick={() => toggleDocumentSelection(doc.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={doc.selected}
                      onChange={() => {}}
                      className="accent-primary"
                    />
                    <h3 className="font-medium text-sm">{doc.title}</h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreview(selectedPreview === doc.id ? null : doc.id);
                      }}
                      className="text-muted hover:text-primary"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Generating ${doc.title}...`);
                        alert(`Generating ${doc.title}...\nThis will create the document using current project data.`);
                      }}
                      className="text-accent hover:text-purple-600"
                      title="Generate"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className={`flex items-center gap-1 text-xs ${
                    doc.status === 'ready' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {doc.status === 'ready' ? <Check className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                    {doc.status === 'ready' ? 'Ready to Generate' : 'Pending Input'}
                  </div>
                  
                  <div className="text-xs text-muted">
                    Generated from: {doc.source}
                  </div>
                  
                  <div className="text-xs text-muted">
                    Format: {doc.formats.join(', ')}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Exporting ${doc.title}`);
                    alert(`Generating ${doc.title}...`);
                  }}
                  className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-primary px-3 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Document Preview Panel */}
        {selectedPreview && previewContent && (
          <div className="w-2/5 bg-white border-l border-light p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">{previewContent.title}</h3>
                <p className="text-sm text-muted">Source: {previewContent.source}</p>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="text-muted hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded border text-sm">
              <h4 className="font-medium mb-2">Document Preview:</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>1. SYSTEM OVERVIEW</div>
                <div className="ml-4">1.1 Project: {clientInfo.projectName || 'Motor Control System'}</div>
                <div className="ml-4">1.2 Client: {clientInfo.companyName || 'Industrial Client'}</div>
                <div className="ml-4">1.3 Delivery Date: {clientInfo.deliveryDate || 'TBD'}</div>
                <div>2. FUNCTIONAL DESCRIPTION</div>
                <div className="ml-4">2.1 The system controls motor operation with safety interlocks...</div>
                <div className="ml-4">2.2 Emergency stop functionality provides immediate shutdown...</div>
                <div>3. SEQUENCE OF OPERATIONS</div>
                <div className="ml-4">3.1 System startup sequence...</div>
                <div className="text-muted">... (continues for {Math.floor(Math.random() * 20) + 10} pages)</div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-accent text-white px-4 py-2 rounded text-sm hover:bg-purple-600 transition-colors">
                Regenerate with AI Edits
              </button>
              
              <div className="relative">
                <select className="w-full border border-light rounded px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                  <option>Export as...</option>
                  {previewContent.formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-primary" />
                Include in ZIP Export
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}