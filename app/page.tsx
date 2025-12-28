'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import AddWidgetModal from '@/components/AddWidgetModal';
import TemplateModal from '@/components/TemplateModal';
import SettingsModal from '@/components/SettingsModal';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { resetDashboard } from '@/store/dashboardSlice';
import { exportDashboard, importDashboard } from '@/utils/storage';
import { Plus, Download, Upload, Trash2, BarChart3, Layout, Settings } from 'lucide-react';

export default function Home() {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const dashboardState = useAppSelector((state) => state.dashboard);

  const handleExport = () => {
    exportDashboard(dashboardState);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await importDashboard(file);
        dispatch(resetDashboard());
        setTimeout(() => {
          dispatch({ type: 'dashboard/loadDashboard', payload: data });
        }, 100);
      } catch (error) {
        alert('Failed to import dashboard configuration');
      }
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the dashboard? This will remove all widgets.')) {
      dispatch(resetDashboard());
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  FinBoard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your Customizable Finance Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                title="API Settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <button
                onClick={() => setIsTemplateOpen(true)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                title="Load Template"
              >
                <Layout className="w-4 h-4" />
                Templates
              </button>

              <button
                onClick={() => setIsAddWidgetOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                title="Export Dashboard"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <label className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md cursor-pointer">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                title="Reset Dashboard"
              >
                <Trash2 className="w-4 h-4" />
                Reset
              </button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 py-6">
        <Dashboard />
      </main>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
      />

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
