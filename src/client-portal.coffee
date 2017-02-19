_ = require("underscore")
glogger = require("./../../glog/glog.js")
_$ = require("./../../morslamina-utility/utility.js")

module.exports = class ClientPortal
	constructor: (@origin, @remotefns)->
		window.addEventListener("message", (msg)=>
			glog = glogger(["ClientPortal", "Messges Recieved"])
			payload = JSON.parse(JSON.stringify(msg.data))
			if payload.src == "content" and payload.request.origin == @origin
				glog = glog.open "Return Message to Request Originating Here (Find a Promise)"
				glog.add payload
				prms = _.findWhere(@promises, {id: payload.request.id})
				@promises = _.without(@promises, prms)
				if payload.response.err?
					prms.reject(payload.response.err)
				else
					prms.resolve(payload.response.data)
			else if payload.src == "content" and payload.request.origin != @origin and payload.request.target == @origin
				glog = glog.open "External Request, Not Originating Here (Send a Response)"
				glog.add payload
				if @remotefns[payload.request.fn]?
					Promise.resolve().then(()=>
						args = @remotefns.first(payload.request.args) if @remotefns.first?
						@remotefns[payload.request.fn](args)
					).then((data)=>
						glog.add "Sending Response"
						payload.response.data = data
						payload.src = "client"
						payload.response.data = @remotefns.after(payload.request.args, payload.response.data) if @remotefns.after?
						glog.add payload
						window.postMessage(payload, "*")
					)
					return null
				else
					glog.add "Could not find local function at ClientPortal"
					payload.src = "client"
					payload.response.err = "Could not find local function #{payload.request.fn} at ClientPortal"
					window.postMessage(payload, "*")
		)
		_$.retryPromise(@sendMessage.bind(@), {
			target: "background"
			register: true
		}, "1000").then(()=>
			glogger(["ClientPortal", "Setup"]).add("registration complete from client")
		)
		glogger(["ClientPortal", "Setup"]).add "Setup Message Sent from Client Portal"
	counter: 0
	promises: []
	sendMessage: (request)->
		glog = glogger("ClientPortal").open "sending a message from ClientPortal"
		outsideResolve = null
		outsideReject = null
		prms = new Promise((resolve, reject)=>
			outsideResolve = resolve
			outsideReject = reject
			request.id = @counter
			request.origin = @origin
			request.args = @remotefns.beforeSend(request.args) if @remotefns.beforeSend?
			payload = {request: request, src: "client"}
			glog.add payload
			window.postMessage(payload, "*")
		)
		@promises.push({id: @counter, promise: prms, resolve: outsideResolve, reject: outsideReject})
		@counter++
		return prms
