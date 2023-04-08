import { scrapeFbEvent, scrapeFbEventFromFbid } from '../index';
import { validateAndFormatUrl, fbidToUrl } from '../utils/url';
import { scrapeEvent } from '../scraper';

jest.mock('../utils/url');
jest.mock('../scraper');

const anFbid = '1234567890';
const anEventUrl =
  'https://www.facebook.com/events/1234567890?foo=bar&blah=blah';
const aFormattedEventUrl =
  'https://www.facebook.com/events/1234567890?_fb_noscript=1';
const someEventData = {
  title: 'Example Event'
};

describe('scrapeFbEvent', () => {
  beforeEach(() => {
    (validateAndFormatUrl as jest.Mock).mockReset();
    (scrapeEvent as jest.Mock).mockReset();
  });

  it('should validate/format the URL and return event data', async () => {
    (validateAndFormatUrl as jest.Mock).mockReturnValue(aFormattedEventUrl);
    (scrapeEvent as jest.Mock).mockResolvedValue(someEventData);

    const eventData = await scrapeFbEvent(anEventUrl);

    expect(eventData).toEqual(someEventData);
    // Ensure URL was formatted & the formatted URL was used to scrape the event
    expect(validateAndFormatUrl).toHaveBeenCalledWith(anEventUrl);
    expect(scrapeEvent).toHaveBeenCalledWith(aFormattedEventUrl);
  });
});

describe('scrapeFbEventFromFbid', () => {
  beforeEach(() => {
    (fbidToUrl as jest.Mock).mockReset();
    (scrapeEvent as jest.Mock).mockReset();
  });

  it('should convert the FBID to a URL and return event data', async () => {
    (fbidToUrl as jest.Mock).mockReturnValue(aFormattedEventUrl);
    (scrapeEvent as jest.Mock).mockResolvedValue(someEventData);

    const eventData = await scrapeFbEventFromFbid(anFbid);

    expect(eventData).toEqual(someEventData);
    expect(fbidToUrl).toHaveBeenCalledWith(anFbid);
    expect(scrapeEvent).toHaveBeenCalledWith(aFormattedEventUrl);
  });
});
