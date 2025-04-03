import {
  fbidToUrl,
  validateAndFormatEventGroupUrl,
  validateAndFormatEventPageUrl,
  validateAndFormatUrl
} from './utils/url';
import { EventData, ScrapeOptions, ShortEventData } from './types';
import * as eventListParser from './utils/eventListParser';
import { scrapeEvent } from './scraper';
import { fetchEvent } from './utils/network';
import { EventType } from './enums';

export { EventData, ScrapeOptions, ShortEventData, EventType };

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

export const scrapeFbEventListFromPage = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const formattedUrl = validateAndFormatEventPageUrl(url, type);
  const dataString = await fetchEvent(formattedUrl, options.proxy);

  return eventListParser.getEventListFromPage(dataString);
};

export const scrapeFbEventListFromGroup = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  const formattedUrl = validateAndFormatEventGroupUrl(url);
  const dataString = await fetchEvent(formattedUrl, options.proxy);

  return eventListParser.getEventListFromGroup(dataString, type);
};

export const scrapeFbEventList = async (
  url: string,
  type?: EventType,
  options: ScrapeOptions = {}
): Promise<ShortEventData[]> => {
  if (url.includes('/groups/')) {
    return scrapeFbEventListFromGroup(url, type, options);
  } 
    return scrapeFbEventListFromPage(url, type, options);
  
};
