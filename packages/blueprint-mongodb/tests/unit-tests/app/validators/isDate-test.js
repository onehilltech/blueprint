const isDate = require ('../../../../app/validators/isDate');
const { expect } = require ('chai');

describe ('app | validators | isDate', function () {
  it ('should accept number date string', function () {
    let now = Date.now ();
    expect (isDate (`${now}`)).to.be.true;
  });

  it ('should accept an object date string', function () {
    let expected = new Date ();

    let result =
      isDate (JSON.stringify ({
        year :expected.getFullYear (),
        month : expected.getMonth (),
        day : expected.getDate(),
        hour :expected.getHours (),
        minute :expected.getMinutes(),
        second :expected.getSeconds(),
        millisecond :expected.getMilliseconds ()
      }));

    expect (result).to.be.true;
  });

  it ('should accept an ISO date string', function () {
    let expected = new Date ();
    expect (isDate (expected.toISOString ())).to.be.true;
  });

  it ('should accept UTC date string', function () {
    let expected = new Date ();
    expect (isDate (expected.toUTCString (), {format: 'utc'})).to.be.true;
  });

  it ('should accept unix date string', function () {
    let expected = new Date ();
    let seconds = expected.getTime () / 1000;

    expect (isDate (`${seconds}`, {format: 'seconds'})).be.true;
  });
});
