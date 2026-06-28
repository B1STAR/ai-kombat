'use client';

/**
 * Telegram SDK provider.
 * Expose aussi startParam (start_param) pour le referral.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface TelegramContextValue {
  initData: string;
  startParam: string;  // ref_XXXXXXX ou '' si absent
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
  startParam: '',
  user: null,
  isReady: false,
  isTelegram: false,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState('');
  const [startParam, setStartParam] = useState('');
  const [user, setUser] = useState<TelegramContextValue['user']>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const initialize = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const rawInitData = tg.initData || '';
        setInitData(rawInitData);
        setIsTelegram(true);

        // start_param est disponible immediatement apres tg.ready()
        const sp = tg.initDataUnsafe?.start_param || '';
        setStartParam(sp);

        if (tg.initDataUnsafe?.user) {
          setUser({
            id: tg.initDataUnsafe.user.id,
            firstName: tg.initDataUnsafe.user.first_name,
            username: tg.initDataUnsafe.user.username,
          });
        }

        setIsReady(true);
      } else {
        console.warn('⚠️ Not running inside Telegram. Dev mode active.');
        setIsTelegram(false);
        setIsReady(true);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
      initialize();
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ initData, startParam, user, isReady, isTelegram }}>
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
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
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
          selectionChanged: () => void;
        };
        readTextFromClipboard: (callback: (text: string) => void) => void;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{ id?: string; type?: string; text?: string }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showScanQrPopup: (params: { text?: string }, callback?: (text: string) => boolean) => void;
        closeScanQrPopup: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        version: string;
        platform: string;
      };
    };
  }
}
