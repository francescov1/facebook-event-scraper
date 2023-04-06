import { validateAndFormatUrl, fbidToUrl } from './utils/url';
import { EventData } from './types';
import { scrapeEvent } from './scraper';

export const scrapeFbEvent = async (url: string): Promise<EventData> => {
  const formattedUrl = validateAndFormatUrl(url);
  return await scrapeEvent(formattedUrl);
};

export const scrapeFbEventFromFbid = async (
  fbid: string
): Promise<EventData> => {
  const formattedUrl = fbidToUrl(fbid);
  return await scrapeEvent(formattedUrl);
};
