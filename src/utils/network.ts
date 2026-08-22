import axios from 'axios';
import { FacebookCookies, ScrapeOptions } from '../types';

const formatCookies = (cookies: FacebookCookies | string): string => {
  if (typeof cookies === 'string') {
    return cookies;
  }
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
};

// sec-fetch-site is 'none' when navigating directly to a share link (no referrer),
// and 'same-origin' when following a link from within facebook.com (e.g. the resolved event page).
const buildHeaders = (
  secFetchSite: 'none' | 'same-origin',
  cookies?: FacebookCookies | string
): Record<string, string> => {
  const headers: Record<string, string> = {
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.6',
    'cache-control': 'max-age=0',
    // NOTE: Need these headers to get all the event data, some combo of the sec fetch headers
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': secFetchSite,
    'sec-fetch-user': '?1',
    'sec-gpc': '1',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
  };

  if (cookies) {
    headers.cookie = formatCookies(cookies);
  }

  return headers;
};

export const resolveRedirectUrl = async (
  url: string,
  options?: ScrapeOptions
): Promise<string> => {
  try {
    const { cookies, ...axiosOptions } = options || {};

    const response = await axios.get(url, {
      headers: buildHeaders('none', cookies),
      maxRedirects: 10,
      ...axiosOptions
    });

    const finalUrl: string | undefined =
      response.request?.res?.responseUrl ?? response.config.url;

    if (!finalUrl) {
      throw new Error('Could not resolve Facebook share URL');
    }

    return finalUrl;
  } catch (err: any) {
    const wrappedErr = new Error(
      'Could not resolve Facebook share URL. Make sure the URL is correct and accessible.'
    );
    (wrappedErr as any).cause = err;
    throw wrappedErr;
  }
};

export const fetchEvent = async (url: string, options?: ScrapeOptions) => {
  try {
    const { cookies, ...axiosOptions } = options || {};

    const response = await axios.get(url, {
      headers: buildHeaders('same-origin', cookies),
      ...axiosOptions
    });

    return response.data;
  } catch (err: any) {
    // TODO: if in debug, print error: err.response?.data ?? err
    const wrappedErr = new Error(
      'Error fetching event, make sure your URL is correct and the event is accessible. For private events, provide Facebook cookies via the cookies option.'
    );
    (wrappedErr as any).cause = err;
    throw wrappedErr;
  }
};
