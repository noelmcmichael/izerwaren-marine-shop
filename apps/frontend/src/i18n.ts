import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './i18n/config';

export default getRequestConfig(async () => {
  // Get locale from headers or URL
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Extract locale from pathname
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  
  const locale: Locale = locales.includes(maybeLocale as Locale) 
    ? (maybeLocale as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./i18n/messages/${locale}.json`)).default,
    timeZone: 'UTC',
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'USD'
        },
        percentage: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      }
    }
  };
});