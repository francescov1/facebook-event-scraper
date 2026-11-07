import axios from 'axios';
import { fetchEvent, resolveRedirectUrl } from '../network';
import { ScrapeOptions } from '../../types';

// Mock axios to simulate server responses
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('resolveRedirectUrl', () => {
  afterEach(() => {
    mockedAxios.get.mockReset();
  });

  it('returns the final URL after redirect', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      request: {
        res: {
          responseUrl: 'https://www.facebook.com/events/1234567890/'
        }
      },
      config: { url: 'https://www.facebook.com/share/18f2uMn71o/' }
    });

    const result = await resolveRedirectUrl(
      'https://www.facebook.com/share/18f2uMn71o/'
    );

    expect(result).toEqual('https://www.facebook.com/events/1234567890/');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.facebook.com/share/18f2uMn71o/',
      expect.objectContaining({ maxRedirects: 10 })
    );
  });

  it('falls back to config.url if responseUrl is not available', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      request: {},
      config: { url: 'https://www.facebook.com/events/9876543210/' }
    });

    const result = await resolveRedirectUrl(
      'https://www.facebook.com/share/abc123/'
    );

    expect(result).toEqual('https://www.facebook.com/events/9876543210/');
  });

  it('passes cookies in headers when provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      request: {
        res: {
          responseUrl: 'https://www.facebook.com/events/1234567890/'
        }
      },
      config: {}
    });

    await resolveRedirectUrl('https://www.facebook.com/share/18f2uMn71o/', {
      cookies: { c_user: '123', xs: 'abc' }
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.facebook.com/share/18f2uMn71o/',
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'c_user=123; xs=abc'
        })
      })
    );
  });

  it('throws an error when the request fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      resolveRedirectUrl('https://www.facebook.com/share/invalid/')
    ).rejects.toThrow(
      'Could not resolve Facebook share URL. Make sure the URL is correct and accessible.'
    );
  });

  it('preserves the original error as the cause', async () => {
    const networkError = new Error('Network error');
    mockedAxios.get.mockRejectedValueOnce(networkError);

    await expect(
      resolveRedirectUrl('https://www.facebook.com/share/invalid/')
    ).rejects.toMatchObject({ cause: networkError });
  });

  it('sends browser-like request headers', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      request: {
        res: {
          responseUrl: 'https://www.facebook.com/events/1234567890/'
        }
      },
      config: {}
    });

    await resolveRedirectUrl('https://www.facebook.com/share/18f2uMn71o/');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.facebook.com/share/18f2uMn71o/',
      expect.objectContaining({
        headers: expect.objectContaining({
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'en-US,en;q=0.6',
          'cache-control': 'max-age=0',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'sec-gpc': '1',
          'upgrade-insecure-requests': '1',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
        })
      })
    );
  });
});

describe('fetchEvent', () => {
  const eventUrl = 'https://www.facebook.com/events/1234567890';

  afterEach(() => {
    mockedAxios.get.mockReset();
  });

  it('returns event data for a valid URL', async () => {
    const responseData = 'Some HTML event data';
    mockedAxios.get.mockResolvedValueOnce({ data: responseData });

    const result = await fetchEvent(eventUrl);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(eventUrl, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.6',
        'cache-control': 'max-age=0',
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

    expect(result).toEqual(responseData);
  });

  it('calls axios with addiotional axios options', async () => {
    const responseData = 'Some HTML event data';
    mockedAxios.get.mockResolvedValueOnce({ data: responseData });

    const options: ScrapeOptions = {
      proxy: { host: 'localhost', port: 8080 }
    };
    const result = await fetchEvent(eventUrl, options);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(eventUrl, {
      headers: expect.any(Object),
      ...options
    });

    expect(result).toEqual(responseData);
  });

  it('throws an error for an invalid URL', async () => {
    const errorMessage =
      'Error fetching event, make sure your URL is correct and the event is accessible. For private events, provide Facebook cookies via the cookies option.';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(fetchEvent('invalid-url')).rejects.toThrow(errorMessage);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('invalid-url', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.6',
        'cache-control': 'max-age=0',
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
  });

  it('preserves the original error as the cause', async () => {
    const networkError = new Error('Network error');
    mockedAxios.get.mockRejectedValueOnce(networkError);

    await expect(fetchEvent('invalid-url')).rejects.toMatchObject({
      cause: networkError
    });
  });
});
