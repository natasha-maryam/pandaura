import React, { useState, useEffect, useRef } from "react";
import { Download, ChevronDown, Bot, Edit, Trash2, Plus, Check, X } from "lucide-react";
import PandauraOrb from "../components/PandauraOrb";

interface Tag {
  id: string;
  name: string;
  description: string;
  dataType: string;
  tagType: string;
  vendor: string;
  scope: string;
  address: string;
  defaultValue: string;
  isAIGenerated: boolean;
}

interface TagDatabaseManagerProps {
  sessionMode?: boolean;
}

export default function TagDatabaseManager({ sessionMode = false }: TagDatabaseManagerProps) {
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [selectedTagType, setSelectedTagType] = useState("All Tag Types");
  const [selectedDataType, setSelectedDataType] = useState("All Data Types");
  const [selectedScope, setSelectedScope] = useState("All Scopes");
  const [showAIOnly, setShowAIOnly] = useState(false);
  
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [tags, setTags] = useState<Tag[]>([
    {
      id: "1",
      name: "Motor_Start_Button",
      description: "Main motor start pushbutton input",
      dataType: "BOOL",
      tagType: "Input",
      vendor: "Rockwell",
      scope: "Global",
      address: "I:1/0",
      defaultValue: "FALSE",
      isAIGenerated: true
    },
    {
      id: "2", 
      name: "Emergency_Stop",
      description: "Emergency stop safety circuit",
      dataType: "BOOL",
      tagType: "Input",
      vendor: "Rockwell",
      scope: "Global",
      address: "I:1/1",
      defaultValue: "TRUE",
      isAIGenerated: true
    },
    {
      id: "3",
      name: "Motor_Running",
      description: "Motor running status output",
      dataType: "BOOL",
      tagType: "Output",
      vendor: "Rockwell",
      scope: "Global", 
      address: "O:2/0",
      defaultValue: "FALSE",
      isAIGenerated: true
    },
    {
      id: "4",
      name: "Conveyor_Speed",
      description: "Conveyor belt speed setpoint",
      dataType: "REAL",
      tagType: "Memory",
      vendor: "Rockwell",
      scope: "Global",
      address: "N7:10",
      defaultValue: "0.0",
      isAIGenerated: false
    },
    {
      id: "5",
      name: "Temperature_Sensor",
      description: "Process temperature analog input",
      dataType: "INT",
      tagType: "Input",
      vendor: "Siemens",
      scope: "Global",
      address: "IW100",
      defaultValue: "0",
      isAIGenerated: false
    },
    {
      id: "6",
      name: "Alarm_Active",
      description: "System alarm indicator",
      dataType: "BOOL",
      tagType: "Memory",
      vendor: "Siemens",
      scope: "Local",
      address: "M0.0",
      defaultValue: "FALSE",
      isAIGenerated: true
    },
    {
      id: "7",
      name: "Valve_Position",
      description: "Control valve position feedback",
      dataType: "REAL",
      tagType: "Input",
      vendor: "Beckhoff",
      scope: "Global",
      address: "%IW0",
      defaultValue: "0.0",
      isAIGenerated: false
    },
    {
      id: "8",
      name: "System_Ready",
      description: "System ready for operation",
      dataType: "BOOL",
      tagType: "Memory",
      vendor: "Beckhoff",
      scope: "Global",
      address: "%MW0",
      defaultValue: "FALSE",
      isAIGenerated: true
    }
  ]);

  const filteredTags = tags.filter(tag => {
    if (searchTerm && !tag.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tag.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedVendor !== "All Vendors" && tag.vendor !== selectedVendor) return false;
    if (selectedTagType !== "All Tag Types" && tag.tagType !== selectedTagType) return false;
    if (selectedDataType !== "All Data Types" && tag.dataType !== selectedDataType) return false;
    if (selectedScope !== "All Scopes" && tag.scope !== selectedScope) return false;
    if (showAIOnly && !tag.isAIGenerated) return false;
    return true;
  });

  const handleEditTag = (tagId: string, field: string, value: string) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, [field]: value } : tag
    ));
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    }
  };

  const handleAddTag = () => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name: "New_Tag",
      description: "New tag description",
      dataType: "BOOL",
      tagType: "Memory",
      vendor: "Rockwell",
      scope: "Global",
      address: "",
      defaultValue: "FALSE",
      isAIGenerated: false
    };
    setTags(prev => [newTag, ...prev]);
    setEditingTag(newTag.id);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* 🟨 Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-light px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-primary">Tag Database Manager</h1>

        <div className="flex gap-3 items-center">
          <button 
            onClick={() => {
              console.log("Exporting to Excel...");
              alert("Excel export initiated! Tags will be downloaded as .xlsx file.");
            }}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-secondary transition-colors cursor-pointer"
          >
            Export to Excel (.xlsx)
          </button>
          <div className="relative" ref={vendorDropdownRef}>
            <button
              onClick={() => setShowVendorDropdown(!showVendorDropdown)}
              className="bg-white border border-light px-4 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-accent-light transition-colors cursor-pointer"
            >
              Export to Vendor Format <ChevronDown className="w-4 h-4" />
            </button>
            {showVendorDropdown && (
              <div className="absolute right-0 mt-2 bg-white border border-light rounded-md shadow-md w-56 z-50">
                {["Rockwell CSV", "TIA XML", "Beckhoff XLS"].map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      console.log(`Exporting to ${item}...`);
                      alert(`${item} export initiated! File will be downloaded shortly.`);
                      setShowVendorDropdown(false);
                    }}
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🟨 Sticky Filter/Search Panel */}
      <div className="sticky top-[64px] z-20 bg-white border-b border-light px-6 py-3 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-light rounded px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option>All Vendors</option>
          <option>Rockwell</option>
          <option>Siemens</option>
          <option>Beckhoff</option>
        </select>

        <select
          value={selectedTagType}
          onChange={(e) => setSelectedTagType(e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option>All Tag Types</option>
          <option>Input</option>
          <option>Output</option>
          <option>Memory</option>
          <option>Temp</option>
          <option>Constant</option>
        </select>

        <select
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option>All Data Types</option>
          <option>BOOL</option>
          <option>INT</option>
          <option>REAL</option>
          <option>DINT</option>
          <option>STRING</option>
          <option>TIMER</option>
          <option>COUNTER</option>
        </select>

          <select
          value={selectedScope}
          onChange={(e) => setSelectedScope(e.target.value)}
            className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
          <option>All Scopes</option>
          <option>Global</option>
          <option>Local</option>
          </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={showAIOnly}
            onChange={(e) => setShowAIOnly(e.target.checked)}
            className="accent-primary cursor-pointer" 
          />
          Show AI-generated only
        </label>

        <button
          onClick={handleAddTag}
          className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* 🟨 Scrollable Table Area */}
      <div className="flex-1 px-6 py-4 pb-32 overflow-auto">
        <div className="bg-white border border-light rounded-md shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-light">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-primary">Tag Name</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Description</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Type</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Data Type</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Address</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Default</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Vendor</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Scope</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id} className="border-b border-light hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {editingTag === tag.id ? (
                        <input
                          type="text"
                          value={tag.name}
                          onChange={(e) => handleEditTag(tag.id, 'name', e.target.value)}
                          className="border border-light rounded px-2 py-1 text-sm w-full font-mono"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-sm">{tag.name}</span>
                      )}
                      {tag.isAIGenerated && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">AI</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.description}
                        onChange={(e) => handleEditTag(tag.id, 'description', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      <span className="text-sm text-muted">{tag.description}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.tagType}
                        onChange={(e) => handleEditTag(tag.id, 'tagType', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option>Input</option>
                        <option>Output</option>
                        <option>Memory</option>
                        <option>Temp</option>
                        <option>Constant</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        tag.tagType === 'Input' ? 'bg-blue-100 text-blue-700' :
                        tag.tagType === 'Output' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tag.tagType}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.dataType}
                        onChange={(e) => handleEditTag(tag.id, 'dataType', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option>BOOL</option>
                        <option>INT</option>
                        <option>REAL</option>
                        <option>DINT</option>
                        <option>STRING</option>
                        <option>TIMER</option>
                        <option>COUNTER</option>
                      </select>
                    ) : (
                      <span className="text-sm font-mono">{tag.dataType}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.address}
                        onChange={(e) => handleEditTag(tag.id, 'address', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm font-mono w-20"
                      />
                    ) : (
                      <span className="text-sm font-mono text-muted">{tag.address}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.defaultValue}
                        onChange={(e) => handleEditTag(tag.id, 'defaultValue', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm font-mono w-16"
                      />
                    ) : (
                      <span className="text-sm font-mono text-muted">{tag.defaultValue}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.vendor}
                        onChange={(e) => handleEditTag(tag.id, 'vendor', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option>Rockwell</option>
                        <option>Siemens</option>
                        <option>Beckhoff</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        tag.vendor === 'Rockwell' ? 'bg-red-100 text-red-700' :
                        tag.vendor === 'Siemens' ? 'bg-teal-100 text-teal-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {tag.vendor}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.scope}
                        onChange={(e) => handleEditTag(tag.id, 'scope', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option>Global</option>
                        <option>Local</option>
                      </select>
                    ) : (
                      <span className="text-sm">{tag.scope}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {editingTag === tag.id ? (
                        <>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTag(tag.id)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-muted">
              <div className="mb-2">No tags match your current filters</div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedVendor("All Vendors");
                  setSelectedTagType("All Tag Types");
                  setSelectedDataType("All Data Types");
                  setSelectedScope("All Scopes");
                  setShowAIOnly(false);
                }}
                className="text-accent hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
