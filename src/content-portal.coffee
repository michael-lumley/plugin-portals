_ = require("underscore")
glogger = require("./../../glog/glog.js")
_$ = require("./../../morslamina-utility/utility.js")

module.exports = class ContentPortal
	constructor: (@origin)->
		window.addEventListener("message", (msg)=>
			glog = glogger(["ContentPortal", "Messages Recieved"])
			payload = JSON.parse(JSON.stringify(msg.data))
			if payload.src == "client"
				glog = glog.get "From Client"
				if payload.request.origin == @origin
					glog = glog.open "Originating At Client (Use SendMessage)"
					glog.add payload
					@toEXT(payload).then((data)=>
						payload = data
						payload.src = "content"
						@toClient(payload)
					)
				else
					glog = glog.open "Reply to elsewhere (Use Promise)"
					glog.add payload
					prms = _.findWhere(@promises, {id: payload.response.id})
					glog.add prms
					@promises = _.without(@promises, prms)
					prms.resolve(payload)
			)
		chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>
			glog = glogger(["ContentPortal", "Messages Recieved"]).open "From Backgrund"
			glog.add request
			@toClient(request).then((payload)=>
				glog.add "Sending Response"
				glog.add payload
				sendResponse(payload)
			)
			return true;
		)
	counter: 0
	promises: []
	toEXT: (payload)->
		glog = glogger("ContentPortal").open "sending a message to EXT from ContentPortal"
		glog.add payload
		return new Promise((resolve, reject)=>
			chrome.runtime.sendMessage(payload, (response)->
				glog.add "Response Recieved"
				glog.add response
				if error?
					reject(error)
				else
					resolve(response)
			)
		)
	toClient: (payload)->
		glog = glogger("ContentPortal").open "sending a message to client from content"
		if payload.request.origin == @origin
			#no need to save a callback/promise because we're returning a response to a call originating at this port
			payload.src="content"
			window.postMessage(payload, "*")
		else
			#call originated elsewhere and made to this port. Need a callback and a generated response
			outsideResolve = null
			outsideReject = null
			prms = new Promise((resolve, reject)=>
				outsideResolve = resolve
				outsideReject = reject
				payload.response = {
					id: @counter
				}
				payload.src = "content"
				glog.add payload
				window.postMessage(payload, "*")
			)
			@promises.push({id: @counter, promise: prms, resolve: outsideResolve, reject: outsideReject})
			@counter++
			return prms
