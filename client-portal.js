(function() {
  var ClientPortal;

  window.ClientPortal = ClientPortal = (function() {
    function ClientPortal(origin, remotefns) {
      this.origin = origin;
      this.remotefns = remotefns;
      window.addEventListener("message", (function(_this) {
        return function(msg) {
          var glog, prms;
          glog = _.glog("ClientPortal").open("ClientPortal got a message");
          glog.add(msg);
          if (msg.data.src === "content" && msg.data.origin === _this.origin) {
            glog.add("ClientPortal got a return message from ContentPortal");
            prms = _.findWhere(_this.promises, {
              id: msg.data.id
            });
            _this.promises = _.without(_this.promises, prms);
            if (msg.data.response.err != null) {
              return prms.reject(msg.data.response);
            } else {
              return prms.resolve(msg.data.response);
            }
          } else if (msg.data.src === "content" && msg.data.origin !== _this.origin && msg.data.target === _this.origin) {
            glog.add("ClientPortal got an original message from ContentPortal");
            if (_this.remotefns[msg.data.fn] != null) {
              return Promise.resolve().then(function() {
                if (_this.remotenfns.first != null) {
                  msg.data.args = _this.remotefns.first(msg.data.args);
                }
                return _this.remotefns[msg.data.fn](msg.data.args);
              }).then(function(data) {
                var payload;
                payload = msg.data;
                payload.src = "client";
                payload.response = data;
                if (_this.remotefns.after != null) {
                  payload = _this.remotefns.after(payload);
                }
                return window.postMessage(payload, "*");
              });
            } else {
              return glog.add("Could not find local function at ClientPortal");
            }
          }
        };
      })(this));
      this.sendMessage({
        target: "background",
        register: true
      }).then((function(_this) {
        return function() {
          return _.glog(["App Setup", "ClientPortal"]).add("registration complete from client");
        };
      })(this));
      _.glog(["App Setup", "ClientPortal"]).add("Setup Message Sent from Client Portal BLAH!");
    }

    ClientPortal.prototype.counter = 0;

    ClientPortal.prototype.promises = [];

    ClientPortal.prototype.sendMessage = function(payload) {
      var glog, outsideReject, outsideResolve, prms;
      glog = _.glog("ClientPortal").open("sending a message from ClientPortal");
      outsideResolve = null;
      outsideReject = null;
      prms = new Promise((function(_this) {
        return function(resolve, reject) {
          outsideResolve = resolve;
          outsideReject = reject;
          payload.id = _this.counter;
          payload.origin = _this.origin;
          payload.src = "client";
          if (_this.remotefns.beforeSend != null) {
            payload = _this.remotefns.beforeSend(payload);
          }
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
