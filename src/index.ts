import fs from 'fs';

import { findJsonInString } from './utils/json';
import { fetchEvent } from './utils/network';
import { validateAndFormatUrl, fbidToUrl } from './utils/url';

interface EventData {
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

interface OnlineEventDetails {
  /** Only set if type = 'THIRD_PARTY' */
  url: string | null;
  type: 'MESSENGER_ROOM' | 'THIRD_PARTY' | 'FB_LIVE' | 'OTHER';
}

interface EventPhoto {
  url: string;
  id: string;
}

interface EventHost {
  id: string;
  name: string;
  url: string;
  type: 'User' | 'Page';
  photo: {
    url: string;
  };
}

interface EventLocation {
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

function getEventDescription(html: string): string {
  const { jsonData } = findJsonInString(html, 'event_description');
  return jsonData.text;
}

function getBasicEventData(
  html: string
): Pick<
  EventData,
  'name' | 'photo' | 'formattedDate' | 'startTimestamp' | 'isOnline' | 'url'
> {
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
}

function getTicketUrl(html: string): string {
  const { jsonData } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.event_buy_ticket_url
  );

  // If the event doesnt have a ticket URL, jsonData will be null
  return jsonData?.event_buy_ticket_url ?? null;
}

function getEventUserStats(html: string) {
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
}

// Only called for non-online events
function getEventLocation(html: string): EventLocation {
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
}

function getEventHosts(html: string): EventHost[] {
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
}

function getOnlineDetails(html: string): OnlineEventDetails {
  const { jsonData } = findJsonInString(
    html,
    'online_event_setup',
    (candidate) => 'third_party_url' in candidate && 'type' in candidate
  );

  if (jsonData === null) {
    throw new Error('No online event details found');
  }

  return { url: jsonData.third_party_url, type: jsonData.type };
}

function getEndTimestampAndTimezone(
  html: string,
  expectedStartTimestamp: number
) {
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
}

export const scrapeEventFromUrl = async (url: string): Promise<EventData> => {
  const formattedUrl = validateAndFormatUrl(url);
  return await scrapeEvent(formattedUrl);
};

export const scrapeEventFromFbid = async (fbid: string): Promise<EventData> => {
  const formattedUrl = fbidToUrl(fbid);
  return await scrapeEvent(formattedUrl);
};

const scrapeEvent = async (urlFromUser: string): Promise<EventData> => {
  const dataString = await fetchEvent(urlFromUser);

  // NOTE: If we want to pick up mutli-date events (technically this is just multiple events linked together), we can look at the comet_neighboring_siblings key

  const { name, photo, isOnline, url, startTimestamp, formattedDate } =
    getBasicEventData(dataString);

  fs.writeFileSync(
    `examples/${name.split(' ').join('-').toLowerCase()}.html`,
    dataString
  );

  const { endTimestamp, timezone } = getEndTimestampAndTimezone(
    dataString,
    startTimestamp
  );

  let location = null;
  let onlineDetails = null;
  if (isOnline) {
    onlineDetails = getOnlineDetails(dataString);
  } else {
    location = getEventLocation(dataString);
  }

  const description = getEventDescription(dataString);
  const ticketUrl = getTicketUrl(dataString);

  const hosts = getEventHosts(dataString);
  const { usersGoing, usersInterested } = getEventUserStats(dataString);

  return {
    name,
    description,
    location,
    photo,
    isOnline,
    url,
    startTimestamp,
    endTimestamp,
    formattedDate,
    timezone,
    onlineDetails,
    hosts,
    ticketUrl,
    usersGoing,
    usersInterested
  };
};

// TODO write tests if see fit, or could wait till it gains some traction
// TODO: Rewrite error messages once everything else is done

(async () => {
  // const urlFromUser = 'https://www.facebook.com/events/calgary-stampede/all-elite-wrestling-aew-house-rules-calgary-alberta-debut/941510027277450/';
  // const urlFromUser = "https://www.facebook.com/events/858256975309867" // online event, end date, incredible-edibles...
  // const urlFromUser = 'https://www.facebook.com/events/1137956700212933/1137956706879599'; // Event with end date and multi dates, easter-dearfoot...

  // const urlFromUser = "https://www.facebook.com/events/1376686273147180/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"

  // const urlFromUser = 'https://www.facebook.com/events/719931529922611';
  // const urlFromUser = "https://www.facebook.com/events/602005831971873/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/3373409222914593/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/252144510602906/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_online_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/526262926343074/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = 'https://www.facebook.com/events/894355898271559/894355941604888/?active_tab=about';

  // online event, third party url
  // const urlFromUser = 'https://www.facebook.com/events/1839868276383775/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D';

  // msnger rooms online event
  const urlFromUser =
    'https://www.facebook.com/events/564972362099646/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
  const eventData = await scrapeEvent(urlFromUser);
  console.log(eventData);
})();
