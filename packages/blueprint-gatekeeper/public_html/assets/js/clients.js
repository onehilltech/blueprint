/**
 * Created by hillj on 6/24/15.
 */

$(function () {
  $('input[name="enabled"]').bootstrapSwitch ();

  $('input[name="enabled"]').on ('switchChange.bootstrapSwitch', function (event, state) {
    var url = "/clients/" + this.dataset.clientId + "/enable";
    $.post (url, { enabled : state }, function (data) {
      console.log (data);
    });
  });
});

