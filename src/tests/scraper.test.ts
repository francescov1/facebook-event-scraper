import { scrapeEvent } from '../scraper';
import * as htmlParser from '../htmlParser';
import { fetchEvent } from '../utils/network';

// TODO: Review, these are generated from ChatGPT

// Mock dependencies
jest.mock('../htmlParser', () => ({
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
  getLocation: jest.fn().mockReturnValue('Test Location'),
  getDescription: jest.fn().mockReturnValue('Test Description'),
  getTicketUrl: jest.fn().mockReturnValue('http://test.com/tickets'),
  getOnlineDetails: jest.fn().mockReturnValue({
    platform: 'Zoom',
    link: 'http://test.com/zoom'
  }),
  getHosts: jest.fn().mockReturnValue(['Test Host']),
  getUserStats: jest.fn().mockReturnValue({
    usersGoing: 10,
    usersInterested: 20
  })
}));

jest.mock('../utils/network', () => ({
  fetchEvent: jest.fn().mockResolvedValue('Test Data')
}));

describe('scrapeEvent', () => {
  it('should call fetchEvent with the provided URL', async () => {
    await scrapeEvent('http://test.com');
    expect(fetchEvent).toHaveBeenCalledWith('http://test.com');
  });

  it('should parse the basic event data from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getBasicData).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('name', 'Test Event');
    expect(result).toHaveProperty('photo', 'test.jpg');
    expect(result).toHaveProperty('isOnline', false);
    expect(result).toHaveProperty('url', 'http://test.com');
    expect(result).toHaveProperty('startTimestamp', 1649116800);
    expect(result).toHaveProperty('formattedDate', 'April 3, 2023');
  });

  it('should parse the end timestamp and timezone from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getEndTimestampAndTimezone).toHaveBeenCalledWith(
      'Test Data',
      1649116800
    );
    expect(result).toHaveProperty('endTimestamp', 1649120400);
    expect(result).toHaveProperty('timezone', 'America/Los_Angeles');
  });

  it('should parse the location from the HTML if the event is not online', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getLocation).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('location', 'Test Location');
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
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getOnlineDetails).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('onlineDetails', {
      platform: 'Zoom',
      link: 'http://test.com/zoom'
    });
  });

  it('should parse the description from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getDescription).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('description', 'Test Description');
  });

  it('should parse the ticket URL from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getTicketUrl).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('ticketUrl', 'http://test.com/tickets');
  });

  it('should parse the hosts from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getHosts).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('hosts', ['Test Host']);
  });

  it('should parse the user stats from the HTML', async () => {
    const result = await scrapeEvent('http://test.com');
    expect(htmlParser.getUserStats).toHaveBeenCalledWith('Test Data');
    expect(result).toHaveProperty('usersGoing', 10);
    expect(result).toHaveProperty('usersInterested', 20);
  });
});
