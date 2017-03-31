const expect = require ('chai').expect
  , Barrier  = require ('../../lib/Barrier')
  ;

describe ('Barrier', function () {
  var b1, b2;

  it ('should create a barrier with 1 participant', function () {
    b1 = Barrier ('testBarrier');
    expect (b1.participantCount).to.equal (1);
  });

  it ('should create a barrier with 2 participants', function () {
    b2 = Barrier ('testBarrier');
    expect (b2.participantCount).to.equal (2);
  });

  it ('should wait for all barriers to signal', function (done) {
    var i = 0;

    b1.signalAndWait (complete);
    b2.signalAndWait (complete);

    function complete () {
      if (++ i === 2)
        return done (null);
    }
  });
});
