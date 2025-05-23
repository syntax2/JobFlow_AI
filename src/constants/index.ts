// Using a placeholder value as __app_id is not a real global variable.
// In a real Firebase project, this might come from environment variables or a build process.
export const APP_ID = 'career-compass-ai-app';

// Placeholder for initial auth token. Undefined will trigger anonymous sign-in.
export const INITIAL_AUTH_TOKEN: string | undefined = undefined;

export const JOB_STATUSES = [
  "Not Applied",
  "Applied",
  "Interview Scheduled",
  "Offer Received",
  "Rejected",
  "Follow-up Sent",
  "Wishlist",
] as const;

export const JOB_PLATFORMS = [
  "LinkedIn",
  "Naukri",
  "Upwork",
  "Direct",
  "Indeed",
  "Company Website",
  "Referral",
  "Other",
] as const;

export const EMAIL_TYPES = [
  "Initial Application",
  "Thank You Note",
  "Application Status Inquiry",
  "Offer Follow-up",
  "Networking",
  "Other",
] as const;
