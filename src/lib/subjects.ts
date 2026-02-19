export type Subject = {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
};

// This is a mock list of subjects. In a real application, this would
// likely come from a "subjects" collection in Firestore.
// The teacherId values here should be replaced with actual teacher UIDs
// for the feedback system to work correctly.
export const subjects: Subject[] = [
  { id: 'cs101', name: 'Introduction to Computer Science', teacherId: 'teacher-uid-1', teacherName: 'Dr. Evelyn Boyd' },
  { id: 'phy101', name: 'Physics for Engineers', teacherId: 'teacher-uid-2', teacherName: 'Dr. Albert Einstein' },
  { id: 'math101', name: 'Mathematics 101', teacherId: 'teacher-uid-1', teacherName: 'Dr. Evelyn Boyd' },
  { id: 'chem101', name: 'Introductory Chemistry', teacherId: 'teacher-uid-3', teacherName: 'Dr. Marie Curie' },
  { id: 'eng101', name: 'English Composition', teacherId: 'teacher-uid-4', teacherName: 'Prof. William Shakespeare' },
  { id: 'ds201', name: 'Data Structures and Algorithms', teacherId: 'teacher-uid-1', teacherName: 'Dr. Evelyn Boyd' },
];
