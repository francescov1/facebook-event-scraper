# Facebook Event Scraper

A slim module for scraping Facebook event data in milliseconds.

[![Version](https://img.shields.io/npm/v/facebook-event-scraper.svg)](https://npmjs.org/package/facebook-event-scraper)
[![License](https://img.shields.io/npm/l/facebook-event-scraper.svg)](https://github.com/francescov1/facebook-event-scraper/blob/master/package.json)

## Installation

```bash
# NPM
npm install facebook-event-scraper

# Yarn
yarn add facebook-event-scraper
```

## Usage

To use the Facebook Event Scraper, you need to provide the URL of the Facebook event page you want to scrape. Here's an example of how you can use the package to scrape the event details:

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

The scrapeEvent function returns a Promise with the scraped event data. See below for an example of the event data, or [see the type definition here](https://github.com/francescov1/facebook-event-scraper/blob/master/src/types.ts#L3).

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
