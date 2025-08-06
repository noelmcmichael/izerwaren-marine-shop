'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale, defaultLocale } from '@/i18n/config';

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

interface LanguageSwitcherProps {
  currentLocale?: Locale;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale = defaultLocale,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale from pathname
    const segments = pathname.split('/');
    const isLocaleInPath = locales.includes(segments[1] as Locale);
    const pathWithoutLocale = isLocaleInPath 
      ? '/' + segments.slice(2).join('/')
      : pathname;

    // Navigate to new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          {languageFlags[currentLocale]} {languageNames[currentLocale]}
        </span>
        <span className="sm:hidden">
          {languageFlags[currentLocale]}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  className={`
                    block w-full text-left px-4 py-2 text-sm transition-colors
                    ${locale === currentLocale
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{languageFlags[locale]}</span>
                    <span>{languageNames[locale]}</span>
                    {locale === currentLocale && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface CompactLanguageSwitcherProps {
  currentLocale?: Locale;
  className?: string;
}

export const CompactLanguageSwitcher: React.FC<CompactLanguageSwitcherProps> = ({
  currentLocale = defaultLocale,
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value as Locale;
    
    // Remove current locale from pathname
    const segments = pathname.split('/');
    const isLocaleInPath = locales.includes(segments[1] as Locale);
    const pathWithoutLocale = isLocaleInPath 
      ? '/' + segments.slice(2).join('/')
      : pathname;

    // Navigate to new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentLocale}
        onChange={handleLocaleChange}
        className="appearance-none bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md pr-8"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {languageFlags[locale]} {languageNames[locale]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};