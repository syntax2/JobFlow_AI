
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a clean, modern sans-serif
import './globals.css';
import { FirebaseProvider } from '@/lib/firebase/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import { ResumeProvider } from '@/lib/context/ResumeProvider';
import { ThemeProvider } from '@/context/ThemeProvider'; // Import ThemeProvider

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      {/* 
        suppressHydrationWarning is added to <html> because the 'dark' class might be added/removed
        by ThemeProvider client-side, which can cause a mismatch with the server-rendered HTML.
        This is a common practice when managing themes client-side.
      */}
      <body className="font-sans antialiased">
        <FirebaseProvider>
          <ThemeProvider> {/* Wrap with ThemeProvider */}
            <ResumeProvider>
              {children}
              <Toaster />
            </ResumeProvider>
          </ThemeProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
