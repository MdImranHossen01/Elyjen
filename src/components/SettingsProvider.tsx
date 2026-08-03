'use client';

import React, { createContext, useContext } from 'react';

interface SettingsContextType {
  brandName?: string;
  logoUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  uiTemplates?: {
    theme?: string;
    logoFont?: string;
    bodyFont?: string;
  };
  aiConfig?: {
    openRouterApiKey?: string;
    systemPrompt?: string;
  };
  footerNavigation?: {
    label: string;
    href: string;
  }[];
  testimonials?: {
    name: string;
    role: string;
    content: string;
    image: string;
    rating: number;
  }[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ 
  children, 
  settings 
}: { 
  children: React.ReactNode; 
  settings: SettingsContextType;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined || context === null) {
    // Return empty settings instead of throwing or returning null
    return {} as SettingsContextType;
  }
  return context;
}

