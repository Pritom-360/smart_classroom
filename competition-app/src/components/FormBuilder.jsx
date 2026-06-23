import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Settings, GripVertical } from 'lucide-react';

export default function FormBuilder({ fields, onChange }) {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newRequired, setNewRequired] = useState(true);
  const [newOptions, setNewOptions] = useState('');

  const addField = () => {
    if (!newLabel.trim()) return;
    const newField = {
      id: 'field_' + Math.random().toString(36).substr(2, 9),
      label: newLabel,
      type: newType,
      required: newRequired,
      options: newType === 'select' ? newOptions.split(',').map(o => o.trim()).filter(Boolean) : []
    };
    onChange([...fields, newField]);
    setNewLabel('');
    setNewOptions('');
  };

  const removeField = (id) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const moveField = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-500" />
          Add Custom Form Field
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Field Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. GitHub Repository Link"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Input Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="text">Text Input</option>
              <option value="textarea">Textarea (Paragraph)</option>
              <option value="url">URL Link</option>
              <option value="file">PDF File Upload</option>
              <option value="select">Dropdown Choice</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Required</label>
            <div className="flex items-center h-[38px]">
              <input
                type="checkbox"
                id="field-required"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="field-required" className="ml-2 text-sm text-slate-650 dark:text-slate-350">Field is Mandatory</label>
            </div>
          </div>

          <button
            type="button"
            onClick={addField}
            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-1.5 h-[38px] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>

        {newType === 'select' && (
          <div className="space-y-1 animate-fadeIn">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dropdown Choices (comma-separated)</label>
            <input
              type="text"
              value={newOptions}
              onChange={(e) => setNewOptions(e.target.value)}
              placeholder="e.g. Undergraduate, Master's, PhD, Other"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Form Fields Preview</h4>
        {fields.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No custom fields added yet. Only Name & Email will be collected by default.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{field.label}</span>
                    {field.required && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">Required</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-405 capitalize">{field.type} Field</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveField(idx, -1)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 text-slate-500 dark:text-slate-400"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === fields.length - 1}
                    onClick={() => moveField(idx, 1)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-50 text-slate-500 dark:text-slate-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
