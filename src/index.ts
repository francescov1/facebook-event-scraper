import {
  fbidToUrl,
  isShareUrl,
  validateAndFormatEventGroupUrl,
  validateAndFormatEventPageUrl,
  validateAndFormatEventProfileUrl,
  validateAndFormatUrl
} from './utils/url';
import {
  EventData,
  FacebookCookies,
  ScrapeOptions,
  ShortEventData
} from './types';
import * as eventListParser from './utils/eventListParser';
import { scrapeEvent } from './scraper';
import { fetchEvent, resolveRedirectUrl } from './utils/network';
import { EventType } from './enums';

export { EventData, FacebookCookies, ScrapeOptions, ShortEventData, EventType };

export const scrapeFbEvent = async (
  url: string,
  options: ScrapeOptions = {}
): Promise<EventData> => {
  const resolvedUrl = isShareUrl(url)
    ? await resolveRedirectUrl(url, options)
    : url;
  const formattedUrl = validateAndFormatUrl(resolvedUrl);
  return await scrapeEvent(formattedUrl, options);
};

export const scrapeFbEventFromFbid = async (
  fbid: string,
  options: ScrapeOptions = {}
): Promise<EventData> => {
  const formattedUrl = fbidToUrl(fbid);
  return await scrapeEvent(formattedUrl, options);
};

export const scrapeFbEventListFromPage = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const resolvedUrl = isShareUrl(url)
    ? await resolveRedirectUrl(url, options)
    : url;
  const formattedUrl = validateAndFormatEventPageUrl(resolvedUrl, type);
  const dataString = await fetchEvent(formattedUrl, options);

  return eventListParser.getEventListFromPageOrProfile(dataString);
};

export const scrapeFbEventListFromProfile = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const resolvedUrl = isShareUrl(url)
    ? await resolveRedirectUrl(url, options)
    : url;
  const formattedUrl = validateAndFormatEventProfileUrl(resolvedUrl, type);
  const dataString = await fetchEvent(formattedUrl, options);

  return eventListParser.getEventListFromPageOrProfile(dataString);
};

export const scrapeFbEventListFromGroup = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const resolvedUrl = isShareUrl(url)
    ? await resolveRedirectUrl(url, options)
    : url;
  const formattedUrl = validateAndFormatEventGroupUrl(resolvedUrl);
  const dataString = await fetchEvent(formattedUrl, options);

  return eventListParser.getEventListFromGroup(dataString, type);
};

export const scrapeFbEventList = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const resolvedUrl = isShareUrl(url)
    ? await resolveRedirectUrl(url, options)
    : url;

  if (resolvedUrl.includes('/groups/')) {
    return scrapeFbEventListFromGroup(resolvedUrl, type, options);
  }
  if (resolvedUrl.includes('/profile.php')) {
    return scrapeFbEventListFromProfile(resolvedUrl, type, options);
  }
  return scrapeFbEventListFromPage(resolvedUrl, type, options);
};
