import axios from 'axios';
import { fetchEvent } from '../network';

// Mock axios to simulate server responses
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  it('throws an error for an invalid URL', async () => {
    const errorMessage =
      'Error fetching event, make sure your URL is correct and the event is accessible to the public.';
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
});
