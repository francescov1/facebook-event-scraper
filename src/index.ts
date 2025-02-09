import { validateAndFormatUrl, fbidToUrl } from './utils/url';
import { EventData, ScrapeOptions } from './types';
import { scrapeEvent } from './scraper';

export { EventData, ScrapeOptions };

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

// TODO: Remove this

const url =
  'https://www.facebook.com/events/307997768878006/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22search_results%22%2C%22surface%22%3A%22bookmark_search%22%7D]%2C%22ref_notif_type%22%3Anull%7D';

scrapeFbEvent(url).then((event) => {
  console.log(event);
});
