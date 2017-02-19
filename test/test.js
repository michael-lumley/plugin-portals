(function() {
  var data, portal;

  portal = new pluginPortals.ClientPortal("test Script", {
    first: function(args) {
      if (args == null) {
        args = {};
      }
      return args;
    },
    after: function(response) {
      if (response == null) {
        response = {};
      }
      return response;
    },
    beforeSend: function(request) {
      if (request == null) {
        request = {};
      }
      request.beforeSend = true;
      return request;
    },
    testFN: function(args) {
      return data.source;
    }
  });

  data = {
    source: "test"
  };

  setTimeout(function() {
    return portal.sendMessage({
      target: "background",
      fn: "backgroundFN",
      args: {
        test: 1,
        test2: 2
      }
    }).then(function(data) {
      console.log("background FN");
      return console.log(data);
    })["catch"](function(e) {
      return console.log(e);
    });
  }, "1000");

  setTimeout(function() {
    console.log("third party send");
    return portal.sendMessage({
      target: "thirdparty",
      fn: "thirdpartyFN",
      args: {
        test: 3,
        test4: 4
      }
    }).then(function(data) {
      console.log("success third party");
      return console.log(data);
    })["catch"](function(e) {
      return console.log(e);
    });
  }, "2000");

}).call(this);
