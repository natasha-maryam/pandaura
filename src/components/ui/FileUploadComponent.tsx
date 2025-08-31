import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image, FileText, AlertCircle } from 'lucide-react';
import { aiService } from '../../services/aiService';

interface FileUploadComponentProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete?: (results: any[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  wrapperType?: 'A' | 'B'; // Add wrapper type prop
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  category: 'image' | 'document' | 'plc' | 'unsupported';
}

export default function FileUploadComponent({
  onFilesSelected,
  onUploadComplete,
  maxFiles = 10,
  disabled = false,
  className = '',
  wrapperType = 'A', // Default to wrapper A
}: FileUploadComponentProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createFilePreview = (file: File): FilePreview => {
    const category = aiService.getFileTypeCategory(file, wrapperType);
    const filePreview: FilePreview = {
      file,
      id: generateFileId(),
      category,
    };

    // Create preview for images
    if (category === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreview.preview = e.target?.result as string;
        setFiles(prev => prev.map(f => f.id === filePreview.id ? filePreview : f));
      };
      reader.readAsDataURL(file);
    }

    return filePreview;
  };

  const handleFilesChange = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter(file => aiService.isFileSupported(file, wrapperType));
    
    if (validFiles.length !== fileArray.length) {
      console.warn('Some files were rejected due to unsupported format');
    }

    if (files.length + validFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFilePreviews = validFiles.map(createFilePreview);
    const updatedFiles = [...files, ...newFilePreviews];
    
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles.map(fp => fp.file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFilesChange(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesChange(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles.map(fp => fp.file));
  };

  const clearAllFiles = () => {
    setFiles([]);
    onFilesSelected([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'plc':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getFileTypeColor = (category: string) => {
    switch (category) {
      case 'image':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'document':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'plc':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver && !disabled ? 'border-primary bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-gray-50 cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        
        <div className="space-y-2">
          <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            Images: PNG, JPG, GIF, WebP | Documents: PDF, DOC, TXT, CSV, XLS, PPT
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} files, up to 50MB each
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={clearAllFiles}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
              disabled={disabled || isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="grid gap-2">
            {files.map((filePreview) => (
              <div
                key={filePreview.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${getFileTypeColor(filePreview.category)}
                `}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-white">
                      {getFileIcon(filePreview.category)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs opacity-75">
                    {formatFileSize(filePreview.file.size)} • {filePreview.category}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(filePreview.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                  disabled={disabled || isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
          <span className="text-sm text-primary">Processing files...</span>
        </div>
      )}
    </div>
  );
}
