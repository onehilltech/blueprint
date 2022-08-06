const blueprint = require ('@onehilltech/blueprint');
const { expect } = require ('chai');
const path = require ('path');

describe ('app | services | python', function () {
  it ('should run a python script', async function () {
    const python = blueprint.lookup ('service:python');
    const script = path.resolve (blueprint.app.appPath, 'assets/scripts/helloworld.py');

    const output = await python.run (script);

    expect (output).to.equal ('Hello, World!')
  });

  it.skip ('should stream the output', async function () {
    this.timeout (50000);

    const python = blueprint.lookup ('service:python');
    const script = path.resolve (blueprint.app.appPath, 'assets/scripts/delayed-helloworld.py');

    let output = '';

    let promise = python.run (script);
    promise.stdout = function (data) {
      output += data.toString ();
    }

    await promise;

    expect (output).to.equal ('Hello, World!')
  });
});
