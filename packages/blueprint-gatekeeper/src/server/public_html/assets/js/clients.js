/**
 * Created by hillj on 6/24/15.
 */

$(function () {
  $('input[name="enabled"]').bootstrapSwitch ();

  $('input[name="enabled"]').on ('switchChange.bootstrapSwitch', function (event, state) {
    var url = "/admin/oauth2/clients/" + this.dataset.clientId + "/enable";
    $.post (url, { enabled : state }, function (data) {
      console.log (data);
    });
  });

  $("#delete-client").on ("click", function (ev) {
    var url = "/admin/oauth2/clients/" + ev.target.dataset.clientId;

    $.ajax ({
      url     : url,
      type    : 'delete',
      success : function (response) {
        window.location.href = "/admin/oauth2/clients";
      },
      error   : function (response) {

      }
    });
  });

  $("#refresh-secret").on ("click", function (ev) {
    var clientId = this.dataset.clientId;
    var target = this.dataset.target;
    var url = "/admin/oauth2/clients/" + clientId + "/refresh-secret";

    $.get (url, function (data) {
      $(target).attr ("placeholder", data);
    });
  });

  // Setup the "Copy to clipboard" buttons.
  var copyClientId = new ZeroClipboard ($("#copy-client-id"));
  copyClientId.on ("ready", function (readyEvent) {
    copyClientId.on ("aftercopy", function (event) {
      alert (event.target.dataset.clipboardText);
    } );
  });

  var copyClientSecret = new ZeroClipboard ($("#copy-client-secret"))
  copyClientSecret.on ("ready", function (readyEvent) {
    copyClientSecret.on ("aftercopy", function (event) {
      alert (event.target.dataset.clipboardText);
    } );
  });
});

