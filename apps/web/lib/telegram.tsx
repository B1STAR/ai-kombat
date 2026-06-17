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
        // Navigation
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        // Main & Back buttons
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
        // Haptic
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        // Clipboard
        readTextFromClipboard: (callback: (text: string) => void) => void;
        // Theme & display
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        // Popups
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{ id?: string; type?: string; text?: string }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        // Invoice
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        // QR
        showScanQrPopup: (params: { text?: string }, callback?: (text: string) => boolean) => void;
        closeScanQrPopup: () => void;
        // Events
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        version: string;
        platform: string;
      };
    };
  }
}
