(function() {
  var ContentPortal, listener;

  window.ContentPortal = ContentPortal = (function() {
    function ContentPortal(origin) {
      this.origin = origin;
      window.addEventListener("message", (function(_this) {
        return function(msg) {
          var glog, prms;
          glog = _.glog("ContentPortal").open("Content Portal Got Message");
          glog.add(msg);
          if (msg.data.src === "client") {
            glog.add("From client");
            if (msg.data.origin === _this.origin) {
              glog.add("	 ...originating with Client");
              return _this.toEXT(msg.data).then(function(data) {
                var payload;
                payload = msg.data;
                delete payload.fn;
                delete payload.args;
                payload.response = data;
                return _this.toClient(payload);
              });
            } else {
              glog.add("	 ...its a reply to the background");
              prms = _.findWhere(_this.promises, {
                id: msg.data.id
              });
              _this.promises = _.without(_this.promises, prms);
              return prms.resolve(msg.data.response);
            }
          }
        };
      })(this));
      chrome.runtime.onMessage.addListener((function(_this) {
        return function(request, sender, sendResponse) {
          var glog;
          glog = _.glog("ContentPortal").open("Content got message from background");
          glog.add(request);
          _this.toClient(request).then(function(data) {
            glog.add("Sending Response");
            glog.add(data);
            return sendResponse(data);
          });
          return true;
        };
      })(this));
    }

    ContentPortal.prototype.counter = 0;

    ContentPortal.prototype.promises = [];

    ContentPortal.prototype.toEXT = function(payload) {
      var glog;
      glog = _.glog("ContentPortal").open("sending a message to EXT from ContentPortal");
      glog.add(payload);
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return chrome.runtime.sendMessage(payload, function(response) {
            glog.add("Response Recieved");
            glog.add(response);
            if (typeof error !== "undefined" && error !== null) {
              return reject(error);
            } else {
              return resolve(response);
            }
          });
        };
      })(this));
    };

    ContentPortal.prototype.toClient = function(payload) {
      var glog, outsideReject, outsideResolve, prms;
      glog = _.glog("ContentPortal").open("sending a message to client from content");
      if (payload.origin === this.origin) {
        payload.src = "content";
        return window.postMessage(payload, "*");
      } else {
        outsideResolve = null;
        outsideReject = null;
        prms = new Promise((function(_this) {
          return function(resolve, reject) {
            outsideResolve = resolve;
            outsideReject = reject;
            payload.id = _this.counter;
            payload.src = "content";
            glog.add(payload);
            return window.postMessage(payload, "*");
          };
        })(this));
        this.promises.push({
          id: this.counter,
          promise: prms,
          resolve: outsideResolve,
          reject: outsideReject
        });
        this.counter++;
        return prms;
      }
    };

    return ContentPortal;

  })();

  listener = (function(_this) {
    return function(msg) {
      var glog;
      glog = _.glog("ContentPortal").open("ClientPortal Setup Listener Caught Message");
      if (msg.data.src === "client" && msg.data.register) {
        glog.add("Creating/Registering ContentPortal with EXT");
        window.portal = new ContentPortal(msg.data.origin);
        portal.toEXT(msg.data).then(function(data) {
          var payload;
          payload = msg.data;
          delete payload.fn;
          delete payload.args;
          payload.response = data;
          return portal.toClient(payload);
        });
        return window.removeEventListener("message", listener);
      }
    };
  })(this);

  window.addEventListener("message", listener);

}).call(this);
