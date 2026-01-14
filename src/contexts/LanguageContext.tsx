import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "bg";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("bg");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  // Start with isLoading=false to avoid blocking initial render
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // Only set loading when actually changing languages (not initial load)
        if (Object.keys(translations).length > 0) {
          setIsLoading(true);
        }
        
        // Use import.meta.glob with eager: true to pre-bundle all translations
        // This avoids MIME type issues in production by bundling JSON at build time
        const translationsModules = import.meta.glob('../translations/*.json', { eager: true }) as Record<string, { default: Record<string, string> }>;
        const translationKey = `../translations/${language}.json`;
        
        if (translationsModules[translationKey]) {
          setTranslations(translationsModules[translationKey].default || {});
        } else {
          // Fallback: try dynamic import (should not be needed if glob works)
          console.warn(`Translation file not found in glob: ${translationKey}`);
          const translationModule = await import(`../translations/${language}.json`) as { default: Record<string, string> };
          setTranslations(translationModule?.default || {});
        }
      } catch (error) {
        console.error("Error loading translations:", error);
        // Set empty translations as fallback to prevent infinite loading
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    // Load translations asynchronously without blocking
    // Use requestIdleCallback if available, otherwise setTimeout
    const deferLoad = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 });
      } else {
        setTimeout(callback, 0);
      }
    };

    deferLoad(loadTranslations);
  }, [language]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    // Dispatch language change event for favicon updates
    window.dispatchEvent(new CustomEvent('languageChange', { 
      detail: { language: newLanguage } 
    }));
  };

  const t = (key: string): string => {
    if (isLoading) {
      return ""; // Return empty string while loading
    }
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}; 