(function() {
  var data, portal;

  portal = new pluginPortals.BackgroundPortal({
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
      request.backgroundBeforeSend = true;
      return request;
    },
    backgroundFN: function(args) {
      return {
        "return": data.source
      };
    }
  });

  data = {
    source: "background yes"
  };

}).call(this);
