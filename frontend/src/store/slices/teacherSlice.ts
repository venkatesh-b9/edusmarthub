import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  schoolId: string;
  photo?: string;
  performance?: number;
  classIds?: string[];
}

interface TeacherState {
  teachers: Teacher[];
  selectedTeacher: Teacher | null;
}

const initialState: TeacherState = {
  teachers: [],
  selectedTeacher: null,
};

const teacherSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setTeachers: (state, action: PayloadAction<Teacher[]>) => {
      state.teachers = action.payload;
    },
    addTeacher: (state, action: PayloadAction<Teacher>) => {
      state.teachers.push(action.payload);
    },
    updateTeacher: (state, action: PayloadAction<{ id: string; updates: Partial<Teacher> }>) => {
      const index = state.teachers.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.teachers[index] = { ...state.teachers[index], ...action.payload.updates };
      }
    },
    setSelectedTeacher: (state, action: PayloadAction<Teacher | null>) => {
      state.selectedTeacher = action.payload;
    },
  },
});

export const { setTeachers, addTeacher, updateTeacher, setSelectedTeacher } = teacherSlice.actions;
export default teacherSlice.reducer;
