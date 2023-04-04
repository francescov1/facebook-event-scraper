import { findJsonInString } from './utils/json';
import {
  EventData,
  EventLocation,
  EventHost,
  OnlineEventDetails
} from './types';

export const getDescription = (html: string): string => {
  const { jsonData } = findJsonInString(html, 'event_description');
  return jsonData.text;
};

export const getBasicData = (
  html: string
): Pick<
  EventData,
  'name' | 'photo' | 'formattedDate' | 'startTimestamp' | 'isOnline' | 'url'
> => {
  const { jsonData } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.day_time_sentence
  );

  if (!jsonData) {
    throw new Error('No date sentence found');
  }

  return {
    name: jsonData.name,
    photo: jsonData.cover_media_renderer
      ? {
          url: jsonData.cover_media_renderer.cover_photo.photo.url,
          id: jsonData.cover_media_renderer.cover_photo.photo.id
        }
      : null,
    formattedDate: jsonData.day_time_sentence,
    startTimestamp: jsonData.start_timestamp,
    isOnline: jsonData.is_online,
    url: jsonData.url
  };
};

export const getTicketUrl = (html: string): string => {
  const { jsonData } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.event_buy_ticket_url
  );

  // If the event doesnt have a ticket URL, jsonData will be null
  return jsonData?.event_buy_ticket_url ?? null;
};

export const getUserStats = (html: string) => {
  const { jsonData: usersGoingJsonData } = findJsonInString(
    html,
    'event_connected_users_going'
  );
  const { jsonData: usersInterestedJsonData } = findJsonInString(
    html,
    'event_connected_users_interested'
  );

  return {
    usersGoing: usersGoingJsonData.count,
    usersInterested: usersInterestedJsonData.count
  };
};

// Only called for non-online events
export const getLocation = (html: string): EventLocation => {
  const { jsonData } = findJsonInString(
    html,
    'event_place',
    (candidate) => 'location' in candidate
  );

  if (!['TEXT', 'PLACE', 'CITY'].includes(jsonData.place_type)) {
    // TODO: Remove before releasing, this is just to see if theres any other values we dont know about
    throw new Error(`Unknown place_type ${jsonData}`);
  }

  if (jsonData === null) {
    throw new Error('No event location found');
  }

  return {
    id: jsonData.id,
    name: jsonData.name,
    description: jsonData.best_description?.text ?? null,
    url: jsonData.url ?? null,
    coordinates: jsonData.location
      ? {
          latitude: jsonData.location.latitude,
          longitude: jsonData.location.longitude
        }
      : null,
    countryCode: jsonData.location?.reverse_geocode?.country_alpha_two ?? null,
    type: jsonData.place_type,
    address: jsonData.address?.street ?? null, // address doesnt exist for custom location events, and is set to an empty string for cities
    city: jsonData.city
      ? {
          name: jsonData.city.contextual_name,
          id: jsonData.city.id
        }
      : null
  };
};

export const getHosts = (html: string): EventHost[] => {
  const { jsonData } = findJsonInString(
    html,
    'event_hosts_that_can_view_guestlist',
    // We check for profile_picture field since there are other event_hosts_that_can_view_guestlist keys which have more limited host data (doesnt include profile_picture).
    (candidate) => candidate?.[0]?.profile_picture
  );

  if (jsonData === null) {
    // This happens if the event is hosted by an external provider, eg https://www.facebook.com/events/252144510602906.
    // TODO: See if we can get any other data about the host (eg URL). Look at event_host_context_row_info field
    return [];
  }

  return jsonData.map((host: Record<string, any>) => {
    // TODO: Remove before releasing, only here to see if we missed any options
    if (host.__typename !== 'User' && host.__typename !== 'Page') {
      throw new Error(`Unknown host type: ${host.__typename}`);
    }

    return {
      id: host.id,
      name: host.name,
      url: host.url,
      type: host.__typename,
      photo: {
        url: host.profile_picture.uri
      }
    };
  });
};

export const getOnlineDetails = (html: string): OnlineEventDetails => {
  const { jsonData } = findJsonInString(
    html,
    'online_event_setup',
    (candidate) => 'third_party_url' in candidate && 'type' in candidate
  );

  if (jsonData === null) {
    throw new Error('No online event details found');
  }

  return { url: jsonData.third_party_url, type: jsonData.type };
};

export const getEndTimestampAndTimezone = (
  html: string,
  expectedStartTimestamp: number
) => {
  const { jsonData } = findJsonInString(
    html,
    'data',
    (candidate) =>
      'end_timestamp' in candidate &&
      'tz_display_name' in candidate &&
      candidate.start_timestamp === expectedStartTimestamp
  );

  // If event doesnt have an end date, end_timestamp will be set to 0
  return {
    endTimestamp: jsonData.end_timestamp || null,
    timezone: jsonData.tz_display_name
  };
};
