import type { JOB_PLATFORMS, JOB_STATUSES, EMAIL_TYPES } from "@/constants";

export type JobStatus = typeof JOB_STATUSES[number];
export type JobPlatform = typeof JOB_PLATFORMS[number];
export type EmailType = typeof EMAIL_TYPES[number];

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  platform: JobPlatform;
  link?: string;
  status: JobStatus;
  dateApplied?: string; // ISO string date
  lastUpdated: string; // ISO string date
  notes?: string;
  jobDescription?: string; // Added for easier access
  userId: string; // To associate with the user
}

export interface Resume {
  id: string;
  name: string;
  content: string;
  lastUpdated: string; // ISO string date
  userId: string; // To associate with the user
  summary?: string; // AI generated summary
}

export interface EmailLog {
  id: string;
  jobId: string; // Links to JobApplication
  type: EmailType;
  dateSent: string; // ISO string date
  recipient?: string;
  subject?: string;
  body?: string;
  notes?: string;
  userId: string;
}

export interface InterviewNote {
  id: string;
  jobId: string; // Links to JobApplication
  date: string; // ISO string date
  interviewers?: string[]; // Array of interviewer names
  questionsAsked?: string; // Can be markdown or plain text
  yourResponses?: string; // Can be markdown or plain text
  selfAssessment?: string;
  notes?: string;
  userId: string;
}

export interface CompanyResearch {
  id: string;
  companyName: string;
  industry?: string;
  mission?: string;
  values?: string;
  recentNewsHighlights?: string; // Could be array of strings or markdown
  cultureNotes?: string;
  keyContacts?: { name: string; role: string; contactInfo?: string }[];
  linkedJobIds?: string[]; // Array of JobApplication IDs
  userId: string;
}

export interface UpworkData {
  id: string; // Typically 'singleton' per user or specific client
  proposalSnippets?: { title: string; content: string }[];
  clientNotes?: { clientName: string; notes: string }[];
  connectsBalance?: number;
  userId: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // Can include placeholders like {{companyName}}, {{jobTitle}}
  userId: string;
}

// For AI responses
export interface KeywordExtractionResult {
  skills: string[];
  technologies: string[];
  responsibilities: string[];
}
