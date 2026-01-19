
export const attendanceSummary = [
  { subject: "Data Structures", total: 30, attended: 28 },
  { subject: "Algorithms", total: 30, attended: 25 },
  { subject: "Database Systems", total: 28, attended: 28 },
  { subject: "Operating Systems", total: 25, attended: 20 },
  { subject: "Web Development", total: 32, attended: 30 },
];

export const attendanceChartData = [
  { month: "Jan", attendance: 85 },
  { month: "Feb", attendance: 88 },
  { month: "Mar", attendance: 92 },
  { month: "Apr", attendance: 90 },
  { month: "May", attendance: 95 },
  { month: "Jun", attendance: 91 },
];

export const quizzes = [
    {
        id: "quiz-1",
        title: "Data Structures - Midterm",
        subject: "Data Structures",
        questions: 25,
        duration: 45,
        status: "Upcoming"
    },
    {
        id: "quiz-2",
        title: "Algorithms - Complexity Analysis",
        subject: "Algorithms",
        questions: 15,
        duration: 30,
        status: "Completed",
        score: "13/15"
    },
    {
        id: "quiz-3",
        title: "Database Systems - SQL Basics",
        subject: "Database Systems",
        questions: 20,
        duration: 35,
        status: "Upcoming"
    },
    {
        id: "quiz-4",
        title: "Operating Systems - Process Management",
        subject: "Operating Systems",
        questions: 30,
        duration: 60,
        status: "Graded",
        score: "25/30"
    },
];

export const assignments = [
    {
        id: "assign-1",
        title: "Implement a Linked List",
        subject: "Data Structures",
        dueDate: "2024-07-30",
        status: "Submitted",
        grade: "A"
    },
    {
        id: "assign-2",
        title: "Big O Notation Problems",
        subject: "Algorithms",
        dueDate: "2024-08-05",
        status: "Pending"
    },
    {
        id: "assign-3",
        title: "Normalization Project",
        subject: "Database Systems",
        dueDate: "2024-08-10",
        status: "Submitted",
        grade: "B+"
    },
    {
        id: "assign-4",
        title: "Scheduling Algorithms Simulation",
        subject: "Operating Systems",
        dueDate: "2024-08-15",
        status: "Overdue"
    },
    {
        id: "assign-5",
        title: "Build a REST API",
        subject: "Web Development",
        dueDate: "2024-08-20",
        status: "Pending"
    }
];

export const quizQuestions = [
    {
        question: "What is the time complexity of a binary search algorithm?",
        options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
        correctAnswer: "O(log n)"
    },
    {
        question: "Which data structure uses LIFO (Last-In, First-Out)?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correctAnswer: "Stack"
    },
    {
        question: "In SQL, which command is used to add new rows to a table?",
        options: ["ADD", "INSERT INTO", "UPDATE", "CREATE"],
        correctAnswer: "INSERT INTO"
    },
    {
        question: "What does 'CPU' stand for?",
        options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Control Process Unit"],
        correctAnswer: "Central Processing Unit"
    }
];

export const notifications = [
  {
    title: "Assignment Graded",
    description: "Your 'Normalization Project' assignment has been graded. View your feedback now.",
    time: "2 hours ago",
    read: false,
  },
  {
    title: "New Quiz Available",
    description: "A new quiz 'Data Structures - Midterm' is scheduled for tomorrow.",
    time: "1 day ago",
    read: false,
  },
  {
    title: "Resource Shared",
    description: "A new resource 'Lecture 5 Notes' has been shared for Operating Systems.",
    time: "3 days ago",
    read: true,
  }
];
