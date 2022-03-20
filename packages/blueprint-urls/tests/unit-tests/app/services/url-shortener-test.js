const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

function urlShortener () {
  return blueprint.lookup ('service:url-shortener');
}

describe ('services | url-shortener', function () {
  context ('no domain', function () {
    it ('should shorten a url', async function () {
      const shortUrl = await urlShortener ().shorten ('https://www.onehilltech.com/contact');

      expect (shortUrl.url).to.equal ('https://www.onehilltech.com/contact');
      expect (shortUrl.domain).to.be.undefined;
    });

    it ('should redirect a short url', async function () {
      const shortUrl = await urlShortener ().shorten ('https://www.onehilltech.com/contact');

      const req = {
        baseUrl: shortUrl.short_code,
        query: {}
      };

      const res = {
        redirect (status, url) {
          expect (status).to.equal (301);
          expect (url).to.equal (shortUrl.url);
        }
      };

      await urlShortener ().redirect (req, res);
    });

    it ('should fail because invalid short code', async function () {
      const req = {
        baseUrl: '00000000',
        query: { domain: 'invalid' }
      };

      const res = { };

      try {
        await urlShortener ().redirect (req, res);
        expect.fail ('The redirect should have failed with NotFoundError');
      }
      catch (err) {
        expect (err).to.include ({
          name: 'NotFoundError',
          code: 'not_found',
          statusCode: 404
        });
      }
    });
  });

  context ('domain', function () {
    it ('should shorten a url for a domain', async function () {
      const shortUrl = await urlShortener ().shorten ('https://www.onehilltech.com/contact', { domain: 'demo'} );

      expect (shortUrl.url).to.equal ('https://www.onehilltech.com/contact');
      expect (shortUrl.domain).to.equal ('demo');
    });

    it ('should redirect a short url', async function () {
      const shortUrl = await urlShortener ().shorten ('https://www.onehilltech.com/contact', { domain: 'demo'});

      const req = {
        baseUrl: shortUrl.short_code,
        query: { domain: 'demo' }
      };

      const res = {
        redirect (status, url) {
          expect (status).to.equal (301);
          expect (url).to.equal (shortUrl.url);
        }
      };

      await urlShortener ().redirect (req, res);
    });

    it ('should fail because invalid short code', async function () {
      const req = {
        baseUrl: '00000000',
        query: { domain: 'demo' }
      };

      const res = { };

      try {
        await urlShortener ().redirect (req, res);
        expect.fail ('The redirect should have failed with NotFoundError');
      }
      catch (err) {
        expect (err).to.include ({
          name: 'NotFoundError',
          code: 'not_found',
          statusCode: 404
        });
      }
    });

    it ('should fail to redirect because invalid domain', async function () {
      const shortUrl = await urlShortener ().shorten ('https://www.onehilltech.com/contact', { domain: 'demo'});

      const req = {
        baseUrl: shortUrl.short_code,
        query: { domain: 'invalid' }
      };

      const res = { };

      try {
        await urlShortener ().redirect (req, res);
        expect.fail ('The redirect should have failed with NotFoundError');
      }
      catch (err) {
        expect (err).to.include ({
          name: 'NotFoundError',
          code: 'not_found',
          statusCode: 404
        });
      }
    });
  });
});