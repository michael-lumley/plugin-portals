window.ContentPortal = class ContentPortal
	constructor: (@origin)->
		window.addEventListener("message", (msg)=>
			glog = _.glog("ContentPortal").open "Content Portal Got Message"
			glog.add msg
			if msg.data.src == "client"
				glog.add "From client"
				if msg.data.origin == @origin
					glog.add "	 ...originating with Client"
					@toEXT(msg.data).then((data)=>
						payload = msg.data
						delete payload.fn
						delete payload.args
						payload.response = data
						@toClient(payload)
					)
				else
					glog.add "	 ...its a reply to the background"
					prms = _.findWhere(@promises, {id: msg.data.id})
					@promises = _.without(@promises, prms)
					prms.resolve(msg.data.response)
			)
		chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>
			glog = _.glog("ContentPortal").open "Content got message from background"
			glog.add request
			@toClient(request).then((data)=>
				glog.add "Sending Response"
				glog.add data
				sendResponse(data)
			)
			return true;
		)
	counter: 0
	promises: []
	toEXT: (payload)->
		glog = _.glog("ContentPortal").open "sending a message to EXT from ContentPortal"
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
		glog = _.glog("ContentPortal").open "sending a message to client from content"
		if payload.origin == @origin
			#no need to save a callback/promise because we're returning a response to a call originating at this port
			payload.src="content"
			window.postMessage(payload, "*")
		else
			#call originated elsewhere and made to this port. Need a callback.
			outsideResolve = null
			outsideReject = null
			prms = new Promise((resolve, reject)=>
				outsideResolve = resolve
				outsideReject = reject
				payload.id = @counter
				payload.src = "content"
				glog.add payload
				window.postMessage(payload, "*")
			)
			@promises.push({id: @counter, promise: prms, resolve: outsideResolve, reject: outsideReject})
			@counter++
			return prms

listener = (msg)=>
	glog = _.glog("ContentPortal").open "ClientPortal Setup Listener Caught Message"
	if msg.data.src == "client" and msg.data.register
		glog.add "Creating/Registering ContentPortal with EXT"
		window.portal = new ContentPortal(msg.data.origin)
		portal.toEXT(msg.data).then((data)->
			payload = msg.data
			delete payload.fn
			delete payload.args
			payload.response = data
			portal.toClient(payload)
		)
		window.removeEventListener("message", listener)

window.addEventListener("message", listener)
