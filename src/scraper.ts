import { fetchEvent } from './utils/network';
import * as htmlParser from './htmlParser';
import { EventData } from './types';

export const scrapeEvent = async (urlFromUser: string): Promise<EventData> => {
  const dataString = await fetchEvent(urlFromUser);

  // NOTE: If we want to pick up mutli-date events (technically this is just multiple events linked together), we can look at the comet_neighboring_siblings key

  const { name, photo, isOnline, url, startTimestamp, formattedDate } =
    htmlParser.getBasicData(dataString);

  // fs.writeFileSync(
  //   `examples/${name.split(' ').join('-').toLowerCase()}.html`,
  //   dataString
  // );

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
