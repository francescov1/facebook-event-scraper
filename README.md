# Facebook Event Scraper

A slim NPM package for scraping Facebook event event data nearly instantaneously.

## Installation

To install the package, simply run the following command in your project directory:

```bash
npm install facebook-event-scraper

yarn add facebook-event-scraper
```

## Usage

To use the Facebook Event Scraper, you need to provide the URL of the Facebook event page you want to scrape. Here's an example of how you can use the package to scrape the event details:

```javascript
const { scrapeEvent } = require('facebook-event-scraper');

const eventUrl = 'https://www.facebook.com/events/1234567890';

scrapeEvent(eventUrl)
  .then((eventDetails) => {
    console.log(eventDetails);
  })
  .catch((error) => {
    console.error(error);
  });
```

The scrapeEvent function returns a Promise with the scraped event data. See below for an example of the event data, or [see the type definition here](https://github.com/francescov1/facebook-events-scraper/blob/ba82afd5153623a05ea5a14cb9c57f7cf8abb80d/src/types.ts#L1).

```json
{
  "id": "115982989234742",
  "name": "Example Event",
  "description": "This is an example event description.",
  "startTime": "2023-04-10T14:00:00-0700",
  "endTime": "2023-04-10T18:00:00-0700",
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
    "url": "https://www.facebook.com/photo/?fbid=595982989234742&set=gm.1137956736879596",
    "id": "595982989234742"
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
        "url": "https://scontent.fyyc3-1.fna.fbcdn.net/v/blah-blah-blah"
      }
    }
  ],
  "ticketUrl": null,
  "usersGoing": 10,
  "usersInterested": 24
}
```

## Limitations

Since this package does not use authentication, it only works for public Facebook event pages.

Additionally, Facebook's terms of service prohibit automated scraping of their website. Use this package at your own risk.
