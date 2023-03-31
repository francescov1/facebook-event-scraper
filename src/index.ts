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
  photo: string | null
  location: string | null
  address: string | null
  startDate: Date | null
  endDate: Date | null
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
    throw new Error(
      'This URL does not correspond to a Facebook event.'
    );
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
