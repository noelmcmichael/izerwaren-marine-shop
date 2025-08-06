export const locales = ['en', 'es', 'fr', 'de'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];

export const getLocaleFromPath = (pathname: string): Locale => {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  
  return defaultLocale;
};

export const removeLocaleFromPath = (pathname: string): string => {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  
  if (locales.includes(firstSegment as Locale)) {
    return '/' + segments.slice(2).join('/');
  }
  
  return pathname;
};