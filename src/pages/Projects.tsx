import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  User, 
  Building, 
  Settings,
  Archive,
  Copy,
  Trash2,
  Edit3,
  Grid,
  List,
  Eye,
  EyeOff
} from "lucide-react";
import PandauraOrb from "../components/PandauraOrb";

interface Project {
  id: string;
  name: string;
  clientName: string;
  lastModified: string;
  status: 'In Progress' | 'Completed' | 'Archived';
  vendor: 'Rockwell' | 'Siemens' | 'Beckhoff';
  tags: string[];
  createdBy: string;
  description: string;
  projectType: string;
}

interface NewProjectModal {
  show: boolean;
  name: string;
  clientName: string;
  projectType: string;
  vendor: 'Rockwell' | 'Siemens' | 'Beckhoff';
  description: string;
}

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState("lastModified");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [newProject, setNewProject] = useState<NewProjectModal>({
    show: false,
    name: "",
    clientName: "",
    projectType: "",
    vendor: "Rockwell",
    description: ""
  });

  const [projects] = useState<Project[]>([
    {
      id: "proj-001",
      name: "Batch Mixing Control V2",
      clientName: "Acme Chemicals",
      lastModified: "Aug 4, 2025 - 8:22 PM",
      status: "In Progress",
      vendor: "Rockwell",
      tags: ["#FoodIndustry", "#PID", "#Safety"],
      createdBy: "Matthew Hughes",
      description: "Automated batch mixing system with recipe management",
      projectType: "Process Control"
    },
    {
      id: "proj-002", 
      name: "Conveyor Line Automation",
      clientName: "Manufacturing Corp",
      lastModified: "Aug 3, 2025 - 2:15 PM",
      status: "Completed",
      vendor: "Siemens",
      tags: ["#Conveyor", "#SCADA", "#HMI"],
      createdBy: "Sarah Johnson",
      description: "Multi-zone conveyor system with tracking",
      projectType: "Material Handling"
    },
    {
      id: "proj-003",
      name: "Boiler Control System",
      clientName: "Energy Solutions",
      lastModified: "Jul 28, 2025 - 4:45 PM", 
      status: "Archived",
      vendor: "Beckhoff",
      tags: ["#Boiler", "#Safety", "#Modbus"],
      createdBy: "Mike Davis",
      description: "Steam boiler control with safety interlocks",
      projectType: "HVAC Control"
    },
    {
      id: "proj-004",
      name: "Packaging Line Control",
      clientName: "PackCorp Industries",
      lastModified: "Aug 2, 2025 - 11:30 AM",
      status: "In Progress", 
      vendor: "Rockwell",
      tags: ["#Packaging", "#Vision", "#Robotics"],
      createdBy: "Lisa Chen",
      description: "Automated packaging with vision inspection",
      projectType: "Packaging"
    }
  ]);

  const filteredProjects = projects.filter(project => {
    if (!showArchived && project.status === 'Archived') return false;
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !project.clientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTags.length > 0 && !filterTags.some(tag => project.tags.includes(tag))) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'client': return a.clientName.localeCompare(b.clientName);
      case 'vendor': return a.vendor.localeCompare(b.vendor);
      default: return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    }
  });

  const handleNewProject = () => {
    if (!newProject.name.trim()) {
      alert("Project name is required");
      return;
    }

    console.log("Creating new project:", newProject);
    alert(`New project "${newProject.name}" created!\nOpening all modules with clean environment...`);
    
    // Reset form
    setNewProject({
      show: false,
      name: "",
      clientName: "",
      projectType: "",
      vendor: "Rockwell",
      description: ""
    });
    setShowNewProjectModal(false);
  };

  const handleProjectAction = (projectId: string, action: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    switch (action) {
      case 'open':
        console.log("Opening project:", project.name);
        alert(`Opening "${project.name}"\nRestoring Logic Studio, Tag Database, AutoDocs, and Pandaura AS state...`);
        break;
      case 'rename':
        const newName = prompt("Enter new project name:", project.name);
        if (newName) {
          console.log("Renaming project to:", newName);
          alert(`Project renamed to "${newName}"`);
        }
        break;
      case 'duplicate':
        console.log("Duplicating project:", project.name);
        alert(`Creating copy of "${project.name}"`);
        break;
      case 'archive':
        console.log("Archiving project:", project.name);
        alert(`"${project.name}" archived`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
          console.log("Deleting project:", project.name);
          alert(`"${project.name}" deleted`);
        }
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getVendorColor = (vendor: string) => {
    switch (vendor) {
      case 'Rockwell': return 'bg-red-100 text-red-700';
      case 'Siemens': return 'bg-teal-100 text-teal-700';
      case 'Beckhoff': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-white border-b border-light px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Projects</h1>
          
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex border border-light rounded overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Archived Toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-sm text-muted hover:text-primary"
            >
              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showArchived ? 'Hide' : 'Show'} Archived
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between mt-4">
          {/* New Project */}
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>

          {/* Search & Filter */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-light rounded w-64 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-light rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent appearance-none pr-8"
              >
                <option value="lastModified">Last Modified</option>
                <option value="name">Project Name</option>
                <option value="client">Client Name</option>
                <option value="vendor">Vendor</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Projects Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                  project.status === 'Archived' ? 'opacity-60' : ''
                }`}
                onClick={() => handleProjectAction(project.id, 'open')}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-primary truncate pr-2">{project.name}</h3>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(selectedProject === project.id ? null : project.id);
                      }}
                      className="text-muted hover:text-primary p-1"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {selectedProject === project.id && (
                      <div className="absolute right-0 top-6 bg-white border border-light rounded shadow-lg py-1 z-10 w-36">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'rename'); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-3 h-3" /> Rename
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'duplicate'); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-3 h-3" /> Duplicate
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'archive'); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'delete'); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Building className="w-3 h-3" />
                    {project.clientName}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="w-3 h-3" />
                    {project.lastModified}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted">
                    <User className="w-3 h-3" />
                    {project.createdBy}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getVendorColor(project.vendor)}`}>
                    {project.vendor}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-light rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Project Name</th>
                  <th className="text-left p-4 font-medium">Client</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Vendor</th>
                  <th className="text-left p-4 font-medium">Last Modified</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={`border-t border-light hover:bg-gray-50 cursor-pointer ${
                      project.status === 'Archived' ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleProjectAction(project.id, 'open')}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted">{project.description}</div>
                      </div>
                    </td>
                    <td className="p-4">{project.clientName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getVendorColor(project.vendor)}`}>
                        {project.vendor}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted">{project.lastModified}</td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(selectedProject === project.id ? null : project.id);
                        }}
                        className="text-muted hover:text-primary"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted mb-4">
              {searchQuery ? 'No projects match your search' : 'No projects found'}
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-primary text-white px-6 py-2 rounded"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({...prev, name: e.target.value}))}
                  className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Batch Mixing Control V2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Client Company Name</label>
                <input
                  type="text"
                  value={newProject.clientName}
                  onChange={(e) => setNewProject(prev => ({...prev, clientName: e.target.value}))}
                  className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Acme Manufacturing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project Type</label>
                <select
                  value={newProject.projectType}
                  onChange={(e) => setNewProject(prev => ({...prev, projectType: e.target.value}))}
                  className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select type...</option>
                  <option value="Process Control">Process Control</option>
                  <option value="Material Handling">Material Handling</option>
                  <option value="Packaging">Packaging</option>
                  <option value="HVAC Control">HVAC Control</option>
                  <option value="Safety Systems">Safety Systems</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target PLC Vendor</label>
                <select
                  value={newProject.vendor}
                  onChange={(e) => setNewProject(prev => ({...prev, vendor: e.target.value as any}))}
                  className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Rockwell">Rockwell Automation</option>
                  <option value="Siemens">Siemens</option>
                  <option value="Beckhoff">Beckhoff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({...prev, description: e.target.value}))}
                  className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                  placeholder="Brief project description..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="flex-1 border border-light px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewProject}
                className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-secondary"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}