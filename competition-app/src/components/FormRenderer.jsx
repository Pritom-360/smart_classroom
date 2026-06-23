import React, { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function FormRenderer({ fields, onSubmit, loading }) {
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileChange = (fieldId, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileErrors(prev => ({ ...prev, [fieldId]: 'Only PDF files are supported' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [fieldId]: 'Maximum file size is 10MB' }));
      return;
    }
    setFileErrors(prev => ({ ...prev, [fieldId]: null }));
    setFiles(prev => ({ ...prev, [fieldId]: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate file upload fields are populated if required
    let hasError = false;
    fields.forEach(f => {
      if (f.type === 'file' && f.required && !files[f.id]) {
        setFileErrors(prev => ({ ...prev, [f.id]: 'Please upload the required PDF file' }));
        hasError = true;
      }
    });
    if (hasError) return;

    onSubmit(formData, files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(field => {
        const value = formData[field.id] || '';
        const error = fileErrors[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-red-550 dark:text-red-400 font-bold">*</span>}
            </label>

            {field.type === 'textarea' && (
              <textarea
                required={field.required}
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white min-h-[100px]"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}

            {field.type === 'select' && (
              <select
                required={field.required}
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="" disabled>Select option</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'file' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-900/50 cursor-pointer transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    Choose PDF
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(field.id, e.target.files[0])}
                    />
                  </label>
                  {files[field.id] && (
                    <span className="text-sm font-semibold truncate max-w-[200px] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <FileText className="w-4 h-4 shrink-0" />
                      {files[field.id].name}
                    </span>
                  )}
                </div>
                {error && (
                  <span className="text-xs text-red-650 dark:text-red-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {error}
                  </span>
                )}
              </div>
            )}

            {field.type === 'url' && (
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  required={field.required}
                  type="url"
                  value={value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            )}

            {field.type === 'text' && (
              <input
                required={field.required}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-75"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" /> Submit Entry
          </>
        )}
      </button>
    </form>
  );
}
