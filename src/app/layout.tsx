import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Classaathi — Your Coaching Institute, Simplified',
  description: 'The all-in-one platform for Indian coaching institutes. Manage students, attendance, fees, and parent communication — all in one place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased bg-background`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
