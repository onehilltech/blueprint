const blueprint = require ('@onehilltech/blueprint');

describe ('service | mailer', function () {
  it ('should send a mock email', async function () {
    const mailer = blueprint.lookup ('service:mailer');

    await mailer.send ('helloworld', {
      message: {
        to: 'james@onehilltech.com'
      }
    });
  })
});