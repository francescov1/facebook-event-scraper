import { validateAndFormatUrl, fbidToUrl } from './utils/url';
import { EventData, ScrapeOptions } from './types';
import { scrapeEvent } from './scraper';

export const scrapeFbEvent = async (
  url: string,
  options: ScrapeOptions = {}
): Promise<EventData> => {
  const formattedUrl = validateAndFormatUrl(url);
  return await scrapeEvent(formattedUrl, options);
};

export const scrapeFbEventFromFbid = async (
  fbid: string,
  options: ScrapeOptions = {}
): Promise<EventData> => {
  const formattedUrl = fbidToUrl(fbid);
  return await scrapeEvent(formattedUrl, options);
};
