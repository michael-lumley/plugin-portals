(function() {
  var ContentPortal, _, _$, glogger;

  _ = require("underscore");

  glogger = require("./../../glog/glog.js");

  _$ = require("./../../morslamina-utility/utility.js");

  module.exports = ContentPortal = (function() {
    function ContentPortal(origin) {
      this.origin = origin;
      window.addEventListener("message", (function(_this) {
        return function(msg) {
          var glog, payload, prms;
          glog = glogger(["ContentPortal", "Messages Recieved"]);
          payload = JSON.parse(JSON.stringify(msg.data));
          if (payload.src === "client") {
            glog = glog.get("From Client");
            if (payload.request.origin === _this.origin) {
              glog = glog.open("Originating At Client (Use SendMessage)");
              glog.add(payload);
              return _this.toEXT(payload).then(function(data) {
                payload = data;
                payload.src = "content";
                return _this.toClient(payload);
              });
            } else {
              glog = glog.open("Reply to elsewhere (Use Promise)");
              glog.add(payload);
              prms = _.findWhere(_this.promises, {
                id: payload.response.id
              });
              glog.add(prms);
              _this.promises = _.without(_this.promises, prms);
              return prms.resolve(payload);
            }
          }
        };
      })(this));
      chrome.runtime.onMessage.addListener((function(_this) {
        return function(request, sender, sendResponse) {
          var glog;
          glog = glogger(["ContentPortal", "Messages Recieved"]).open("From Backgrund");
          glog.add(request);
          _this.toClient(request).then(function(payload) {
            glog.add("Sending Response");
            glog.add(payload);
            return sendResponse(payload);
          });
          return true;
        };
      })(this));
    }

    ContentPortal.prototype.counter = 0;

    ContentPortal.prototype.promises = [];

    ContentPortal.prototype.toEXT = function(payload) {
      var glog;
      glog = glogger("ContentPortal").open("sending a message to EXT from ContentPortal");
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
      glog = glogger("ContentPortal").open("sending a message to client from content");
      if (payload.request.origin === this.origin) {
        payload.src = "content";
        return window.postMessage(payload, "*");
      } else {
        outsideResolve = null;
        outsideReject = null;
        prms = new Promise((function(_this) {
          return function(resolve, reject) {
            outsideResolve = resolve;
            outsideReject = reject;
            payload.response = {
              id: _this.counter
            };
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

}).call(this);
