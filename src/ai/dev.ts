import { config } from 'dotenv';
config();

import '@/ai/flows/generate-cover-letter.ts';
import '@/ai/flows/extract-keywords.ts';
import '@/ai/flows/summarize-resume.ts';