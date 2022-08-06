const { request } = require ('@onehilltech/blueprint-testing');
const { seed } = require ('@onehilltech/blueprint-mongodb');
const { expect } = require ('chai');

describe ('app | controllers | redirect', function () {
  it ('should redirect a short url', async function () {
    const { 'short-urls': [ shortUrl ] } = seed ();

    const res = await request ()
      .get (`/links/${shortUrl.short_code}`)
      .expect (301, {});

    expect (res.get ('location')).to.equal (shortUrl.url);
  })
});