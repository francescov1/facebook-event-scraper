import fs from 'fs';
import { fetchEvent } from './utils/network';
import { validateAndFormatUrl, fbidToUrl } from './utils/url';
import * as htmlParser from './htmlParser';
import { EventData } from './types';

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
    htmlParser.getBasicData(dataString);

  fs.writeFileSync(
    `examples/${name.split(' ').join('-').toLowerCase()}.html`,
    dataString
  );

  const { endTimestamp, timezone } = htmlParser.getEndTimestampAndTimezone(
    dataString,
    startTimestamp
  );

  let location = null;
  let onlineDetails = null;
  if (isOnline) {
    onlineDetails = htmlParser.getOnlineDetails(dataString);
  } else {
    location = htmlParser.getLocation(dataString);
  }

  const description = htmlParser.getDescription(dataString);
  const ticketUrl = htmlParser.getTicketUrl(dataString);

  const hosts = htmlParser.getHosts(dataString);
  const { usersGoing, usersInterested } = htmlParser.getUserStats(dataString);

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
