const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');

describe ('service | mailer', function () {
  it ('should send a mock email', async function () {
    const mailer = blueprint.lookup ('service:mailer');

    const email = await mailer.send ('helloworld', {
      message: {
        to: 'james@onehilltech.com'
      }
    });

    expect (email).to.exist;
  });
});