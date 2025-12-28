import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WidgetConfig, LayoutItem, DashboardState } from '@/types';

const initialState: DashboardState = {
  widgets: {},
  layout: [],
  theme: 'light',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<WidgetConfig>) => {
      const widget = action.payload;
      state.widgets[widget.id] = widget;
      
      // Add to layout with default position
      const newLayout: LayoutItem = {
        i: widget.id,
        x: (state.layout.length * 3) % 12, // Better distribution across full width
        y: Infinity, // puts it at the bottom
        w: widget.type === 'chart' ? 6 : widget.type === 'table' ? 12 : 4,
        h: widget.type === 'chart' ? 4 : widget.type === 'table' ? 5 : 3,
        minW: 3,
        minH: 2,
      };
      state.layout.push(newLayout);
    },
    
    removeWidget: (state, action: PayloadAction<string>) => {
      const widgetId = action.payload;
      delete state.widgets[widgetId];
      state.layout = state.layout.filter(item => item.i !== widgetId);
    },
    
    updateWidget: (state, action: PayloadAction<{ id: string; config: Partial<WidgetConfig> }>) => {
      const { id, config } = action.payload;
      if (state.widgets[id]) {
        state.widgets[id] = { ...state.widgets[id], ...config };
      }
    },
    
    updateLayout: (state, action: PayloadAction<LayoutItem[]>) => {
      state.layout = action.payload;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    loadDashboard: (state, action: PayloadAction<DashboardState>) => {
      return action.payload;
    },
    
    resetDashboard: () => {
      return initialState;
    },
  },
});

export const {
  addWidget,
  removeWidget,
  updateWidget,
  updateLayout,
  setTheme,
  loadDashboard,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
