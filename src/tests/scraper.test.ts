import { scrapeEvent } from '../scraper';
import * as htmlParser from '../utils/htmlParser';
import { fetchEvent } from '../utils/network';

// Mock dependencies
jest.mock('../utils/htmlParser', () => ({
  getBasicData: jest.fn().mockReturnValue({
    name: 'Test Event',
    photo: 'test.jpg',
    isOnline: false,
    url: 'http://test.com',
    startTimestamp: 1649116800,
    formattedDate: 'April 3, 2023'
  }),
  getEndTimestampAndTimezone: jest.fn().mockReturnValue({
    endTimestamp: 1649120400,
    timezone: 'America/Los_Angeles'
  }),
  getLocation: jest.fn().mockReturnValue({
    id: 123,
    name: 'some location',
    description: 'some description',
    url: 'http://test-location.com',
    coordinates: {
      latitude: 123,
      longitude: 456
    },
    countryCode: 'CA',
    type: 'PLACE',
    address: 'some address',
    city: {
      name: 'some city',
      id: 456
    }
  }),
  getDescription: jest.fn().mockReturnValue('Test Description'),
  getTicketUrl: jest.fn().mockReturnValue('http://test.com/tickets'),
  getOnlineDetails: jest.fn().mockReturnValue({
    type: 'THIRD_PARTY',
    url: 'http://test.com/zoom'
  }),
  getHosts: jest.fn().mockReturnValue([
    {
      id: '123',
      name: 'Test Host',
      photo: {
        url: 'test.jpg'
      },
      url: 'http://test.com',
      type: 'User'
    }
  ]),
  getUserStats: jest.fn().mockReturnValue({
    usersResponded: 10
  })
}));

jest.mock('../utils/network', () => ({
  fetchEvent: jest.fn().mockResolvedValue('Test Data')
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('scrapeEvent', () => {
  it('should call fetchEvent with the provided URL', async () => {
    await scrapeEvent('http://test.com', {});
    expect(fetchEvent).toHaveBeenCalledWith('http://test.com', undefined);
  });

  it('should pass the proxy option to fetchEvent', async () => {
    const aProxy = { host: 'test.com', port: 1234 };
    await scrapeEvent('http://test.com', { proxy: aProxy });
    expect(fetchEvent).toHaveBeenCalledWith('http://test.com', aProxy);
  });

  it('should parse the basic event data from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getBasicData).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('name', 'Test Event');
    expect(result).toHaveProperty('photo', 'test.jpg');
    expect(result).toHaveProperty('isOnline', false);
    expect(result).toHaveProperty('url', 'http://test.com');
    expect(result).toHaveProperty('startTimestamp', 1649116800);
    expect(result).toHaveProperty('formattedDate', 'April 3, 2023');
  });

  it('should parse the end timestamp and timezone from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getEndTimestampAndTimezone).toHaveBeenCalledWith(
      'Test Data',
      1649116800
    );
    expect(result).toHaveProperty('endTimestamp', 1649120400);
    expect(result).toHaveProperty('timezone', 'America/Los_Angeles');
  });

  it('should parse the location from the HTML if the event is not online', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getLocation).toHaveBeenCalledWith('Test Data');
    expect(htmlParser.getOnlineDetails).not.toHaveBeenCalled();
    expect(result).toHaveProperty('location', {
      id: 123,
      name: 'some location',
      description: 'some description',
      url: 'http://test-location.com',
      coordinates: {
        latitude: 123,
        longitude: 456
      },
      countryCode: 'CA',
      type: 'PLACE',
      address: 'some address',
      city: {
        name: 'some city',
        id: 456
      }
    });
  });

  it('should parse the online details from the HTML if the event is online', async () => {
    (htmlParser.getBasicData as jest.Mock).mockReturnValueOnce({
      name: 'Test Online Event',
      photo: 'test.jpg',
      isOnline: true,
      url: 'http://test.com',
      startTimestamp: 1649116800,
      formattedDate: 'April 3, 2023'
    });
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getOnlineDetails).toHaveBeenCalledWith('Test Data');
    expect(htmlParser.getLocation).not.toHaveBeenCalled();
    expect(result).toHaveProperty('onlineDetails', {
      type: 'THIRD_PARTY',
      url: 'http://test.com/zoom'
    });
  });

  it('should parse the description from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getDescription).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('description', 'Test Description');
  });

  it('should parse the ticket URL from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getTicketUrl).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('ticketUrl', 'http://test.com/tickets');
  });

  it('should parse the hosts from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getHosts).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('hosts', [
      {
        id: '123',
        name: 'Test Host',
        photo: {
          url: 'test.jpg'
        },
        url: 'http://test.com',
        type: 'User'
      }
    ]);
  });

  it('should parse the user stats from the HTML', async () => {
    const result = await scrapeEvent('http://test.com', {});
    expect(htmlParser.getUserStats).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('usersResponded', 10);
  });
});
