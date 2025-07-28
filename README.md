# Facebook Event Scraper

A slim module for scraping Facebook event data in milliseconds.

[![Version](https://img.shields.io/npm/v/facebook-event-scraper.svg)](https://npmjs.org/package/facebook-event-scraper)
[![License](https://img.shields.io/npm/l/facebook-event-scraper.svg)](https://github.com/francescov1/facebook-event-scraper/blob/master/package.json)

<!-- TOC start -->

- [Installation](#installation)
- [Usage](#usage)
  - [Scrape event](#scrape-event)
  - [Multi-date events](#multi-date-events)
  - [Scrape hosted event lists](#scrape-hosted-event-lists)
  - [Using a proxy](#using-a-proxy)
- [Limitations](#limitations)

<!-- TOC end -->

## Installation

```bash
# NPM
npm install facebook-event-scraper

# Yarn
yarn add facebook-event-scraper
```

## Usage

### Scrape event

To scrape Facebook events, provide an event URL or ID. Here's an example of how you can scrape event details:

```javascript
import { scrapeFbEvent, scrapeFbEventFromFbid } from 'facebook-event-scraper';

const url = 'https://www.facebook.com/events/1234567890';

// Scrape event using URL
async function example() {
  try {
    const eventData = await scrapeFbEvent(url);
    console.log(eventData);
  } catch (err) {
    console.error(err);
  }
}

// Scrape event using FBID
async function example2() {
  try {
    const eventData2 = await scrapeFbEventFromFbid('1234567890');
    console.log(eventData2);
  } catch (err) {
    console.error(err);
  }
}
```

The scrape methods return a Promise with the scraped event data. See below for an example of the event data, or [see the type definition here](https://github.com/francescov1/facebook-event-scraper/blob/master/src/types.ts#L3).

```json
{
  "id": "115982989234742",
  "name": "Example Event",
  "description": "This is an example event description.",
  "location": {
    "id": "118309434891614",
    "name": "Example Location Label",
    "address": "123 Example St",
    "description": "A description about the location",
    "url": "https://example.com/a-location-url",
    "city": { "name": "Los Angeles", "id": "111983945494775" },
    "countryCode": "US",
    "coordinates": {
      "latitude": 37.1234,
      "longitude": -122.1234
    },
    "type": "PLACE"
  },
  "photo": {
    "url": "https://www.facebook.com/photo/?fbid=595982989234742",
    "id": "595982989234742",
    "imageUri": "https://scontent.fyyc3-1.fna.fbcdn.net/v/blah-blah-blah"
  },
  "photos": [],
  "video": {
    "id": "595982989234742",
    "thumbnailUri": "https://scontent.fyyc3-1.fna.fbcdn.net/v/blah-blah-blah",
    "url": "https://www.facebook.com/Lietuva2050/videos/595982989234742/"
  },
  "isOnline": false,
  "url": "https://www.facebook.com/events/115982989234742",
  "startTimestamp": 1681000200,
  "endTimestamp": 1681004700,
  "formattedDate": "Saturday, April 8, 2023 at 6:30 PM – 7:45 PM UTC-06",
  "timezone": "UTC-06",
  "onlineDetails": null,
  "hosts": [
    {
      "id": "101364691376556",
      "name": "Bob Smith",
      "url": "https://www.facebook.com/bob-smith",
      "type": "User",
      "photo": {
        "imageUri": "https://scontent.fyyc3-1.fna.fbcdn.net/v/blah-blah-blah"
      }
    }
  ],
  "ticketUrl": null,
  "usersResponded": 10,
  "parentEvent": { "id": "461592909271924" },
  "siblingEvents": [
    {
      "id": "138282953023820",
      "startTimestamp": 1717003800,
      "endTimestamp": 1717011000,
      "parentEvent": { "id": "461592909271924" }
    },
    {
      "id": "162229499644927",
      "startTimestamp": 1716399000,
      "endTimestamp": 1716406200,
      "parentEvent": { "id": "461592909271924" }
    }
  ]
}
```

### Multi-date events

If an event has multiple times/dates, it will have the `parentEvent` and `siblingEvents` fields populated. Each sibling event is a date for the parent event.

### Scrape hosted event lists

Scrape hosted events from groups, pages and profiles using the `scrapeFbEventList` method. You can optionally filter by past or upcoming event types. See example below:

```javascript
import {
  scrapeFbEventList
  EventType
} from 'facebook-event-scraper';

// Scrape events from fb page
async function example() {
  try {
    const pageUrl = 'https://www.facebook.com/lacalle8prague/events'
    const pageEventData = await scrapeFbEventList(pageUrl, EventType.Upcoming);
    console.log(pageEventData);

    const groupUrl = 'https://www.facebook.com/groups/409785992417637/events'
    const groupEventData = await scrapeFbEventList(groupUrl, EventType.Past);
    console.log(groupEventData);

    const profileUrl = 'https://www.facebook.com/profile.php?id=61553164865125&sk=events'
    const profileEventData = await scrapeFbEventList(profileUrl, EventType.Past);
    console.log(profileEventData);
  } catch (err) {
    console.error(err);
  }
}
```

This will return a Promise with a list of scraped event data. For full event data objects, you can pass the `id` field seen below into `scrapeFbEventFromFbid`.

```json
[
  {
    "id": "916236709985575",
    "name": "NEW YEAR EVE 2025",
    "url": "https://www.facebook.com/events/916236709985575/",
    "date": "Tue, Dec 31, 2024",
    "isCanceled": false,
    "isPast": true
  },
  {
    "id": "591932410074832",
    "name": "REGGAETON NIGHT",
    "url": "https://www.facebook.com/events/591932410074832/",
    "date": "Fri, Nov 22, 2024",
    "isCanceled": false,
    "isPast": true
  },
  {
    "id": "1103230308135807",
    "name": "FIESTA LATINA",
    "url": "https://www.facebook.com/events/1103230308135807/",
    "date": "Sat, Nov 9, 2024",
    "isCanceled": false,
    "isPast": true
  }
]
```

### Using a proxy

This library uses a GET request to fetch the Facebook event data. To use a proxy for this request, pass an object containing the proxy details as the second argument. The proxy data type is identical to the [Axios proxy options](https://axios-http.com/docs/req_config).

```javascript
import { scrapeFbEvent } from 'facebook-event-scraper';

const url = 'https://www.facebook.com/events/1234567890';

// Scrape event using URL & proxy
async function example() {
  try {
    const eventData = await scrapeFbEvent(url, {
      proxy: {
        host: '192.168.0.0',
        port: 1234,
        // Optional fields
        auth: {
          username: 'user',
          password: 'pass'
        },
        protocol: 'http'
      }
    });
    console.log(eventData);
  } catch (err) {
    console.error(err);
  }
}
```

## Limitations

Since this package does not use authentication, it only works for public Facebook event pages.

Additionally, Facebook's terms of service prohibit automated scraping of their website. Use this package at your own risk.
