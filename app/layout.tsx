import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, DM_Serif_Display, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const TITLE = 'Кварта — свежая обжарка кофе в Минске';
const DESCRIPTION = 'Обжариваем по четвергам, доставляем по Минску в пятницу. Подписка на две пачки в месяц — 54 BYN. Оставьте номер, менеджер перезвонит.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, locale: 'ru_BY', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og.png'] },
};

const sans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--f-sans', display: 'swap' });
const serif = DM_Serif_Display({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--f-serif', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600'], variable: '--f-mono', display: 'swap' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#top">К содержимому</a>
        {children}
      </body>
    </html>
  );
}
