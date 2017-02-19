_ = require("underscore")
glogger = require("./../../glog/glog.js")
_$ = require("./../../morslamina-utility/utility.js")

module.exports = class BackgroundPortal
	tabs: {}
	constructor: (@remotefns)->
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>
			payload = {request: msg.request}
			glog = glogger(["BackgroundPortal", "Messages Recieved"])
			if payload.request.target == "background"
				glog = glog.get("Targeted at Background")
				if payload.request.register
					glog = glog.get("Registration")
					glog.add msg
					@register(payload.request.origin, sender.tab)
					payload.response = {data: {success: true}}
					sendResponse(payload)
				else if @remotefns[payload.request.fn]?
					#not sure if our remote fn is a promise, so need to wrap it in one
					glog = glog.get(payload.request.fn)
					glog.add msg
					Promise.resolve().then(()=>
						payload.request.args = @remotefns.first(payload.request.args) if @remotefns.first?
						@remotefns[payload.request.fn](payload.request.args)
					).then((data)=>
						glog.add "Preparing to send response"
						payload.response = {data: data}
						payload.response.data = @remotefns.after(payload.request.args, payload.response.data) if @remotefns.after?
						sendResponse(payload)
					).catch((e)=>
						sendResponse({request: payload.request, response: {err: e.toString()}})
					)
				else
					glog.add("Unknown FN #{payload.request.fn}")
					sendResponse({err: "ERROR: Could not find called function #{payload.request.fn} in background portal."})
			else if payload.request.target?
				glog = glog.get "Targeted at #{payload.request.target}"
				glog = glog.get(payload.request.fn)
				glog = glog.open("Message")
				glog.add payload
				@sendMessage(payload).then((payload)->
					glog.add "Got a response"
					glog.add payload
					# the
					sendResponse(payload)
				).catch((e)=>
					payload.response = {err: e.toString()}
					sendResponse(payload)
				)
			else
				payload.response = {err: "ERROR: Target of call not specified."}
				sendResponse(payload)
			return true
		)
	register: (origin, tab)=>
		glogger(["BackgroundPortal", "Messages Recieved", "Targeted at Background", "Registration"]).add "#{origin} registered"
		@tabs[origin] = tab
	sendMessage: (payload)->
		request = if payload.request? then payload.request else request = {}
		glog = glogger().add "sending request to #{request.target}"
		request = @remotefns.beforeSend(request) if @remotefns.beforeSend?
		glog.add request
		return new Promise((resolve, reject)=>
			if @tabs[request.target]?
				tab = @tabs[request.target]
				chrome.tabs.sendMessage(0 + tab.id, {request: request}, (response)=>
					resolve(response)
				)
			else
				reject("Can not find an open tab containing #{request.target}!")
		)
