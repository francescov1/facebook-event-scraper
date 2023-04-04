import fs from 'fs';
import axios from 'axios';

// Provide URL or FBID
export const verifyAndFormatFbUrl = (url: string, fbid: string | null) => {
  // covers events with the following format:
  // https://www.facebook.com/events/666594420519340/
  // https://www.facebook.com/events/shark-tank-pub/80s-90s-00s-night/2416437368638666/
  // https://www.facebook.com/events/1137956700212933/1137956706879599/ (recurring events)

  // and grabs event_time_id query parameter if present (recurring events)

  if (!fbid) {
    const fbidMatch = url.match(
      /facebook\.com\/events\/(?:.+\/.+\/)?([0-9]{8,})/
    );
    if (!fbidMatch) {
      throw new Error(
        'Event not found. Ensure to provide a proper Facebook URL and that your event is public and active.'
      );
    }

    [, fbid] = fbidMatch;
  }

  url = `https://www.facebook.com/events/${fbid}?_fb_noscript=1`; // TODO: Not sure if fb_noscript is needed anymore

  return url;
};

interface EventData {
  name: string;
  description: string;
  location: EventLocation | null;
  hosts: EventHost[];
  dates: EventDates;
  photo: EventPhoto | null;
  url: string;
  isOnline: boolean;
  /** Only set if isOnline = true */
  onlineDetails: {
    /** Only set if type = 'THIRD_PARTY' */
    url: string | null;
    type: 'MESSENGER_ROOM' | 'THIRD_PARTY' | 'FB_LIVE' | 'OTHER';
  } | null;
  ticketUrl: string;
  usersGoing: number;
  usersInterested: number;
}

interface EventPhoto {
  url: string;
  id: string;
}
interface EventDates {
  startTimestamp: number;
  endTimestamp: number | null;
  dateSentence: string;
  startDateFormatted: string;
  displayDuration: string;
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

async function fetchEventHtml(url: string) {
  console.log(`Fetching event ${url}...`);
  // NOTE: Need these headers to get all the event data, some combo of the sec fetch headers
  const response = await axios.get(url, {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.6',
      'cache-control': 'max-age=0',
      // 'cookie': 'dpr=2; datr=nWcnZNPF50KqRHeukULjKijO; wd=764x882',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'sec-gpc': '1',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
    }
  });

  return response.data;
}

function getEventDescription(html: string): string {
  const { jsonData } = findJsonInString(html, 'event_description');
  return jsonData.text;
}

function getBasicEventData(
  html: string
): Pick<
  EventData,
  'name' | 'dates' | 'photo' | 'isOnline' | 'url' | 'ticketUrl'
> {
  let data: Record<string, any> = { dates: {} };

  const { jsonData } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.day_time_sentence
  );

  if (!jsonData) {
    throw new Error('No day time sentence found');
  }

  data = {
    ...data,
    name: jsonData.name,
    photo: jsonData.cover_media_renderer
      ? {
          url: jsonData.cover_media_renderer.cover_photo.photo.url,
          id: jsonData.cover_media_renderer.cover_photo.photo.id
        }
      : null,
    dates: {
      ...data.dates,
      dateSentence: jsonData.day_time_sentence,
      startTimestamp: jsonData.start_timestamp,
      startDateFormatted: jsonData.start_time_formatted
    },
    isOnline: jsonData.is_online,
    url: jsonData.url
  };

  // TODO: use separate funcs for these

  // TODO: only need to check this if end date is present, can move it to the end date func
  const { jsonData: displayDurationJson } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.display_duration
  );

  if (displayDurationJson) {
    data = {
      ...data,
      dates: {
        ...data.dates,
        displayDuration: displayDurationJson.display_duration
      }
    };
  }

  const { jsonData: ticketUrlJson } = findJsonInString(
    html,
    'event',
    (candidate) => candidate.event_buy_ticket_url
  );

  if (ticketUrlJson) {
    data = {
      ...data,
      ticketUrl: jsonData.event_buy_ticket_url
    };
  }

  return data as any;
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

function getOnlineDetails(html: string) {
  const { jsonData } = findJsonInString(
    html,
    'online_event_setup',
    (candidate) => 'third_party_url' in candidate && 'type' in candidate
  );

  if (jsonData === null) {
    throw new Error('No online event details found');
  }

  return jsonData;
}

function getEndTimestamp(html: string, expectedStartTimestamp: number): number {
  const { jsonData } = findJsonInString(
    html,
    'data',
    (candidate) =>
      candidate.end_timestamp &&
      candidate.start_timestamp === expectedStartTimestamp
  );

  // TODO: extract time zone too using jsonData.tz_display_name

  // TODO: Think about if we want to move error throwing to the method itself
  if (jsonData === null) {
    throw new Error('No end_timestamp found');
  }

  return jsonData.end_timestamp;
}

// TODO: make this into its own library. When doing this, also add a new method for getting keys with direct values (essentially use " as the start and end character)
function findJsonInString(
  dataString: string,
  key: string,
  isDesiredValue?: (value: Record<string, any>) => boolean
) {
  const prefix = `"${key}":`;

  let startPosition = 0;

  // This loop is used for iterating over found json objects, and checking if they are the one we want using the isDesiredValue callback
  while (true) {
    let idx = dataString.indexOf(prefix, startPosition);
    if (idx === -1) {
      return { startIndex: -1, endIndex: -1, jsonData: null };
    }

    idx += prefix.length;
    const startIndex = idx;

    const startCharacter = dataString[startIndex];
    if (startCharacter !== '{' && startCharacter !== '[') {
      throw new Error(`Invalid start character: ${startCharacter}`);
    }

    const endCharacter = startCharacter === '{' ? '}' : ']';

    let nestedLevel = 0;
    // This loop iterates over each character in the json object until we get to the end of the object
    while (true) {
      idx++; // idx is set to the first "{" or "[", so we want to increment before checking below

      // TODO: Ensure startCharacter and endCharacter are not part of a value

      if (dataString[idx] === endCharacter) {
        if (nestedLevel === 0) {
          break;
        }
        nestedLevel--;
      } else if (dataString[idx] === startCharacter) {
        nestedLevel++;
      }
    }

    const jsonDataString = dataString.slice(startIndex, idx + 1);

    // TODO: See how useful error message is from this. If not good enough, add handling & rethrowing
    const jsonData = JSON.parse(jsonDataString);

    if (!isDesiredValue || isDesiredValue(jsonData)) {
      return { startIndex, endIndex: idx, jsonData };
    }

    startPosition = idx;
  }
}

// TODO next: cleanup code, prepare for beta release. Might as well put it out now to find any issues.
// TODO write tests if see fit, or could wait till it gains some traction

// TODO: Rewrite error messages once everything else is done
(async () => {
  // const urlFromUser = 'https://www.facebook.com/events/calgary-stampede/all-elite-wrestling-aew-house-rules-calgary-alberta-debut/941510027277450/';
  // const urlFromUser = "https://www.facebook.com/events/858256975309867" // online event, end date, incredible-edibles...
  const urlFromUser =
    'https://www.facebook.com/events/1137956700212933/1137956706879599'; // Event with end date and multi dates, easter-dearfoot...

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
  // const urlFromUser = "https://www.facebook.com/events/564972362099646/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D"

  const formattedUrl = verifyAndFormatFbUrl(urlFromUser, null);
  const dataString = await fetchEventHtml(formattedUrl);

  // NOTE: If we want to pick up mutli-date events (technically this is just multiple events linked together), we can look at the comet_neighboring_siblings key

  const { name, photo, isOnline, url, dates, ticketUrl } =
    getBasicEventData(dataString);

  fs.writeFileSync(
    `examples/${name.split(' ').join('-').toLowerCase()}.html`,
    dataString
  );

  let endTimestamp = null;
  if (dates.displayDuration) {
    // NOTE: This also provides the timezone of the event if we ever want to use it
    endTimestamp = getEndTimestamp(dataString, dates.startTimestamp);
  }

  let location = null;
  let onlineDetails = null;
  if (isOnline) {
    onlineDetails = getOnlineDetails(dataString);
  } else {
    location = getEventLocation(dataString);
  }

  const description = getEventDescription(dataString);

  const hosts = getEventHosts(dataString);
  const { usersGoing, usersInterested } = getEventUserStats(dataString);
  const eventData: EventData = {
    name,
    description,
    location,
    photo,
    isOnline,
    url,
    dates: {
      ...dates,
      endTimestamp
    },
    onlineDetails,
    hosts,
    ticketUrl,
    usersGoing,
    usersInterested
  };
  console.log(eventData);
})();
