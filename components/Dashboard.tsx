'use client';

import { useState, useEffect, useRef } from 'react';
import { Responsive, Layout } from 'react-grid-layout';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { updateLayout } from '@/store/dashboardSlice';
import Widget from './widgets/Widget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { widgets, layout } = useAppSelector((state) => state.dashboard);
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth - 32 : 1200); // Account for padding
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onLayoutChange = (layout: Layout, layouts: { [key: string]: Layout }) => {
    // Use the layout for 'lg' breakpoint
    const newLayout = layout as any[];
    const updatedLayout = newLayout.map((item: any) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW || 2,
      minH: item.minH || 2,
    }));
    dispatch(updateLayout(updatedLayout));
  };

  const widgetArray = Object.values(widgets);

  if (widgetArray.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-transparent">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            No widgets added yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Click the "Add Widget" button to get started
          </p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div ref={containerRef} className="bg-transparent">
      <Responsive
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        width={width}
        onLayoutChange={onLayoutChange}
      >
        {widgetArray.map((widget) => (
          <div key={widget.id}>
            <Widget config={widget} />
          </div>
        ))}
      </Responsive>
    </div>
  );
}
