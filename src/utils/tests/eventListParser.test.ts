import * as jsonUtil from '../json';
import * as htmlParser from '../htmlParser';
import * as eventListParser from '../eventListParser';
import {
  eventListPageData,
  eventListPageEmptyData
} from './data/eventListPageData';
import {
  eventListGroupData,
  eventListGroupEmptyData
} from './data/eventListGroupData';
import { EventType } from '../../types';

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

describe('getEventListFromPage', () => {
  it('should return basic data', () => {
    mockJsonReturnData(eventListPageData);
    const result = eventListParser.getEventListFromPage('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith('some html', 'collection');
    expect(result).toEqual([
      {
        id: '1372327683701218',
        name: 'Bachata & Salsa: FREE Open Class + Party',
        url: 'https://www.facebook.com/events/1372327683701218/',
        date: 'Tue, Apr 1',
        isCanceled: false,
        isPast: true
      },
      {
        id: '1369200957569262',
        name: 'Bachata & Salsa: FREE Open Class + Party',
        url: 'https://www.facebook.com/events/1369200957569262/',
        date: 'Tue, Mar 25',
        isCanceled: false,
        isPast: true
      },
      {
        id: '998491512228665',
        name: 'Bachata & Salsa: FREE Open Class + Party',
        url: 'https://www.facebook.com/events/998491512228665/',
        date: 'Tue, Mar 18',
        isCanceled: false,
        isPast: true
      }
    ]);
  });

  it('should return empty list', () => {
    mockJsonReturnData(eventListPageEmptyData);
    const result = eventListParser.getEventListFromPage('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith('some html', 'collection');
    expect(result).toEqual([]);
  });

  it('should throw an error if no basic event data is found', () => {
    mockJsonReturnData(null);
    expect(() => htmlParser.getBasicData('some html')).toThrow(
      new Error(
        'No event data found, please verify that your URL is correct and the event is accessible without authentication'
      )
    );
  });
});

describe('getEventListFromGroup', () => {
  it('should return basic upcoming data', () => {
    mockJsonReturnData(eventListGroupData);
    const result = eventListParser.getEventListFromGroup(
      'some html',
      EventType.Upcoming
    );

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'upcoming_events'
    );
    expect(result).toEqual([
      {
        id: '916236709985575',
        name: 'NEW YEAR EVE 2025',
        url: 'https://www.facebook.com/events/916236709985575/',
        date: 'Tue, Dec 31, 2024',
        isCanceled: false,
        isPast: true
      },
      {
        id: '591932410074832',
        name: 'REGGAETON NIGHT',
        url: 'https://www.facebook.com/events/591932410074832/',
        date: 'Fri, Nov 22, 2024',
        isCanceled: false,
        isPast: true
      },
      {
        id: '1103230308135807',
        name: 'FIESTA LATINA',
        url: 'https://www.facebook.com/events/1103230308135807/',
        date: 'Sat, Nov 9, 2024',
        isCanceled: false,
        isPast: true
      }
    ]);
  });

  it('should return basic upcoming data', () => {
    mockJsonReturnData(eventListGroupData);
    const result = eventListParser.getEventListFromGroup(
      'some html',
      EventType.Past
    );

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'past_events'
    );
    expect(result).toEqual([
      {
        id: '916236709985575',
        name: 'NEW YEAR EVE 2025',
        url: 'https://www.facebook.com/events/916236709985575/',
        date: 'Tue, Dec 31, 2024',
        isCanceled: false,
        isPast: true
      },
      {
        id: '591932410074832',
        name: 'REGGAETON NIGHT',
        url: 'https://www.facebook.com/events/591932410074832/',
        date: 'Fri, Nov 22, 2024',
        isCanceled: false,
        isPast: true
      },
      {
        id: '1103230308135807',
        name: 'FIESTA LATINA',
        url: 'https://www.facebook.com/events/1103230308135807/',
        date: 'Sat, Nov 9, 2024',
        isCanceled: false,
        isPast: true
      }
    ]);
  });

  it('should return empty list', () => {
    mockJsonReturnData(eventListGroupEmptyData);
    const result = eventListParser.getEventListFromGroup('some html');

    expect(findJsonInStringSpy).toHaveBeenCalledWith(
      'some html',
      'upcoming_events'
    );
    expect(result).toEqual([]);
  });

  it('should throw an error if no basic event data is found', () => {
    mockJsonReturnData(null);
    expect(() => htmlParser.getBasicData('some html')).toThrow(
      new Error(
        'No event data found, please verify that your URL is correct and the event is accessible without authentication'
      )
    );
  });
});
