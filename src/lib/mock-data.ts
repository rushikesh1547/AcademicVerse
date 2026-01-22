
export const subjects: { id: string; name: string }[] = [];

export const resources: {
  id: string;
  subject: string;
  title: string;
  fileUrl: string;
  uploader: string;
}[] = [];

export const results: {
  id: string;
  semester: number;
  examType: string;
  sgpa: number;
  subjectGrades: string;
}[] = [];

export const attendanceSummary: {
  subject: string;
  total: number;
  attended: number;
}[] = [];

export const attendanceChartData: { month: string; attendance: number }[] = [];

export const quizzes: {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: number;
  status: "Upcoming" | "Completed" | "Graded";
  score?: string;
}[] = [];

export const assignments: {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "Submitted" | "Pending" | "Overdue";
  grade?: string;
}[] = [];

export const quizQuestions: {
  question: string;
  options: string[];
  correctAnswer: string;
}[] = [];

export const notifications: {
  title: string;
  description: string;
  time: string;
  read: boolean;
}[] = [];
