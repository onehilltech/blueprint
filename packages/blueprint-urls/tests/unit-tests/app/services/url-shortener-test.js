const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

function urlShortener () {
  return blueprint.lookup ('service:url-shortener');
}

describe ('services | url-shortener', function () {
  it ('should shorten a url', async function () {
    const shortUrl = await urlShortener ().shorten ('https://www.donatians.com/share');

    expect (shortUrl.url).to.equal ('https://www.donatians.com/share');
    expect (shortUrl.domain).to.be.undefined;
  });

  it ('should shorten a url for a domain', async function () {
    const shortUrl = await urlShortener ().shorten ('https://www.donatians.com/share', { domain: 'demo'} );

    expect (shortUrl.url).to.equal ('https://www.donatians.com/share');
    expect (shortUrl.domain).to.equal ('demo');
  });
});