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
