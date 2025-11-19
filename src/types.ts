import { AxiosRequestConfig } from 'axios';

export interface EventData {
  id: string;
  name: string;
  description: string;
  /** Event location, set to null if the event is online */
  location: EventLocation | null;
  hosts: EventHost[];
  /** Start time in unix */
  startTimestamp: number;
  /** End time in unix, if set */
  endTimestamp: number | null;
  /** Event date in a human-readable format (contains both start and end time) */
  formattedDate: string;
  /** Event timezone */
  timezone: string;
  photo: EventPhoto | null;
  /** A list of photos if the event has multiple cover photos */
  photos: EventPhoto[];
  video: EventVideo | null;
  url: string;
  isOnline: boolean;
  isCanceled: boolean;
  categories: EventCategory[];
  /** Only set if isOnline = true */
  onlineDetails: OnlineEventDetails | null;
  ticketUrl: string | null;
  usersResponded: number;
  /**
   * The parentEvent and siblingEvents fields are set to for multi-day events. Each sibling event will be a different date for the parent event.
   */
  parentEvent: ParentEvent | null;
  siblingEvents: SiblingEvent[];
}

export interface ParentEvent {
  id: string;
}

export interface SiblingEvent {
  id: string;
  startTimestamp: number;
  endTimestamp: number | null;
  parentEvent: ParentEvent;
}

export interface OnlineEventDetails {
  /** Only set if type = 'THIRD_PARTY' */
  url: string | null;
  type: 'MESSENGER_ROOM' | 'THIRD_PARTY' | 'FB_LIVE' | 'OTHER';
}

export interface EventPhoto {
  url: string;
  id: string;
  imageUri: string | undefined;
}

export interface EventVideo {
  url: string;
  id: string;
  thumbnailUri: string;
}

export interface EventHost {
  id: string;
  name: string;
  url: string;
  type: 'User' | 'Page';
  photo: {
    imageUri: string;
  };
}

export interface EventLocation {
  name: string;
  description: string;
  url: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  countryCode: string | null;
  id: string;
  type: 'TEXT' | 'PLACE' | 'CITY';
  address: string;
  city: {
    name: string;
    id: string;
  } | null;
}

export interface EventCategory {
  label: string;
  url: string;
}

export type ScrapeOptions = Pick<
  AxiosRequestConfig,
  'proxy' | 'httpAgent' | 'httpsAgent'
>;

export interface ShortEventData {
  id: string;
  name: string;
  url: string;
  date: string;
  isCanceled: boolean;
  isPast: boolean;
}
