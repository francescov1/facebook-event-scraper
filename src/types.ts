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
  url: string;
  isOnline: boolean;
  /** Only set if isOnline = true */
  onlineDetails: OnlineEventDetails | null;
  ticketUrl: string | null;
  usersGoing: number;
  usersInterested: number;
}

export interface OnlineEventDetails {
  /** Only set if type = 'THIRD_PARTY' */
  url: string | null;
  type: 'MESSENGER_ROOM' | 'THIRD_PARTY' | 'FB_LIVE' | 'OTHER';
}

export interface EventPhoto {
  url: string;
  id: string;
}

export interface EventHost {
  id: string;
  name: string;
  url: string;
  type: 'User' | 'Page';
  photo: {
    url: string;
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
