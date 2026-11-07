import { scrapeFbEvent, scrapeFbEventFromFbid } from '../index';
import { validateAndFormatUrl, fbidToUrl, isShareUrl } from '../utils/url';
import { scrapeEvent } from '../scraper';
import { resolveRedirectUrl } from '../utils/network';

jest.mock('../utils/url');
jest.mock('../scraper');
jest.mock('../utils/network');

const anFbid = '1234567890';
const anEventUrl =
  'https://www.facebook.com/events/1234567890?foo=bar&blah=blah';
const aFormattedEventUrl =
  'https://www.facebook.com/events/1234567890?_fb_noscript=1';
const aShareUrl = 'https://www.facebook.com/share/18f2uMn71o/';
const someEventData = {
  title: 'Example Event'
};

describe('scrapeFbEvent', () => {
  beforeEach(() => {
    (validateAndFormatUrl as jest.Mock).mockReset();
    (scrapeEvent as jest.Mock).mockReset();
    (isShareUrl as jest.Mock).mockReset();
    (resolveRedirectUrl as jest.Mock).mockReset();
  });

  it('should validate/format the URL and return event data', async () => {
    (isShareUrl as jest.Mock).mockReturnValue(false);
    (validateAndFormatUrl as jest.Mock).mockReturnValue(aFormattedEventUrl);
    (scrapeEvent as jest.Mock).mockResolvedValue(someEventData);

    const eventData = await scrapeFbEvent(anEventUrl);

    expect(eventData).toEqual(someEventData);
    expect(isShareUrl).toHaveBeenCalledWith(anEventUrl);
    expect(resolveRedirectUrl).not.toHaveBeenCalled();
    expect(validateAndFormatUrl).toHaveBeenCalledWith(anEventUrl);
    expect(scrapeEvent).toHaveBeenCalledWith(aFormattedEventUrl, {});
  });

  it('should resolve share URL before validating', async () => {
    (isShareUrl as jest.Mock).mockReturnValue(true);
    (resolveRedirectUrl as jest.Mock).mockResolvedValue(anEventUrl);
    (validateAndFormatUrl as jest.Mock).mockReturnValue(aFormattedEventUrl);
    (scrapeEvent as jest.Mock).mockResolvedValue(someEventData);

    const eventData = await scrapeFbEvent(aShareUrl);

    expect(eventData).toEqual(someEventData);
    expect(isShareUrl).toHaveBeenCalledWith(aShareUrl);
    expect(resolveRedirectUrl).toHaveBeenCalledWith(aShareUrl, {});
    expect(validateAndFormatUrl).toHaveBeenCalledWith(anEventUrl);
    expect(scrapeEvent).toHaveBeenCalledWith(aFormattedEventUrl, {});
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
    expect(scrapeEvent).toHaveBeenCalledWith(aFormattedEventUrl, {});
  });
});
