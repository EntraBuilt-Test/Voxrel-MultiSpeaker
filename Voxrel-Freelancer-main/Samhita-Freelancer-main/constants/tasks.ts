// Mock data for user dashboard task pages
// This will be replaced with real API calls later

export interface AvailableTask {
  id: number;
  title: string;
  description: string;
  price: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
  duration: string;
  postedAt: string;
}

export interface InProgressTask {
  id: number;
  title: string;
  description: string;
  price: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
  duration: string;
  status: "In Progress";
  progress: number;
  startedAt: string;
  lastUpdated: string;
  deadline: string;
}

export interface CompletedTask {
  id: number;
  title: string;
  description: string;
  earnings: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Extreme";
  duration: string;
  status: "Completed";
  rating: number;
  clientRating: number;
  qualityScore: number;
  completedAt: string;
}

// Available tasks for users to claim
export const AVAILABLE_TASKS: AvailableTask[] = [
  {
    id: 1,
    title: "Hindi Podcast Episode Transcription",
    description: "Transcribe a 15-minute Hindi podcast episode about technology trends",
    price: "$45.00",
    language: "Hindi",
    difficulty: "Medium",
    duration: "15 min",
    postedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    title: "Bengali Business Meeting Notes",
    description: "Transcribe a business meeting discussion about Q1 strategy",
    price: "$35.00",
    language: "Bengali",
    difficulty: "Easy",
    duration: "12 min",
    postedAt: "2024-01-15T11:45:00Z"
  },
  {
    id: 3,
    title: "Tamil Interview Transcription",
    description: "Transcribe an interview with a Tamil author about their latest book",
    price: "$65.00",
    language: "Tamil",
    difficulty: "Hard",
    duration: "22 min",
    postedAt: "2024-01-15T14:20:00Z"
  },
  {
    id: 4,
    title: "Telugu Webinar Recording",
    description: "Transcribe a marketing webinar about social media strategies",
    price: "$50.00",
    language: "Telugu",
    difficulty: "Medium",
    duration: "18 min",
    postedAt: "2024-01-15T16:10:00Z"
  },
  {
    id: 5,
    title: "Gujarati Technical Discussion",
    description: "Transcribe a technical discussion about software development",
    price: "$70.00",
    language: "Gujarati",
    difficulty: "Hard",
    duration: "25 min",
    postedAt: "2024-01-16T09:15:00Z"
  },
  {
    id: 6,
    title: "Marathi Customer Call",
    description: "Transcribe a customer support call about product features",
    price: "$30.00",
    language: "Marathi",
    difficulty: "Easy",
    duration: "10 min",
    postedAt: "2024-01-16T11:30:00Z"
  },
  {
    id: 7,
    title: "Kannada News Report",
    description: "Transcribe a Kannada news report about economic developments",
    price: "$55.00",
    language: "Kannada",
    difficulty: "Medium",
    duration: "16 min",
    postedAt: "2024-01-16T13:45:00Z"
  },
  {
    id: 8,
    title: "Malayalam Medical Consultation",
    description: "Transcribe a medical consultation between doctor and patient",
    price: "$80.00",
    language: "Malayalam",
    difficulty: "Hard",
    duration: "28 min",
    postedAt: "2024-01-16T15:20:00Z"
  },
  {
    id: 9,
    title: "Punjabi Training Session",
    description: "Transcribe a corporate training session on leadership skills",
    price: "$40.00",
    language: "Punjabi",
    difficulty: "Easy",
    duration: "14 min",
    postedAt: "2024-01-17T10:00:00Z"
  },
  {
    id: 10,
    title: "Urdu Cultural Interview",
    description: "Transcribe an interview about traditional Urdu arts",
    price: "$90.00",
    language: "Urdu",
    difficulty: "Extreme",
    duration: "30 min",
    postedAt: "2024-01-17T12:30:00Z"
  },
  {
    id: 11,
    title: "Assamese Sales Call",
    description: "Transcribe a sales presentation to potential clients",
    price: "$35.00",
    language: "Assamese",
    difficulty: "Easy",
    duration: "12 min",
    postedAt: "2024-01-17T14:15:00Z"
  },
  {
    id: 12,
    title: "Oriya Academic Lecture",
    description: "Transcribe a university lecture on Oriya history",
    price: "$85.00",
    language: "Oriya",
    difficulty: "Hard",
    duration: "35 min",
    postedAt: "2024-01-17T16:45:00Z"
  }
];

// Tasks currently being worked on by the user
export const IN_PROGRESS_TASKS: InProgressTask[] = [
  {
    id: 101,
    title: "English Marketing Webinar",
    description: "Transcribe a webinar about digital marketing trends for 2024",
    price: "$60.00",
    language: "English",
    difficulty: "Medium",
    duration: "20 min",
    status: "In Progress",
    progress: 65,
    startedAt: "2024-01-14T09:30:00Z",
    lastUpdated: "2024-01-15T14:20:00Z",
    deadline: "2024-01-18T23:59:00Z"
  },
  {
    id: 102,
    title: "Spanish Customer Interview",
    description: "Transcribe customer feedback interview for product improvement",
    price: "$45.00",
    language: "Spanish",
    difficulty: "Easy",
    duration: "15 min",
    status: "In Progress",
    progress: 20,
    startedAt: "2024-01-15T16:00:00Z",
    lastUpdated: "2024-01-15T16:30:00Z",
    deadline: "2024-01-19T23:59:00Z"
  },
  {
    id: 103,
    title: "French Technical Documentation",
    description: "Transcribe technical documentation recording for software manual",
    price: "$75.00",
    language: "French",
    difficulty: "Hard",
    duration: "30 min",
    status: "In Progress",
    progress: 85,
    startedAt: "2024-01-13T11:00:00Z",
    lastUpdated: "2024-01-15T10:15:00Z",
    deadline: "2024-01-16T23:59:00Z"
  }
];

// Tasks completed by the user
export const COMPLETED_TASKS: CompletedTask[] = [
  {
    id: 201,
    title: "English Podcast Episode",
    description: "Transcribed technology podcast discussing AI developments",
    earnings: "$50.00",
    language: "English",
    difficulty: "Medium",
    duration: "18 min",
    status: "Completed",
    rating: 4.8,
    clientRating: 5,
    qualityScore: 96,
    completedAt: "2024-01-12T15:30:00Z"
  },
  {
    id: 202,
    title: "Spanish Business Meeting",
    description: "Transcribed quarterly business review meeting",
    earnings: "$65.00",
    language: "Spanish",
    difficulty: "Hard",
    duration: "25 min",
    status: "Completed",
    rating: 4.9,
    clientRating: 5,
    qualityScore: 98,
    completedAt: "2024-01-10T11:45:00Z"
  },
  {
    id: 203,
    title: "English Customer Call",
    description: "Transcribed customer support interaction",
    earnings: "$30.00",
    language: "English",
    difficulty: "Easy",
    duration: "10 min",
    status: "Completed",
    rating: 4.6,
    clientRating: 4,
    qualityScore: 92,
    completedAt: "2024-01-08T14:20:00Z"
  },
  {
    id: 204,
    title: "French Cultural Interview",
    description: "Transcribed interview with French artist about modern art",
    earnings: "$70.00",
    language: "French",
    difficulty: "Hard",
    duration: "28 min",
    status: "Completed",
    rating: 4.7,
    clientRating: 5,
    qualityScore: 94,
    completedAt: "2024-01-05T16:10:00Z"
  },
  {
    id: 205,
    title: "English Training Session",
    description: "Transcribed corporate training on project management",
    earnings: "$40.00",
    language: "English",
    difficulty: "Easy",
    duration: "15 min",
    status: "Completed",
    rating: 4.5,
    clientRating: 4,
    qualityScore: 90,
    completedAt: "2024-01-03T13:30:00Z"
  },
  {
    id: 206,
    title: "German Technical Discussion",
    description: "Transcribed engineering team discussion about architecture",
    earnings: "$80.00",
    language: "German",
    difficulty: "Extreme",
    duration: "32 min",
    status: "Completed",
    rating: 4.9,
    clientRating: 5,
    qualityScore: 97,
    completedAt: "2024-01-01T10:15:00Z"
  }
];

// Language options for filtering - Indian Languages
export const LANGUAGES = [
  { label: "Assamese", value: "assamese", nativeName: "অসমীয়া", code: "as" },
  { label: "Bengali", value: "bengali", nativeName: "বাংলা", code: "bn" },
  { label: "Bodo", value: "bodo", nativeName: "बड़ो", code: "brx" },
  { label: "Dogri", value: "dogri", nativeName: "डोगरी", code: "doi" },
  { label: "Gujarati", value: "gujarati", nativeName: "ગુજરાતી", code: "gu" },
  { label: "Hindi", value: "hindi", nativeName: "हिन्दी", code: "hi" },
  { label: "Kannada", value: "kannada", nativeName: "ಕನ್ನಡ", code: "kn" },
  { label: "Kashmiri", value: "kashmiri", nativeName: "کٲشُر", code: "ks" },
  { label: "Konkani", value: "konkani", nativeName: "कोंकणी", code: "gom" },
  { label: "Maithili", value: "maithili", nativeName: "मैथिली", code: "mai" },
  { label: "Malayalam", value: "malayalam", nativeName: "മലയാളം", code: "ml" },
  { label: "Manipuri", value: "manipuri", nativeName: "মৈতৈলোন্", code: "mni" },
  { label: "Marathi", value: "marathi", nativeName: "मराठी", code: "mr" },
  { label: "Nepali", value: "nepali", nativeName: "नेपाली", code: "ne" },
  { label: "Oriya", value: "oriya", nativeName: "ଓଡ଼ିଆ", code: "or" },
  { label: "Punjabi", value: "punjabi", nativeName: "ਪੰਜਾਬੀ", code: "pa" },
  { label: "Sanskrit", value: "sanskrit", nativeName: "संस्कृतम्", code: "sa" },
  { label: "Santali", value: "santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", code: "sat" },
  { label: "Sindhi", value: "sindhi", nativeName: "سنڌي", code: "sd" },
  { label: "Tamil", value: "tamil", nativeName: "தமிழ்", code: "ta" },
  { label: "Telugu", value: "telugu", nativeName: "తెలుగు", code: "te" },
  { label: "Urdu", value: "urdu", nativeName: "اردو", code: "ur" }
];

export const DURATION_OPTIONS = [
  { value: "all", label: "All Durations" },
  { value: "short", label: "Short (0-5 min)" },
  { value: "medium", label: "Medium (5-15 min)" },
  { value: "long", label: "Long (15-30 min)" },
  { value: "extended", label: "Extended (30+ min)" },
];

// Language groups for better organization
export const LANGUAGE_GROUPS = {
  "Major Languages": ["hindi", "bengali", "telugu", "marathi", "tamil", "gujarati", "urdu", "kannada", "malayalam", "punjabi"],
  "North Indian": ["hindi", "punjabi", "urdu", "kashmiri", "dogri"],
  "South Indian": ["tamil", "telugu", "kannada", "malayalam"],
  "East Indian": ["bengali", "oriya", "assamese", "maithili"],
  "West Indian": ["gujarati", "marathi", "konkani"],
  "Central Indian": ["hindi", "sanskrit"],
  "Northeast Indian": ["assamese", "manipuri", "bodo"],
  "Other Languages": ["sindhi", "santali", "nepali"]
};

// Task page configurations
export const TASK_PAGE_CONFIG = {
  "/tasks/available": {
    title: "Available Tasks",
    description: "Browse and claim transcription tasks that match your skills"
  },
  "/tasks/draft": {
    title: "My Tasks",
    description: "Continue working on your claimed transcription tasks"
  },
  "/tasks/completed": {
    title: "Completed Tasks",
    description: "View your completed transcription work and earnings"
  }
};

export const DEFAULT_TASK_CONFIG = {
  title: "Tasks",
  description: "Manage your transcription work"
};
