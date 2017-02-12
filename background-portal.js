(function() {
  var BackgroundPortal,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.BackgroundPortal = BackgroundPortal = (function() {
    BackgroundPortal.prototype.tabs = {};

    function BackgroundPortal(remotefns) {
      this.remotefns = remotefns;
      this.register = bind(this.register, this);
      chrome.runtime.onMessage.addListener((function(_this) {
        return function(request, sender, sendResponse) {
          console.log("EXT got message...");
          console.log(request);
          if (request.target === "background") {
            if (request.register) {
              _this.register(request.origin, sender.tab);
              sendResponse({
                success: "true"
              });
            } else if (_this.remotefns[request.fn] != null) {
              Promise.resolve().then(function() {
                if (_this.remotefns.first != null) {
                  request.args = _this.remotefns.first(request.args);
                }
                return _this.remotefns[request.fn](request.args);
              }).then(function(response) {
                if (_this.remotefns.after != null) {
                  response = _this.remotefns.after(response);
                }
                return sendResponse(response);
              })["catch"](function(e) {
                return sendResponse({
                  err: e
                });
              });
            } else {
              sendResponse({
                err: "ERROR: Could not find called function " + request.fn + " in background portal."
              });
            }
          } else if (request.target != null) {
            _this.sendMessage(request).then(function(data) {
              return sendResponse(data);
            })["catch"](function(e) {
              return sendResponse({
                err: e
              });
            });
          } else {
            sendResponse({
              err: "ERROR: Target of call not specified."
            });
          }
          return true;
        };
      })(this));
    }

    BackgroundPortal.prototype.register = function(origin, tab) {
      console.log("registering " + origin);
      return this.tabs[origin] = tab;
    };

    BackgroundPortal.prototype.sendMessage = function(request) {
      if (this.remotefns.beforeSend != null) {
        request = this.remotefns.beforeSend(request);
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var tab;
          tab = _this.tabs[request.target];
          console.log(tab);
          console.log(request);
          console.log(request.args);
          return chrome.tabs.sendMessage(0 + tab.id, request, function(response) {
            return resolve(response);
          });
        };
      })(this));
    };

    return BackgroundPortal;

  })();

}).call(this);
