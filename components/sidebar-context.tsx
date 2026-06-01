'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/lib/notification-settings';

interface SidebarContextValue {
  isOpen: boolean;
  notificationSettings: NotificationSettings;
  open: () => void;
  close: () => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  open: () => {},
  close: () => {},
  setNotificationSettings: () => {},
});

export function SidebarProvider({
  children,
  initialNotificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
}: {
  children: React.ReactNode;
  initialNotificationSettings?: NotificationSettings;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <SidebarContext.Provider value={{ isOpen, notificationSettings, open, close, setNotificationSettings }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
