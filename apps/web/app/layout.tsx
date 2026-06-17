import type { Metadata } from 'next';
import './globals.css';
import { TelegramProvider } from '@/lib/telegram';

export const metadata: Metadata = {
  title: 'AI Kombat',
  description: 'Train your AI. Tap to earn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0e15" />
      </head>
      <body>
        <TelegramProvider>
          {children}
        </TelegramProvider>
      </body>
    </html>
  );
}
