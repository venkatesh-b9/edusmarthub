import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RealtimeState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: string | null;
  indicators: Record<string, boolean>;
}

const initialState: RealtimeState = {
  isConnected: false,
  connectionStatus: 'disconnected',
  lastUpdate: null,
  indicators: {},
};

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    setConnectionStatus: (
      state,
      action: PayloadAction<'connecting' | 'connected' | 'disconnected' | 'error'>
    ) => {
      state.connectionStatus = action.payload;
      state.isConnected = action.payload === 'connected';
    },
    updateStatus: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.indicators[action.payload.key] = action.payload.value;
      state.lastUpdate = new Date().toISOString();
    },
    clearIndicators: (state) => {
      state.indicators = {};
    },
  },
});

export const { setConnectionStatus, updateStatus, clearIndicators } = realtimeSlice.actions;
export default realtimeSlice.reducer;
