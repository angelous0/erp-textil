import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FileUpload = ({ value, onChange, accept = '*', multiple = false }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(value ? (Array.isArray(value) ? value : [value]) : []);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedFiles.push(response.data.filename);
      }

      const newFiles = multiple ? [...files, ...uploadedFiles] : uploadedFiles;
      setFiles(newFiles);
      onChange(multiple ? newFiles : newFiles[0]);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  }, [files, multiple, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
  });

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange(multiple ? newFiles : null);
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={
          isDragActive
            ? 'border-2 border-dashed border-blue-500 bg-blue-50 rounded-lg p-6 text-center cursor-pointer transition-colors'
            : 'border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors'
        }
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto text-slate-400 mb-2" size={32} />
        {uploading ? (
          <p className="text-sm text-slate-600">Subiendo...</p>
        ) : isDragActive ? (
          <p className="text-sm text-blue-600">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-sm text-slate-600">Arrastra archivos aquí o haz clic para seleccionar</p>
            <p className="text-xs text-slate-400 mt-1">Soporta: {accept}</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200"
            >
              <div className="flex items-center space-x-2">
                <File size={18} className="text-slate-500" />
                <span className="text-sm text-slate-700 font-mono">{file}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-slate-500 hover:text-red-600"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;