import {
  fbidToUrl,
  validateAndFormatEventGroupUrl,
  validateAndFormatEventPageUrl,
  validateAndFormatEventProfileUrl,
  validateAndFormatUrl
} from '../url';
import { EventType } from '../../enums';

describe('fbidToUrl', () => {
  it('returns the correct URL for a valid FB ID', () => {
    const result = fbidToUrl('1234567890');
    expect(result).toEqual(
      'https://www.facebook.com/events/1234567890?_fb_noscript=1'
    );
  });

  it('throws an error for an invalid FB ID', () => {
    expect(() => fbidToUrl('1234567')).toThrow('Invalid FB ID');
  });
});

describe('validateAndFormatUrl', () => {
  it('returns the correct URL for a valid FB event URL without query parameters', () => {
    const result = validateAndFormatUrl(
      'https://www.facebook.com/events/1234567890/'
    );
    expect(result).toEqual(
      'https://www.facebook.com/events/1234567890?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event URL with query parameters', () => {
    const result = validateAndFormatUrl(
      'https://www.facebook.com/events/1234567890?some-param=value'
    );
    expect(result).toEqual(
      'https://www.facebook.com/events/1234567890?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event URL with event name in the path', () => {
    const result = validateAndFormatUrl(
      'https://www.facebook.com/events/some-group-name/some-event-name/1234567890/'
    );
    expect(result).toEqual(
      'https://www.facebook.com/events/1234567890?_fb_noscript=1'
    );
  });

  it('throws an error for an invalid FB event URL without event ID', () => {
    expect(() =>
      validateAndFormatUrl('https://www.facebook.com/events/')
    ).toThrow('Invalid Facebook event URL');
  });

  it('throws an error for an invalid FB event URL with invalid event ID', () => {
    expect(() =>
      validateAndFormatUrl('https://www.facebook.com/events/1234567')
    ).toThrow('Invalid Facebook event URL');
  });

  it('throws an error for an invalid URL', () => {
    expect(() =>
      validateAndFormatUrl('https://www.facebook.com/invalid-url')
    ).toThrow('Invalid Facebook event URL');
  });
});

describe('validateAndFormatEventPageUrl without type parameter', () => {
  it('returns the correct URL for a valid FB event page URL', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with upcoming events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with past events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/past_hosted_events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/past_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB page URL', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague'
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB page URL with dot', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/Martinus.sk'
    );
    expect(result).toEqual(
      'https://www.facebook.com/Martinus.sk/events?_fb_noscript=1'
    );
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/some-events'
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events/something-else'
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL with some parameters', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events?something=testing'
      )
    ).toThrow('Invalid Facebook page event URL');
  });
});

describe('validateAndFormatEventPageUrl with type parameter', () => {
  it('returns the correct URL for a valid FB event page URL transformed to past events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/past_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL transformed to upcoming events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with upcoming events transformed to past events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/past_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with upcoming events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with past events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/past_hosted_events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/past_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB event page URL with past events events transformed to upcoming events', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague/past_hosted_events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB page URL with Past type', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/past_hosted_events?_fb_noscript=1'
    );
  });

  it('returns the correct URL for a valid FB page URL with Upcoming type', () => {
    const result = validateAndFormatEventPageUrl(
      'https://www.facebook.com/lacalle8prague',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/lacalle8prague/upcoming_hosted_events?_fb_noscript=1'
    );
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/some-events',
        EventType.Past
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events/something-else',
        EventType.Past
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL with some parameters', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events?something=testing',
        EventType.Past
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL when you use FB group page', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/groups/409785992417637/events',
        EventType.Past
      )
    ).toThrow('Invalid Facebook page event URL');
  });
});

describe('validateAndFormatEventGroupUrl', () => {
  it('returns the correct URL for a valid FB event group URL', () => {
    const result = validateAndFormatEventGroupUrl(
      'https://www.facebook.com/groups/409785992417637/events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/groups/409785992417637/events?_fb_noscript=1'
    );
  });

  it('returns the correct event group URL for a valid FB group URL', () => {
    const result = validateAndFormatEventGroupUrl(
      'https://www.facebook.com/groups/409785992417637'
    );
    expect(result).toEqual(
      'https://www.facebook.com/groups/409785992417637/events?_fb_noscript=1'
    );
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/group/some-events'
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events/something-else'
      )
    ).toThrow('Invalid Facebook page event URL');
  });

  it('throws an error for an invalid FB event page URL with some parameters', () => {
    expect(() =>
      validateAndFormatEventPageUrl(
        'https://www.facebook.com/lacalle8prague/events?something=testing'
      )
    ).toThrow('Invalid Facebook page event URL');
  });
});

describe('validateAndFormatEventProfileUrl without type parameter', () => {
  it('returns the correct URL for a valid FB event profile URL', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with upcoming events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with past events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB profile URL', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125'
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=events'
    );
  });

  it('throws an error for an invalid FB event profile URL', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/profile.php?id=61553164865125&sk=some-events'
      )
    ).toThrow('Invalid Facebook profile event URL');
  });

  it('throws an error for an invalid FB event profile URL', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/lacalle8prague/events/something-else'
      )
    ).toThrow('Invalid Facebook profile event URL');
  });

  it('throws an error for an invalid FB event profile URL with some parameters', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/profile.php?something=testing'
      )
    ).toThrow('Invalid Facebook profile event URL');
  });
});

describe('validateAndFormatEventProfileUrl with type parameter', () => {
  it('returns the correct URL for a valid FB event profile URL transformed to past events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL transformed to upcoming events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with upcoming events transformed to past events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with upcoming events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with past events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB event profile URL with past events events transformed to upcoming events', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB profile URL with Past type', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125',
      EventType.Past
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=past_hosted_events'
    );
  });

  it('returns the correct URL for a valid FB profile URL with Upcoming type', () => {
    const result = validateAndFormatEventProfileUrl(
      'https://www.facebook.com/profile.php?id=61553164865125',
      EventType.Upcoming
    );
    expect(result).toEqual(
      'https://www.facebook.com/profile.php?id=61553164865125&sk=upcoming_hosted_events'
    );
  });

  it('throws an error for an invalid FB event profile URL', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/profile.php?id=61553164865125&sk=some-events',
        EventType.Past
      )
    ).toThrow('Invalid Facebook profile event URL');
  });

  it('throws an error for an invalid FB event profile URL', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/profile.php?id=61553164865125&sk=something-else',
        EventType.Past
      )
    ).toThrow('Invalid Facebook profile event URL');
  });

  it('throws an error for an invalid FB event profile URL with some parameters', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/profile.php?something=testing',
        EventType.Past
      )
    ).toThrow('Invalid Facebook profile event URL');
  });

  it('throws an error for an invalid FB event profile URL when you use FB group page', () => {
    expect(() =>
      validateAndFormatEventProfileUrl(
        'https://www.facebook.com/groups/409785992417637/events',
        EventType.Past
      )
    ).toThrow('Invalid Facebook profile event URL');
  });
});
