(function() {
  var glog, glogs, listener;

  window.pluginPortals = {};

  glogs = require("./../../glog/glog.js");

  pluginPortals.BackgroundPortal = require("./background-portal.js");

  pluginPortals.ClientPortal = require("./client-portal.js");

  pluginPortals.ContentPortal = require("./content-portal.js");

  glogger("PluginPortals").add("Loaded PluginPortals");

  if (chrome.extension != null) {
    if (chrome.extension.getBackgroundPage == null) {
      listener = (function(_this) {
        return function(msg) {
          var glog, payload, portal;
          glog = glogger("ContentPortal").open("ClientPortal Setup Listener Caught Message");
          payload = msg.data;
          if (payload.src === "client" && payload.request.register) {
            glog.add("Creating/Registering ContentPortal with EXT");
            portal = new pluginPortals.ContentPortal(payload.request.origin);
            portal.toEXT({
              request: payload.request
            }).then(function(payload) {
              payload.src = "content";
              return portal.toClient(payload);
            });
            return window.removeEventListener("message", listener);
          }
        };
      })(this);
      glog = glogger("ContentPortal").add("Adding Setup Listener");
      window.addEventListener("message", listener);
    }
  }

  module.exports = pluginPortals;

}).call(this);
