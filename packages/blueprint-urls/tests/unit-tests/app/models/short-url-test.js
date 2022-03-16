const { expect } = require ('chai');
const blueprint = require ('@onehilltech/blueprint');
const md5 = require ('md5');

describe ('model | short-url', function () {
  it ('should create a short url model', async function () {
    const ShortUrl = blueprint.lookup ('model:short-url');
    const shortUrl = await ShortUrl.create ({ url: 'https://www.onehilltech.com' });

    expect (shortUrl.short_code).to.be.a ('string');
    expect (shortUrl.hash).to.equal (md5 ('https://www.onehilltech.com'));
  });

  it ('should create a short url model with custom short code', async function () {
    const ShortUrl = blueprint.lookup ('model:short-url');
    const shortUrl = await ShortUrl.create ({ url: 'https://www.onehilltech.com', short_code: '00000' });

    expect (shortUrl.short_code).to.equal ('00000');
  });

  it ('should create a same url on a different domains', async function () {
    const ShortUrl = blueprint.lookup ('model:short-url');
    const url1 = await ShortUrl.create ({ domain: 'd1', url: 'https://www.onehilltech.com' });
    const url2 = await ShortUrl.create ({ domain: 'd2', url: 'https://www.onehilltech.com' });
  })
});
