import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  schoolId: string;
  photo?: string;
  gpa?: number;
  attendance?: number;
  classId?: string;
}

interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
}

const initialState: StudentState = {
  students: [],
  selectedStudent: null,
};

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
    },
    addStudent: (state, action: PayloadAction<Student>) => {
      state.students.push(action.payload);
    },
    updateStudent: (state, action: PayloadAction<{ id: string; updates: Partial<Student> }>) => {
      const index = state.students.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...action.payload.updates };
      }
    },
    setSelectedStudent: (state, action: PayloadAction<Student | null>) => {
      state.selectedStudent = action.payload;
    },
  },
});

export const { setStudents, addStudent, updateStudent, setSelectedStudent } = studentSlice.actions;
export default studentSlice.reducer;
