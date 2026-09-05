import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'mDISCOVER Admin',
  description: 'Back-office mDISCOVER',
};

/** Prevent iOS autofocus zoom; keep pinch zoom for accessibility. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
