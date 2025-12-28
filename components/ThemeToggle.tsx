'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setTheme } from '@/store/dashboardSlice';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.dashboard.theme);

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      ) : (
        <Sun className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      )}
    </button>
  );
}
