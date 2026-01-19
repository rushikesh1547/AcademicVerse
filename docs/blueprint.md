# **App Name**: AcademicVerse

## Core Features:

- User Authentication: Secure user authentication and role management (student, teacher, admin) using Firebase Authentication. Role verification is done against database.
- Student Profile: Centralized student profile view pulling data from Firestore, including attendance, grades, assignments, and downloadable grade cards.
- Smart Attendance Tracking: Automated attendance capture every 15 minutes, storing timestamped intervals and presence status in Firestore. Eligibility is calculated from stored interval data in the database.
- Anti-Cheating Quiz System: Conduct monitored quizzes with student answers, tab-switch count, and auto-submission flags stored in Firestore. Evaluation relies on attempt data in the database, rather than frontend logic.
- Assignment Management: Manage assignments with questions, submission uploads, timestamps, and evaluation statuses, all stored in Firestore. Acceptance is determined via database timestamp comparison.
- Teacher-Controlled Resource Sharing: Enable teachers to upload and share academic resources stored with uploader ID, subject mapping, and file references in Firestore. Student access is enforced by Firestore database rules.
- AI Proctoring: The system leverages AI to analyze student behavior during quizzes, flagging suspicious activities like excessive tab switching or accessing unauthorized resources. The AI tool decides when a student's behavior merits flagging.

## Style Guidelines:

- Primary color: Deep purple (#673AB7) to convey intellect and sophistication.
- Background color: Light gray (#F5F5F5) for a clean, academic feel.
- Accent color: Lavender (#D8C2FF) to complement the purple.
- Headline font: 'Playfair', serif, for titles, giving an elegant, fashionable, high-end feel. Body font: 'PT Sans', sans-serif, is paired with Playfair for body text to make the body copy readable.
- Code font: 'Source Code Pro' for displaying code snippets, which are likely to occur because some student work may involve code.
- Use academic-themed icons like books, graduation caps, and graphs.
- Subtle animations to indicate data loading and updates.