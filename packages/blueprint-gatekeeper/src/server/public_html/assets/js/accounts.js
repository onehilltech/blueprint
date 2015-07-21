/**
 * Created by hillj on 6/24/15.
 */

$(function () {
  var $enabled = $('input[name="enabled"]');

  $enabled.bootstrapSwitch ();
  $enabled.on ('switchChange.bootstrapSwitch', function (event, state) {
    var url = "/api/accounts/" + this.dataset.accountId + "/enable";

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

  $("#delete-account").on ("click", function (ev) {
    var url = "/api/accounts/" + ev.target.dataset.accountId;

    $.ajax ({
      headers : { Authorization : 'Bearer ' + window.accessToken },
      type    : 'delete',
      url     : url,
      success : function (response) {
        window.location.href = "/admin/accounts";
      },
      error   : function (response) {

      }
    });
  });

  $("#save-scope").on ("click", function (ev) {
    var accountId = this.dataset.accountId;
    var source = $(this.dataset.source)[0];
    var data = {'scope[]' : source.value.split(',')};

    var url = "/api/accounts/" + accountId + "/scope";
    $.post (url, data, function (data) {

    });
  });

});

