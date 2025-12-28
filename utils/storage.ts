import { DashboardState } from '@/types';

const STORAGE_KEY = 'finboard-dashboard';

export const saveToLocalStorage = (data: DashboardState) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (): DashboardState | null => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
};

export const exportDashboard = (data: DashboardState) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finboard-config-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const importDashboard = (file: File): Promise<DashboardState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
