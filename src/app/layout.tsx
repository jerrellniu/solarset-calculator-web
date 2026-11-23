import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { PAGE, SITE } from '@/content/copy';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: PAGE.title,
  description: PAGE.description,
  alternates: { canonical: '/' },
  openGraph: { title: PAGE.title, description: PAGE.description, url: '/', siteName: 'Solar Set', locale: 'en_AU', type: 'website' },
  // Gate C: noindex until Jerrell approves the build. Remove this line at go-live.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
