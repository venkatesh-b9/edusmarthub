import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AnalyticsData {
  dateRange: { start: string; end: string };
  predictions: Array<{ date: string; value: number }>;
  heatmapData: Array<{ lat: number; lng: number; intensity: number }>;
  comparisonData: Record<string, any>;
}

interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  dateRange: { start: string; end: string };
}

const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsData: (state, action: PayloadAction<AnalyticsData>) => {
      state.data = action.payload;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload;
    },
  },
});

export const { setAnalyticsData, setLoading, setDateRange } = analyticsSlice.actions;
export default analyticsSlice.reducer;
