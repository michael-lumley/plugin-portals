(function() {
  var BackgroundPortal, _, _$, glogger,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require("underscore");

  glogger = require("./../../glog/glog.js");

  _$ = require("./../../morslamina-utility/utility.js");

  module.exports = BackgroundPortal = (function() {
    BackgroundPortal.prototype.tabs = {};

    function BackgroundPortal(remotefns) {
      this.remotefns = remotefns;
      this.register = bind(this.register, this);
      chrome.runtime.onMessage.addListener((function(_this) {
        return function(msg, sender, sendResponse) {
          var glog, payload;
          payload = {
            request: msg.request
          };
          glog = glogger(["BackgroundPortal", "Messages Recieved"]);
          if (payload.request.target === "background") {
            glog = glog.get("Targeted at Background");
            if (payload.request.register) {
              glog = glog.get("Registration");
              glog.add(msg);
              _this.register(payload.request.origin, sender.tab);
              payload.response = {
                data: {
                  success: true
                }
              };
              sendResponse(payload);
            } else if (_this.remotefns[payload.request.fn] != null) {
              glog = glog.get(payload.request.fn);
              glog.add(msg);
              Promise.resolve().then(function() {
                if (_this.remotefns.first != null) {
                  payload.request.args = _this.remotefns.first(payload.request.args);
                }
                return _this.remotefns[payload.request.fn](payload.request.args);
              }).then(function(data) {
                glog.add("Preparing to send response");
                payload.response = {
                  data: data
                };
                if (_this.remotefns.after != null) {
                  payload.response.data = _this.remotefns.after(payload.request.args, payload.response.data);
                }
                return sendResponse(payload);
              })["catch"](function(e) {
                return sendResponse({
                  request: payload.request,
                  response: {
                    err: e.toString()
                  }
                });
              });
            } else {
              glog.add("Unknown FN " + payload.request.fn);
              sendResponse({
                err: "ERROR: Could not find called function " + payload.request.fn + " in background portal."
              });
            }
          } else if (payload.request.target != null) {
            glog = glog.get("Targeted at " + payload.request.target);
            glog = glog.get(payload.request.fn);
            glog = glog.open("Message");
            glog.add(payload);
            _this.sendMessage(payload).then(function(payload) {
              glog.add("Got a response");
              glog.add(payload);
              return sendResponse(payload);
            })["catch"](function(e) {
              payload.response = {
                err: e.toString()
              };
              return sendResponse(payload);
            });
          } else {
            payload.response = {
              err: "ERROR: Target of call not specified."
            };
            sendResponse(payload);
          }
          return true;
        };
      })(this));
    }

    BackgroundPortal.prototype.register = function(origin, tab) {
      glogger(["BackgroundPortal", "Messages Recieved", "Targeted at Background", "Registration"]).add(origin + " registered");
      return this.tabs[origin] = tab;
    };

    BackgroundPortal.prototype.sendMessage = function(payload) {
      var glog, request;
      request = payload.request != null ? payload.request : request = {};
      glog = glogger().add("sending request to " + request.target);
      if (this.remotefns.beforeSend != null) {
        request = this.remotefns.beforeSend(request);
      }
      glog.add(request);
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var tab;
          if (_this.tabs[request.target] != null) {
            tab = _this.tabs[request.target];
            return chrome.tabs.sendMessage(0 + tab.id, {
              request: request
            }, function(response) {
              return resolve(response);
            });
          } else {
            return reject("Can not find an open tab containing " + request.target + "!");
          }
        };
      })(this));
    };

    return BackgroundPortal;

  })();

}).call(this);
