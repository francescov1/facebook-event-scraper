import fs from 'fs';
import cheerio from 'cheerio';
import * as chrono from 'chrono-node';
import axios from 'axios';

const TIME_FORMAT = '[0-9]{1,2}:[0-9]{2} (?:AM|PM)';
const TZ_FORMAT = '[A-Z]{1,5}$';

/**
 * Turn human readable event date string into start and end Date objects
 * @param {String} text Human-readable date string to parse
 * @returns {Object} {startDate: Date?, endDate: Date?}
 */
function parseEventDate(text: string) {
  const recurringWithoutTimeID =
    /^[0-9]+ (dates|Dates|Every|Weekly|Monthly|Yearly)/.test(text);

  // TODO: get the event_time_id of the first available instance and scrape that
  if (recurringWithoutTimeID) {
    throw new Error(
      'The link supplied is for a recurring event.  Please provide the event URL for a specific event time.'
    );
  }

  // NOTE: '–' is NOT a hyphen
  // Example Date: Tomorrow at 3:00 PM – 5:00 PM PST
  const singleDateStartEnd = new RegExp(
    `(.*?) at (${TIME_FORMAT}) – (${TIME_FORMAT}) (${TZ_FORMAT})`
  ).exec(text);

  // Example Date: Dec 19 at 3:00 PM – Dec 21 at 10:00 AM EST
  const multiDayEvent = new RegExp(
    `(.*?) at (${TIME_FORMAT}) – (.*?) at (${TIME_FORMAT}) (${TZ_FORMAT})`
  ).exec(text);

  // Passing these into chrono.parseDate ensures future dates are preferred to
  // past dates.  Otherwise it defaults to the nearest day, even if that day
  // is in the past.
  const now = new Date();
  const dateOptions = { forwardDate: true };
  if (singleDateStartEnd) {
    // First element of the match is the whole match, subsequent
    // elements are match groups (what we want)
    const [date, startTime, endTime, tz] = singleDateStartEnd.slice(1);
    const startDate = chrono.parseDate(
      `${date} at ${startTime} ${tz}`,
      now,
      dateOptions
    );
    const endDate = chrono.parseDate(
      `${date} at ${endTime} ${tz}`,
      now,
      dateOptions
    );

    return { startDate, endDate };
  }
  if (multiDayEvent) {
    const [startDateString, startTime, endDateString, endTime, tz] =
      multiDayEvent.slice(1);
    const startDate = chrono.parseDate(
      `${startDateString} at ${startTime} ${tz}`,
      now,
      dateOptions
    );
    const endDate = chrono.parseDate(
      `${endDateString} at ${endTime} ${tz}`,
      now,
      dateOptions
    );
    return { startDate, endDate };
  }
  return { startDate: null, endDate: null };
}

interface ParsedHtml {
  title: string;
  photo: string | null;
  location: string | null;
  address: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

function parseEventHtml(html: string) {
  const $ = cheerio.load(html);
  const results: ParsedHtml = {
    title: $('title').text(),
    startDate: null,
    endDate: null,
    photo: null,
    location: null,
    address: null
  };

  const timeInfo = $('#event_time_info');

  const image = $('.scaledImageFitWidth');
  if (image) {
    results.photo = image.attr('src') ?? null;
  }

  const eventInfo = $('ul.uiList li');
  let locationInfo = null;
  if (eventInfo.length >= 2) {
    // eslint-disable-next-line prefer-destructuring
    locationInfo = eventInfo[1];
  }

  if (locationInfo) {
    results.location = $('._5xhk', locationInfo).text();
    results.address = $('._5xhp', locationInfo).text();
  }

  if (timeInfo) {
    const mainTimeInfo = $('div[content]', timeInfo).text();
    const { startDate, endDate } = parseEventDate(mainTimeInfo);
    results.startDate = startDate;
    results.endDate = endDate;
  }
  return results;
}

function parseEventJson(dataStr: string) {
  const event = JSON.parse(dataStr);
  if (event['@type'] !== 'Event') {
    console.warn(`FB event URL type not "Event"`, event);
    throw new Error('This URL does not correspond to a Facebook event.');
  }

  if (event.description) {
    event.description = event.description.replace(
      /@\[[0-9]*:[0-9]*:(.*?)\]/g,
      '$1'
    );
  }

  if (event.location?.['@type']) {
    // have not found any address type examples that are not "Place". Should handle different types
    if (event.location['@type'] !== 'Place') {
      console.warn(`FB event location type not "Place"`, event.location);
    }

    if (event.location.address) {
      // have not found any address type examples that are not "PostalAddress". Should handle different types
      if (event.location.address['@type'] !== 'PostalAddress') {
        console.warn(
          `FB event location address type not "PostalAddress"`,
          event.location
        );
      }

      event.address = event.location.address;
      event.location = event.location.name;
    } else {
      event.location = event.location.name;
    }
  }

  event.title = event.name;
  delete event.name;
  if (event.image) {
    event.photo = event.image;
    delete event.image;
  }

  return event;
}

export const scrapeFbEvent = async (eventURL: string) => {
  const response = await axios.get(eventURL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
    }
  });

  const { data } = response;
  const eventDataMatch = data.match(
    /<script type="application\/ld\+json">(.*?)<\/script>/
  );

  const event = eventDataMatch
    ? parseEventJson(eventDataMatch[1])
    : parseEventHtml(data);
  return event;
};

/*

scrape("https://www.facebook.com/events/666594420519340/?event_time_id=666594590519323&_fb_noscript=1")
  .then(result => {
    console.log(result);
  })
  .catch(e => {
    console.error(e);
  });
*/

// Provide URL or FBID
export const verifyAndFormatFbUrl = (url: string, fbid: string) => {
  // covers events with the following format:
  // https://www.facebook.com/events/666594420519340/
  // https://www.facebook.com/events/shark-tank-pub/80s-90s-00s-night/2416437368638666/

  // and grabs event_time_id query parameter if present (recurring events)

  let eventTimeIdMatch;
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

    eventTimeIdMatch = url.match(/event_time_id=([0-9]*)/);
  }

  url = `https://www.facebook.com/events/${fbid}?_fb_noscript=1`;

  if (eventTimeIdMatch) {
    url += `&event_time_id=${eventTimeIdMatch[1]}`;
  }

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
  ticketUrl: string;
  usersGoing: number;
  usersInterested: number;
  // TODO price
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
  displayDuration: string; // TODO: convert to number? or see if we can get a duration from somewhere
}

interface EventHost {
  id: string;
  name: string;
  url: string;
  type: 'User' | 'Page'; // TODO: any other options?
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
  type: 'TEXT' | 'PLACE' | 'CITY'; // TODO: any other options?
  address: string;
  city: {
    name: string;
    id: string;
  } | null;
}

async function fetchEventHtml(url: string) {
  // TODO: Test old URLs in this file, and other events, once we've adapted the code for the new html format
  // TODO: Need these headers to get all the event data, some combo of the sec fetch headers
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
  let startPosition = 0;
  let data: Record<string, any> = { dates: {} };
  let durationFound = false,
    dateSentenceFound = false,
    ticketUrlFound = false;

  // Could move this loop to findJsonInString and use a callback to check if the json is the one we want, or if we want to iterate to the next one
  while (true) {
    const { endIndex, jsonData } = findJsonInString(
      html,
      'event',
      startPosition
    );

    // We've reached the end of the string and havent found the json we want
    if (endIndex === -1) {
      break;
    }

    if (jsonData.day_time_sentence) {
      console.log('Found day_time_sentence object: ', jsonData);
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
      dateSentenceFound = true;
    }

    // We get this when the event has an end date
    if (jsonData.display_duration) {
      console.log('Found display_duration object: ', jsonData);
      data = {
        ...data,
        dates: {
          ...data.dates,
          displayDuration: jsonData.display_duration
        }
      };
      durationFound = true;
    }

    if (jsonData.event_buy_ticket_url) {
      console.log('Found event_buy_ticket_url object: ', jsonData);
      data = {
        ...data,
        ticketUrl: jsonData.event_buy_ticket_url
      };
      ticketUrlFound = true;
    }

    if (durationFound && dateSentenceFound && ticketUrlFound) {
      return data as any; // TODO: Fix typing
    }

    startPosition = endIndex;
  }

  // If we dont find any duration, it means the event has no end date. But we double check this later as well
  if (dateSentenceFound) {
    return data as any; // TODO: Fix typing
  }

  throw new Error('No day time sentence found');
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

// TODO: explore different kinds of location (eg just address)
// Only called for non-online events
function getEventLocation(html: string): EventLocation {
  let startPosition = 0;

  // Could move this loop to findJsonInString and use a callback to check if the json is the one we want, or if we want to iterate to the next one
  while (true) {
    const { endIndex, jsonData } = findJsonInString(
      html,
      'event_place',
      startPosition
    );

    // We've reached the end of the string and havent found the json we want
    if (endIndex === -1) {
      break;
    }

    console.log('JSON DATA FROM event_place: ', jsonData);

    if ('location' in jsonData) {
      console.log('Found location object: ', jsonData);
      return {
        name: jsonData.name,
        description: jsonData.best_description?.text ?? null,
        url: jsonData.url ?? null,
        coordinates: jsonData.location
          ? {
              latitude: jsonData.location.latitude,
              longitude: jsonData.location.longitude
            }
          : null,
        countryCode:
          jsonData.location?.reverse_geocode?.country_alpha_two ?? null,
        id: jsonData.id, // TODO: this may not always be here,
        type: jsonData.place_type,
        address: jsonData.address?.street ?? null, // address doesnt exist for custom location events, and is set to an empty string for cities
        city: jsonData.city
          ? {
              name: jsonData.city.contextual_name,
              id: jsonData.city.id // TODO: See if we always have this
            }
          : null
      };
    }

    startPosition = endIndex;
  }

  throw new Error('No event location found');
}

function getEventHosts(html: string): EventHost[] {
  let startPosition = 0;

  // Could move this loop to findJsonInString and use a callback to check if the json is the one we want, or if we want to iterate to the next one
  while (true) {
    const { endIndex, jsonData } = findJsonInString(
      html,
      'event_hosts_that_can_view_guestlist',
      startPosition
    );

    // We've reached the end of the string and havent found the json we want
    if (endIndex === -1) {
      break;
    }

    // We check for profile_picture field since there are other event_hosts_that_can_view_guestlist keys which have more limited host data (doesnt include profile_picture).
    if (jsonData?.[0]?.profile_picture) {
      console.log('Found profile_picture object: ', jsonData);
      return jsonData.map((host: Record<string, any>) => {
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

    startPosition = endIndex;
  }

  // This happens if the event is hosted by an external provider, eg https://www.facebook.com/events/252144510602906.
  // TODO: See if we can get any other data about the host (eg URL). Look at event_host_context_row_info field
  return [];
}

function getEndTimestamp(html: string, expectedStartTimestamp: number) {
  let startPosition = 0;

  // Could move this loop to findJsonInString and use a callback to check if the json is the one we want, or if we want to iterate to the next one
  while (true) {
    const { endIndex, jsonData } = findJsonInString(
      html,
      'data',
      startPosition
    );

    // We've reached the end of the string and havent found the json we want
    if (endIndex === -1) {
      break;
    }

    if (
      jsonData.end_timestamp &&
      jsonData.start_timestamp === expectedStartTimestamp
    ) {
      console.log('Found end_timestamp object: ', jsonData);
      return jsonData.end_timestamp;
    }

    startPosition = endIndex;
  }

  throw new Error('No end_timestamp found');
}

// TODO: make this into its own library
function findJsonInString(dataString: string, key: string, startPosition = 0) {
  const prefix = `"${key}":`;
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

  // TODO: handle errors
  const jsonData = JSON.parse(jsonDataString);

  return { startIndex, endIndex: idx, jsonData };
}

// TODO: clean URL, remove old code
(async () => {
  // const urlFromUser = "https://www.facebook.com/events/calgary-stampede/all-elite-wrestling-aew-house-rules-calgary-alberta-debut/941510027277450/"
  // const urlFromUser = "https://www.facebook.com/events/858256975309867" // online event, end date, incredible-edibles...
  // const urlFromUser = "https://www.facebook.com/events/1137956700212933/1137956706879599" // Event with end date and multi dates, easter-dearfoot...

  // const urlFromUser = "https://www.facebook.com/events/1376686273147180/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"

  // const urlFromUser = 'https://www.facebook.com/events/719931529922611';
  // const urlFromUser = "https://www.facebook.com/events/602005831971873/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/3373409222914593/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/252144510602906/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_online_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  // const urlFromUser = "https://www.facebook.com/events/526262926343074/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D"
  const urlFromUser =
    'https://www.facebook.com/events/894355898271559/894355941604888/?active_tab=about';
  const dataString = await fetchEventHtml(urlFromUser);

  // const filename = "examples/easter-dearfoot-end-date-multidays.html"

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

  const location = isOnline ? null : getEventLocation(dataString);

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
    hosts,
    ticketUrl,
    usersGoing,
    usersInterested
  };
  console.log(eventData);
})();
