import { findJsonInString } from './json';
import {
  EventData,
  EventLocation,
  EventHost,
  OnlineEventDetails
} from '../types';

export const getDescription = (html: string): string => {
  const { jsonData } = findJsonInString(html, 'event_description');
  if (!jsonData) {
    throw new Error(
      'No event description found, please verify that your event URL is correct'
    );
  }

  return jsonData.text;
};

export const getBasicData = (
  html: string
): Pick<
  EventData,
  | 'id'
  | 'name'
  | 'photo'
  | 'video'
  | 'formattedDate'
  | 'startTimestamp'
  | 'isOnline'
  | 'url'
  | 'siblingEvents'
  | 'parentEvent'
> => {
  const { jsonData } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.day_time_sentence
  );

  if (!jsonData) {
    throw new Error(
      'No event data found, please verify that your URL is correct and the event is accessible without authentication'
    );
  }

  return {
    id: jsonData.id,
    name: jsonData.name,
    photo: jsonData.cover_media_renderer?.cover_photo
      ? {
          url: jsonData.cover_media_renderer.cover_photo.photo.url,
          id: jsonData.cover_media_renderer.cover_photo.photo.id,
          imageUri:
            jsonData.cover_media_renderer.cover_photo.photo.image?.uri ??
            jsonData.cover_media_renderer.cover_photo.photo.full_image?.uri
        }
      : null,
    video: jsonData.cover_media_renderer?.cover_video
      ? {
          url: jsonData.cover_media_renderer.cover_video.url,
          id: jsonData.cover_media_renderer.cover_video.id,
          thumbnailUri: jsonData.cover_media_renderer.cover_video.image?.uri
        }
      : null,
    formattedDate: jsonData.day_time_sentence,
    startTimestamp: jsonData.start_timestamp,
    isOnline: jsonData.is_online,
    url: jsonData.url,
    // Sibling events, for multi-date events
    siblingEvents:
      jsonData.comet_neighboring_siblings?.map(
        (sibling: Record<string, any>) => ({
          id: sibling.id,
          startTimestamp: sibling.start_timestamp,
          endTimestamp: sibling.end_timestamp,
          parentEvent: { id: sibling.parent_event.id }
        })
      ) ?? [],
    // If parent exists, and its not the same as the current event, set the parentEvent field
    parentEvent:
      jsonData.parent_if_exists_or_self &&
      jsonData.parent_if_exists_or_self.id !== jsonData.id
        ? { id: jsonData.parent_if_exists_or_self.id }
        : null
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
  const { jsonData: usersRespondedJsonData } = findJsonInString(
    html,
    'event_connected_users_public_responded'
  );

  // usersRespondedJsonData can be undefined if the host decides to hide the guest list
  return {
    usersResponded: usersRespondedJsonData?.count
  };
};

// Only called for non-online events
export const getLocation = (html: string): EventLocation | null => {
  const { jsonData, startIndex } = findJsonInString(
    html,
    'event_place',
    (candidate) => 'location' in candidate
  );

  // If there is no start index, it means the event_place field wasn't found in the HTML
  if (startIndex === -1) {
    throw new Error(
      'No location information found, please verify that your event URL is correct'
    );
  }

  // If jsonData is null, it means we did find the event_place field but it was set to null. This happens for events with no locations set
  if (jsonData === null) {
    return null;
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

  return jsonData.map((host: Record<string, any>) => ({
    id: host.id,
    name: host.name,
    url: host.url,
    type: host.__typename,
    photo: {
      imageUri: host.profile_picture.uri
    }
  }));
};

export const getOnlineDetails = (html: string): OnlineEventDetails => {
  const { jsonData } = findJsonInString(
    html,
    'online_event_setup',
    (candidate) => 'third_party_url' in candidate && 'type' in candidate
  );

  if (jsonData === null) {
    throw new Error(
      'No online event details found, please verify that your event URL is correct'
    );
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

  if (jsonData === null) {
    throw new Error(
      'No end date & timezone details found, please verify that your event URL is correct'
    );
  }

  // If event doesnt have an end date, end_timestamp will be set to 0
  return {
    endTimestamp: jsonData.end_timestamp || null,
    timezone: jsonData.tz_display_name
  };
};
