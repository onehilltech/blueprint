const toDate = require ('../../../../app/sanitizers/toDate');
const chai = require ('chai');

chai.use (require ('chai-datetime'));

const { expect } = chai;

describe ('app | sanitizers | toDate', function () {
  it ('should convert a numeric date to Date', function () {
    let now = Date.now ();
    let date = toDate (`${now}`);

    expect (date.getTime ()).to.equal (now);
  });

  it ('should convert an object data to Date', function () {
    let expected = new Date ();

    let date =
      toDate (JSON.stringify ({
        year :expected.getFullYear (),
        month : expected.getMonth (),
        day : expected.getDate(),
        hour :expected.getHours (),
        minute :expected.getMinutes(),
        second :expected.getSeconds(),
        millisecond :expected.getMilliseconds ()
      }));

    expect (expected).to.equalDate (date);
  });

  it ('should convert ISO date to Date', function () {
    let expected = new Date ();
    let date = toDate (expected.toISOString ());

    expect (expected).to.equalDate (date);
  });

  it ('should convert UTC date to Date', function () {
    let expected = new Date ();
    let date = toDate (expected.toUTCString (), {format: 'utc'});

    expect (expected).to.equalDate (date);
  });

  it ('should convert unix date to Date', function () {
    let expected = new Date ();
    let seconds = expected.getTime () / 1000;

    let date = toDate (`${seconds}`, {format: 'seconds'});

    expect (expected).to.equalDate (date);
  });
});
