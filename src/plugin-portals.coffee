window.pluginPortals = {}
glogs = require("./../../glog/glog.js")
pluginPortals.BackgroundPortal = require("./background-portal.js");
pluginPortals.ClientPortal = require("./client-portal.js");
pluginPortals.ContentPortal = require("./content-portal.js");

glogger("PluginPortals").add "Loaded PluginPortals"
if chrome.extension?
	if !chrome.extension.getBackgroundPage?
		listener = (msg)=>
			glog = glogger("ContentPortal").open "ClientPortal Setup Listener Caught Message"
			payload = msg.data
			if payload.src == "client" and payload.request.register
				glog.add "Creating/Registering ContentPortal with EXT"
				portal = new pluginPortals.ContentPortal(payload.request.origin)
				portal.toEXT({request: payload.request}).then((payload)->
						payload.src = "content"
						portal.toClient(payload)
					)
				window.removeEventListener("message", listener)
		glog = glogger("ContentPortal").add "Adding Setup Listener"
		window.addEventListener("message", listener)

module.exports = pluginPortals
