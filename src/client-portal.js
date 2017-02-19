(function() {
  var ClientPortal, _, _$, glogger;

  _ = require("underscore");

  glogger = require("./../../glog/glog.js");

  _$ = require("./../../morslamina-utility/utility.js");

  module.exports = ClientPortal = (function() {
    function ClientPortal(origin, remotefns) {
      this.origin = origin;
      this.remotefns = remotefns;
      window.addEventListener("message", (function(_this) {
        return function(msg) {
          var glog, payload, prms;
          glog = glogger(["ClientPortal", "Messges Recieved"]);
          payload = JSON.parse(JSON.stringify(msg.data));
          if (payload.src === "content" && payload.request.origin === _this.origin) {
            glog = glog.open("Return Message to Request Originating Here (Find a Promise)");
            glog.add(payload);
            prms = _.findWhere(_this.promises, {
              id: payload.request.id
            });
            _this.promises = _.without(_this.promises, prms);
            if (payload.response.err != null) {
              return prms.reject(payload.response.err);
            } else {
              return prms.resolve(payload.response.data);
            }
          } else if (payload.src === "content" && payload.request.origin !== _this.origin && payload.request.target === _this.origin) {
            glog = glog.open("External Request, Not Originating Here (Send a Response)");
            glog.add(payload);
            if (_this.remotefns[payload.request.fn] != null) {
              Promise.resolve().then(function() {
                var args;
                if (_this.remotefns.first != null) {
                  args = _this.remotefns.first(payload.request.args);
                }
                return _this.remotefns[payload.request.fn](args);
              }).then(function(data) {
                glog.add("Sending Response");
                payload.response.data = data;
                payload.src = "client";
                if (_this.remotefns.after != null) {
                  payload.response.data = _this.remotefns.after(payload.request.args, payload.response.data);
                }
                glog.add(payload);
                return window.postMessage(payload, "*");
              });
              return null;
            } else {
              glog.add("Could not find local function at ClientPortal");
              payload.src = "client";
              payload.response.err = "Could not find local function " + payload.request.fn + " at ClientPortal";
              return window.postMessage(payload, "*");
            }
          }
        };
      })(this));
      _$.retryPromise(this.sendMessage.bind(this), {
        target: "background",
        register: true
      }, "1000").then((function(_this) {
        return function() {
          return glogger(["ClientPortal", "Setup"]).add("registration complete from client");
        };
      })(this));
      glogger(["ClientPortal", "Setup"]).add("Setup Message Sent from Client Portal");
    }

    ClientPortal.prototype.counter = 0;

    ClientPortal.prototype.promises = [];

    ClientPortal.prototype.sendMessage = function(request) {
      var glog, outsideReject, outsideResolve, prms;
      glog = glogger("ClientPortal").open("sending a message from ClientPortal");
      outsideResolve = null;
      outsideReject = null;
      prms = new Promise((function(_this) {
        return function(resolve, reject) {
          var payload;
          outsideResolve = resolve;
          outsideReject = reject;
          request.id = _this.counter;
          request.origin = _this.origin;
          if (_this.remotefns.beforeSend != null) {
            request.args = _this.remotefns.beforeSend(request.args);
          }
          payload = {
            request: request,
            src: "client"
          };
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
    };

    return ClientPortal;

  })();

}).call(this);
