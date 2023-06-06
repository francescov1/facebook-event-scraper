import * as jsonUtil from '../json';
import * as htmlParser from '../htmlParser';

const findJsonInStringSpy = jest.spyOn(jsonUtil, 'findJsonInString');

function mockJsonReturnData(jsonData: any, startIndex = 0, endIndex = 10) {
  findJsonInStringSpy.mockReturnValueOnce({
    jsonData,
    startIndex,
    endIndex
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDescription', () => {
  it('should return the description', () => {
    mockJsonReturnData({ text: 'some description' });
    const result = htmlParser.getDescription('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event_description'
    );
    expect(result).toEqual('some description');
  });

  it('should throw an error if no description is found', () => {
    mockJsonReturnData(null);
    expect(() => htmlParser.getDescription('some html')).toThrow(
      new Error(
        'No event description found, please verify that your event URL is correct'
      )
    );
  });
});

describe('getBasicData', () => {
  it('should return basic data with cover photo', () => {
    mockJsonReturnData({
      name: 'some name',
      cover_media_renderer: {
        cover_photo: {
          photo: {
            url: 'some url',
            id: 'some id'
          }
        }
      },
      day_time_sentence: 'some date',
      start_timestamp: 1680476245,
      is_online: true,
      url: 'some url'
    });
    const result = htmlParser.getBasicData('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event',
      expect.any(Function)
    );
    expect(result).toEqual({
      name: 'some name',
      photo: {
        url: 'some url',
        id: 'some id'
      },
      video: null,
      formattedDate: 'some date',
      startTimestamp: 1680476245,
      isOnline: true,
      url: 'some url'
    });
  });

  it('should return basic data with cover video', () => {
    mockJsonReturnData({
      name: 'some name',
      cover_media_renderer: {
        cover_video: {
          url: 'some url',
          id: 'some id',
          image: {
            uri: 'some image url'
          }
        }
      },
      day_time_sentence: 'some date',
      start_timestamp: 1680476245,
      is_online: true,
      url: 'some url'
    });
    const result = htmlParser.getBasicData('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event',
      expect.any(Function)
    );
    expect(result).toEqual({
      name: 'some name',
      photo: null,
      video: {
        url: 'some url',
        id: 'some id',
        thumbnailUrl: 'some image url'
      },
      formattedDate: 'some date',
      startTimestamp: 1680476245,
      isOnline: true,
      url: 'some url'
    });
  });

  it('should throw an error if no basic event data is found', () => {
    mockJsonReturnData(null);
    expect(() => htmlParser.getBasicData('some html')).toThrow(
      new Error(
        'No event date found, please verify that your event URL is correct'
      )
    );
  });
});

describe('getTicketUrl', () => {
  it('should return the ticket URL', () => {
    mockJsonReturnData({ event_buy_ticket_url: 'some ticket url' });
    const result = htmlParser.getTicketUrl('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event',
      expect.any(Function)
    );
    expect(result).toEqual('some ticket url');
  });

  it('should return null if no ticket URL is found', () => {
    mockJsonReturnData(null);
    const result = htmlParser.getTicketUrl('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event',
      expect.any(Function)
    );
    expect(result).toEqual(null);
  });
});

describe('getUserStats', () => {
  it('should return the users going and users interested counts', () => {
    mockJsonReturnData({ count: 5 });
    mockJsonReturnData({ count: 20 });
    const result = htmlParser.getUserStats('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledTimes(2);
    expect(findJsonInStringSpy).toHaveBeenNthCalledWith(
      1,
      'some html',
      'event_connected_users_going'
    );
    expect(findJsonInStringSpy).toHaveBeenNthCalledWith(
      2,
      'some html',
      'event_connected_users_interested'
    );

    expect(result).toEqual({ usersGoing: 5, usersInterested: 20 });
  });

  it('should return undefined if users going data is not found', () => {
    mockJsonReturnData(null);
    mockJsonReturnData({ count: 20 });

    const result = htmlParser.getUserStats('some html');
    expect(findJsonInStringSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ usersGoing: undefined, usersInterested: 20 });
  });

  it('should return undefined if users interested data is not found', () => {
    mockJsonReturnData({ count: 5 });
    mockJsonReturnData(null);

    const result = htmlParser.getUserStats('some html');
    expect(findJsonInStringSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ usersGoing: 5, usersInterested: undefined });
  });
});

describe('getLocation', () => {
  it('should return the location with all values present', () => {
    mockJsonReturnData({
      id: 'some id',
      name: 'some name',
      best_description: { text: 'some description' },
      url: 'some url',
      location: {
        latitude: 123,
        longitude: 456,
        reverse_geocode: {
          country_alpha_two: 'CA'
        }
      },
      place_type: 'PLACE',
      address: {
        street: 'some street'
      },
      city: {
        contextual_name: 'some city',
        id: 'some city id'
      }
    });
    const result = htmlParser.getLocation('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event_place',
      expect.any(Function)
    );
    expect(result).toEqual({
      id: 'some id',
      name: 'some name',
      description: 'some description',
      url: 'some url',
      coordinates: {
        latitude: 123,
        longitude: 456
      },
      countryCode: 'CA',
      type: 'PLACE',
      address: 'some street',
      city: {
        name: 'some city',
        id: 'some city id'
      }
    });
  });

  it('should return the location with missing values set to null', () => {
    mockJsonReturnData({
      id: 'some id',
      name: 'some name',
      location: null,
      place_type: 'TEXT'
    });
    const result = htmlParser.getLocation('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event_place',
      expect.any(Function)
    );
    expect(result).toEqual({
      id: 'some id',
      name: 'some name',
      description: null,
      url: null,
      coordinates: null,
      countryCode: null,
      type: 'TEXT',
      address: null,
      city: null
    });
  });

  it('should return null for an event with a null location', () => {
    mockJsonReturnData(null, 0, 10);
    const result = htmlParser.getLocation('some html');
    expect(result).toBeNull();
  });

  it('should throw an error if no location field is found', () => {
    mockJsonReturnData(null, -1, -1);
    expect(() => htmlParser.getLocation('some html')).toThrow(
      new Error(
        'No location information found, please verify that your event URL is correct'
      )
    );
  });
});

describe('getHosts', () => {
  it('should return the hosts array', () => {
    mockJsonReturnData([
      {
        id: 'some id',
        name: 'some name',
        url: 'some url',
        profile_picture: {
          uri: 'some uri'
        },
        __typename: 'User'
      },
      {
        id: 'another id',
        name: 'another name',
        url: 'another url',
        profile_picture: {
          uri: 'another uri'
        },
        __typename: 'Page'
      }
    ]);
    const result = htmlParser.getHosts('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event_hosts_that_can_view_guestlist',
      expect.any(Function)
    );
    expect(result).toEqual([
      {
        id: 'some id',
        name: 'some name',
        url: 'some url',
        photo: {
          url: 'some uri'
        },
        type: 'User'
      },
      {
        id: 'another id',
        name: 'another name',
        url: 'another url',
        photo: {
          url: 'another uri'
        },
        type: 'Page'
      }
    ]);
  });

  it('should return an empty array if no host info is found', () => {
    mockJsonReturnData(null);
    const result = htmlParser.getHosts('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'event_hosts_that_can_view_guestlist',
      expect.any(Function)
    );
    expect(result).toEqual([]);
  });
});

describe('getOnlineDetails', () => {
  it('should return the online details', () => {
    mockJsonReturnData({
      third_party_url: 'some url',
      type: 'some type'
    });
    const result = htmlParser.getOnlineDetails('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'online_event_setup',
      expect.any(Function)
    );
    expect(result).toEqual({
      url: 'some url',
      type: 'some type'
    });
  });

  it('should throw an error if no online details are found', () => {
    mockJsonReturnData(null);

    expect(() => htmlParser.getOnlineDetails('some html')).toThrow(
      new Error(
        'No online event details found, please verify that your event URL is correct'
      )
    );

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'online_event_setup',
      expect.any(Function)
    );
  });
});

describe('getEndTimestampAndTimezone', () => {
  it('should return the end timestamp and timezone', () => {
    mockJsonReturnData({
      end_timestamp: 123,
      tz_display_name: 'some timezone'
    });
    const result = htmlParser.getEndTimestampAndTimezone('some html', 456);

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'data',
      expect.any(Function)
    );
    expect(result).toEqual({
      endTimestamp: 123,
      timezone: 'some timezone'
    });
  });

  it('should return a null end timestamp if set to 0', () => {
    mockJsonReturnData({
      end_timestamp: 0,
      tz_display_name: 'some timezone'
    });
    const result = htmlParser.getEndTimestampAndTimezone('some html', 456);

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'data',
      expect.any(Function)
    );
    expect(result).toEqual({
      endTimestamp: null,
      timezone: 'some timezone'
    });
  });

  it('should throw an error if no end timestamp and timezone details are found', () => {
    mockJsonReturnData(null);

    expect(() =>
      htmlParser.getEndTimestampAndTimezone('some html', 456)
    ).toThrow(
      new Error(
        'No end date & timezone details found, please verify that your event URL is correct'
      )
    );

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'data',
      expect.any(Function)
    );
  });
});
