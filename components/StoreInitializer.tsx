'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { loadDashboard, setTheme } from '@/store/dashboardSlice';
import { loadFromLocalStorage, saveToLocalStorage } from '@/utils/storage';

export default function StoreInitializer() {
  const dispatch = useAppDispatch();
  const dashboardState = useAppSelector(state => state.dashboard);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      // Filter out any widgets with AAPL as default or containing only AAPL
      const filteredWidgets: typeof savedData.widgets = {};
      Object.entries(savedData.widgets).forEach(([id, widget]) => {
        // Skip widgets that use AAPL
        const hasAAPL = 
          widget.chartConfig?.symbol === 'AAPL' ||
          (widget.cardConfig?.symbols?.length === 1 && widget.cardConfig.symbols[0] === 'AAPL');
        
        if (!hasAAPL) {
          filteredWidgets[id] = widget;
        }
      });
      
      // Update layout to remove AAPL widgets
      const filteredLayout = savedData.layout.filter(item => filteredWidgets[item.i]);
      
      dispatch(loadDashboard({
        ...savedData,
        widgets: filteredWidgets,
        layout: filteredLayout,
      }));
    }
  }, [dispatch]);

  // Save to localStorage when state changes (including empty state after deletion/reset)
  useEffect(() => {
    saveToLocalStorage(dashboardState);
  }, [dashboardState]);

  return null;
}
