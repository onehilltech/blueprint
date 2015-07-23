/**
 * Created by hillj on 6/24/15.
 */

$(function () {
  var enabled = $('input[name="enabled"]');

  enabled.bootstrapSwitch ();
  enabled.on ('switchChange.bootstrapSwitch', function (event, state) {
    var url = "/admin/oauth2/clients/" + this.dataset.clientId + "/enable";

    $.ajax ({
      headers     : { Authorization : 'Bearer ' + window.accessToken },
      type        : 'post',
      url         : url,
      dataType    : "json",
      contentType : "application/json",
      data        : JSON.stringify({ enabled : state }),
      error       : function (res) {
        // TODO reset the toggle button
      }
    });
  });

  $("#delete-client").on ("click", function (ev) {
    var url = "/admin/oauth2/clients/" + ev.target.dataset.clientId;

    $.ajax ({
      headers : { Authorization : 'Bearer ' + window.accessToken },
      type    : 'delete',
      url     : url,
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

