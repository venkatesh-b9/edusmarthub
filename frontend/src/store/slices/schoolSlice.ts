import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface School {
  id: string;
  name: string;
  region: string;
  performance: number;
  studentCount: number;
  teacherCount: number;
  status: 'active' | 'inactive';
  location?: { lat: number; lng: number };
}

interface SchoolState {
  schools: School[];
  selectedSchools: string[];
  filters: {
    region?: string;
    performanceTier?: string;
    size?: string;
  };
}

const initialState: SchoolState = {
  schools: [],
  selectedSchools: [],
  filters: {},
};

const schoolSlice = createSlice({
  name: 'schools',
  initialState,
  reducers: {
    setSchools: (state, action: PayloadAction<School[]>) => {
      state.schools = action.payload;
    },
    addSchool: (state, action: PayloadAction<School>) => {
      state.schools.push(action.payload);
    },
    updateSchool: (state, action: PayloadAction<{ id: string; updates: Partial<School> }>) => {
      const index = state.schools.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.schools[index] = { ...state.schools[index], ...action.payload.updates };
      }
    },
    toggleSchoolSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedSchools.indexOf(action.payload);
      if (index === -1) {
        state.selectedSchools.push(action.payload);
      } else {
        state.selectedSchools.splice(index, 1);
      }
    },
    setFilters: (state, action: PayloadAction<SchoolState['filters']>) => {
      state.filters = action.payload;
    },
    clearSelection: (state) => {
      state.selectedSchools = [];
    },
  },
});

export const {
  setSchools,
  addSchool,
  updateSchool,
  toggleSchoolSelection,
  setFilters,
  clearSelection,
} = schoolSlice.actions;
export default schoolSlice.reducer;
