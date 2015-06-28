/**
 * Created by hillj on 6/24/15.
 */

$(function () {
  $('input[name="enabled"]').bootstrapSwitch ();

  $('input[name="enabled"]').on ('switchChange.bootstrapSwitch', function (event, state) {
    var url = "/admin/accounts/" + this.dataset.accountId + "/enable";

    $.post (url, { enabled : state }, function (data) {
      console.log (data);
    });
  });

  $("#delete-account").on ("click", function (ev) {
    var url = "/admin/accounts/" + ev.target.dataset.accountId;

    $.ajax ({
      url     : url,
      type    : 'delete',
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

    var url = "/admin/accounts/" + accountId + "/scope";
    $.post (url, data, function (data) {

    });
  });

});

