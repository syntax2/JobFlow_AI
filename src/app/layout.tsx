import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean, modern sans-serif
import './globals.css';
import { FirebaseProvider } from '@/lib/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { ResumeProvider } from '@/lib/context/ResumeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CareerCompass AI',
  description: 'Your intelligent job application assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <FirebaseProvider>
          <ResumeProvider>
            {children}
            <Toaster />
          </ResumeProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
