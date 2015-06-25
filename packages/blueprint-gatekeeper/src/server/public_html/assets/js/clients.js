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

  $("#delete-client").on ("click", function (ev) {
    var url = "/clients/" + ev.target.dataset.clientId;

    $.ajax ({
      url     : url,
      type    : 'delete',
      success : function (response) {
        window.location.href = "/clients";
      },
      error   : function (response) {

      }
    });
  });
});

