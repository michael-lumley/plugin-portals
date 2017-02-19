(function() {
  var data, portal;

  portal = new pluginPortals.ClientPortal("thirdparty", {
    first: function(args) {
      args.firstArg = true;
      return args;
    },
    after: function(args, response) {
      if (args.firstArg != null) {
        response.firstArgResponse = true;
      }
      if (args.beforeSend != null) {
        response.beforeSendResponse = true;
      }
      response.afterSendResponse = true;
      return response;
    },
    beforeSend: function(request) {
      return request;
    },
    thirdpartyFN: function(args) {
      return {
        source: data.source
      };
    }
  });

  data = {
    source: window.document.getElementById("data").innerHTML
  };

  console.log(window.document.getElementById("data").innerHTML);

}).call(this);
