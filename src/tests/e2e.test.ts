import { scrapeFbEvent } from '../index';

// TODO: Try a private event, see if we can get a specific error message
// https://www.facebook.com/events/1637281650028494/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D

describe('E2E', () => {
  beforeEach(async () => {
    // 1s delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('Generates the correct event data for a Messenger Rooms Online event', async () => {
    const url =
      'https://www.facebook.com/events/564972362099646/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for a event with an end date & multiple dates', async () => {
    const url =
      'https://www.facebook.com/events/1137956700212933/1137956706879599';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an online event with a third-party URL', async () => {
    const url =
      'https://www.facebook.com/events/760928342374546/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an event with a ticket URL & city location', async () => {
    const url =
      'https://www.facebook.com/events/1376686273147180/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an event with a text address location', async () => {
    const url = 'https://www.facebook.com/events/719931529922611';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for a concert with multiple hosts & location info', async () => {
    const url =
      'https://www.facebook.com/events/602005831971873/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_top_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  // NOTE: This event currently returns an empty `hosts` array, we need to see if there are better ways to extract host data when the host is not a Facebook user or page
  it('Generates the correct event data for an event hosted by Eventbrite', async () => {
    const url =
      'https://www.facebook.com/events/252144510602906/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22discovery_online_tab%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an event with a text location', async () => {
    const url =
      'https://www.facebook.com/events/526262926343074/?acontext=%7B%22event_action_history%22%3A[%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22left_rail%22%2C%22surface%22%3A%22bookmark%22%7D%2C%7B%22extra_data%22%3A%22%22%2C%22mechanism%22%3A%22surface%22%2C%22surface%22%3A%22create_dialog%22%7D]%2C%22ref_notif_type%22%3Anull%7D';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an event with multiple hosts, a place location & tickets', async () => {
    const url =
      'https://www.facebook.com/events/calgary-stampede/all-elite-wrestling-aew-house-rules-calgary-alberta-debut/941510027277450/';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });

  it('Generates the correct event data for an event with a video cover', async () => {
    const url = 'https://www.facebook.com/events/242861135088721/';
    const eventData = await scrapeFbEvent(url);
    expect(eventData).toMatchSnapshot();
  });
});
