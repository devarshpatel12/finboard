'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { loadDashboard } from '@/store/dashboardSlice';
import { dashboardTemplates, applyTemplate } from '@/utils/templates';
import { X, Check } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateModal({ isOpen, onClose }: TemplateModalProps) {
  const dispatch = useAppDispatch();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleApplyTemplate = () => {
    const template = dashboardTemplates.find(t => t.id === selectedTemplate);
    if (template) {
      const dashboardState = applyTemplate(template);
      dispatch(loadDashboard(dashboardState));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a pre-built dashboard to get started quickly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Selection Indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-3">{template.icon}</div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {template.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>

                {/* Widget Count */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {template.widgets.length} widgets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className={`px-6 py-2 rounded-lg transition-colors ${
              selectedTemplate
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}
