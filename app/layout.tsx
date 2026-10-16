import type { ReactNode } from 'react';
import { DM_Sans, DM_Serif_Display, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--f-sans', display: 'swap' });
const serif = DM_Serif_Display({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--f-serif', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600'], variable: '--f-mono', display: 'swap' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
