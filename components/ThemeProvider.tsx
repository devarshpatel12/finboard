'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector(state => state.dashboard.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
