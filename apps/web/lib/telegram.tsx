'use client';

/**
 * Telegram SDK provider.
 * Initializes the Telegram WebApp SDK and provides initData for auth.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Script from 'next/script';

interface TelegramContextValue {
  initData: string;
  user: {
    id: number;
    firstName: string;
    username?: string;
  } | null;
  isReady: boolean;
  isTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  initData: '',
  user: null,
  isReady: false,
  isTelegram: false,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<TelegramContextValue['user']>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  
  useEffect(() => {
    // Check if we're inside Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      setInitData(tg.initData || '');
      setIsTelegram(true);
      
      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          firstName: tg.initDataUnsafe.user.first_name,
          username: tg.initDataUnsafe.user.username,
        });
      }
      
      setIsReady(true);
    } else {
      // Dev mode: not inside Telegram
      console.warn('⚠️ Not running inside Telegram. Using dev mode.');
      setIsTelegram(false);
      setIsReady(true);
    }
  }, []);
  
  return (
    <TelegramContext.Provider value={{ initData, user, isReady, isTelegram }}>
      {children}
    </TelegramContext.Provider>
  );
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          start_param?: string;
        };
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
      };
    };
  }
}
