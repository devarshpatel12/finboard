// Suppress Recharts dimension warnings - run immediately
(function() {
  if (typeof window === 'undefined') return;
  
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = function(...args: any[]) {
    const message = String(args[0] || '');
    
    // Suppress Recharts dimension warnings and component stacks
    if (
      message.includes('width(-1)') ||
      message.includes('height(-1)') ||
      message.includes('chart should be greater') ||
      message.includes('ResponsiveContainer') ||
      message.includes('ChartWidget') ||
      message.includes('ForwardRef')
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };
  
  console.error = function(...args: any[]) {
    const message = String(args[0] || '');
    
    if (
      message.includes('width(-1)') ||
      message.includes('height(-1)') ||
      message.includes('ResponsiveContainer') ||
      message.includes('ChartWidget')
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };
})();

export {};
