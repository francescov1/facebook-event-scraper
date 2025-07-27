import { EventType } from '../enums';

export const fbidToUrl = (fbid: string) => {
  if (!fbid.match(/^[0-9]{8,}$/)) {
    throw new Error('Invalid FB ID');
  }

  return `https://www.facebook.com/events/${fbid}?_fb_noscript=1`;
};

// Covers events with the following format:
// https://www.facebook.com/events/666594420519340/
// https://www.facebook.com/events/shark-tank-pub/80s-90s-00s-night/2416437368638666/
// https://www.facebook.com/events/1137956700212933/1137956706879599/ (recurring events)
export const validateAndFormatUrl = (url: string) => {
  const fbid = url.match(
    /facebook\.com\/events\/(?:.+\/.+\/)?([0-9]{8,})/
  )?.[1];

  if (!fbid) {
    throw new Error('Invalid Facebook event URL');
  }

  return `https://www.facebook.com/events/${fbid}?_fb_noscript=1`;
};

// Covers pages with the following format:
// https://www.facebook.com/lacalle8prague/past_hosted_events
// https://www.facebook.com/lacalle8prague/upcoming_hosted_events
// https://www.facebook.com/lacalle8prague/events
export const validateAndFormatEventPageUrl = (
  url: string,
  type?: EventType
) => {
  const regex =
    /facebook\.com\/[a-zA-Z0-9\\.]+(?:\/(past_hosted_events|upcoming_hosted_events|events))?$/;
  const result = regex.test(url);

  if (!result) {
    throw new Error('Invalid Facebook page event URL');
  }

  const types = /(past_hosted_events|upcoming_hosted_events|events)$/;
  if (!types.test(url)) {
    if (type === EventType.Past) {
      url += '/past_hosted_events';
    } else if (type === EventType.Upcoming) {
      url += '/upcoming_hosted_events';
    } else {
      url += '/events';
    }
  } else if (type === EventType.Past) {
    url = url.replace(types, 'past_hosted_events');
  } else if (type === EventType.Upcoming) {
    url = url.replace(types, 'upcoming_hosted_events');
  }

  return `${url}?_fb_noscript=1`;
};

// Covers pages with the following format:
// https://www.facebook.com/profile.php?id=61553164865125&sk=events
// https://www.facebook.com/profile.php?id=61564982700539
// https://www.facebook.com/profile.php?id=61564982700539&sk=past_hosted_events
// https://www.facebook.com/profile.php?id=61564982700539&sk=upcoming_hosted_events
export const validateAndFormatEventProfileUrl = (
  url: string,
  type?: EventType
) => {
  const regex =
    /facebook\.com\/profile\.php\?id=\d+(&sk=(events|past_hosted_events|upcoming_hosted_events))?$/;
  const result = regex.test(url);

  if (!result) {
    throw new Error('Invalid Facebook profile event URL');
  }

  const types = /(past_hosted_events|upcoming_hosted_events|events)$/;
  if (!types.test(url)) {
    if (type === EventType.Past) {
      url += '&sk=past_hosted_events';
    } else if (type === EventType.Upcoming) {
      url += '&sk=upcoming_hosted_events';
    } else {
      url += '&sk=events';
    }
  } else if (type === EventType.Past) {
    url = url.replace(types, 'past_hosted_events');
  } else if (type === EventType.Upcoming) {
    url = url.replace(types, 'upcoming_hosted_events');
  }

  return url;
};

// Covers pages with the following format:
// https://www.facebook.com/groups/409785992417637/events
// https://www.facebook.com/groups/409785992417637
// https://www.facebook.com/groups/zoukcr
export const validateAndFormatEventGroupUrl = (url: string) => {
  const regex = /facebook\.com\/groups\/[a-zA-Z0-9]+(?:\/events$)?/;
  const result = regex.test(url);

  if (!result) {
    throw new Error('Invalid Facebook group event URL');
  }

  if (!url.match('/events')) {
    url += '/events';
  }

  return `${url}?_fb_noscript=1`;
};
