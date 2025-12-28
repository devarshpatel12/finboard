'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import StoreInitializer from '@/components/StoreInitializer';
import ThemeProvider from '@/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreInitializer />
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
