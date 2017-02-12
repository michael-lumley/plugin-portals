window.ClientPortal = class ClientPortal
	constructor: (@origin, @remotefns)->
		window.addEventListener("message", (msg)=>
			glog = _.glog("ClientPortal").open "ClientPortal got a message"
			glog.add msg
			if msg.data.src == "content" and msg.data.origin == @origin
				glog.add "ClientPortal got a return message from ContentPortal"
				prms = _.findWhere(@promises, {id: msg.data.id})
				@promises = _.without(@promises, prms)
				if msg.data.response.err?
					prms.reject(msg.data.response)
				else
					prms.resolve(msg.data.response)
			else if msg.data.src == "content" and msg.data.origin != @origin and msg.data.target == @origin
				glog.add "ClientPortal got an original message from ContentPortal"
				if @remotefns[msg.data.fn]?
					Promise.resolve().then(()=>
						msg.data.args = @remotefns.first(msg.data.args) if @remotenfns.first?
						@remotefns[msg.data.fn](msg.data.args)
					).then((data)=>
						payload = msg.data
						payload.src = "client"
						payload.response = data
						payload = @remotefns.after(payload) if @remotefns.after?
						window.postMessage(payload, "*")
					)
				else
					glog.add "Could not find local function at ClientPortal"
		)
		@sendMessage(
			target: "background"
			register: true
		).then(()=>
			_.glog(["App Setup", "ClientPortal"]).add("registration complete from client")
		)
		_.glog(["App Setup", "ClientPortal"]).add "Setup Message Sent from Client Portal BLAH!"
	counter: 0
	promises: []
	sendMessage: (payload)->
		glog = _.glog("ClientPortal").open "sending a message from ClientPortal"
		outsideResolve = null
		outsideReject = null
		prms = new Promise((resolve, reject)=>
			outsideResolve = resolve
			outsideReject = reject
			payload.id = @counter
			payload.origin = @origin
			payload.src = "client"
			payload = @remotefns.beforeSend(payload) if @remotefns.beforeSend?
			glog.add payload
			window.postMessage(payload, "*")
		)
		@promises.push({id: @counter, promise: prms, resolve: outsideResolve, reject: outsideReject})
		@counter++
		return prms
