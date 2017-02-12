window.BackgroundPortal = class BackgroundPortal
	tabs: {}
	constructor: (@remotefns)->
		chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>
			console.log "EXT got message..."
			console.log request
			if request.target == "background"
				if request.register
					@register(request.origin, sender.tab)
					sendResponse({success: "true"})
				else if @remotefns[request.fn]?
					#not sure if our remote fn is a promise, so need to wrap it in one
					Promise.resolve().then(()=>
						request.args = @remotefns.first(request.args) if @remotefns.first?
						@remotefns[request.fn](request.args)
					).then((response)=>
						response = @remotefns.after(response) if @remotefns.after?
						sendResponse(response)
					).catch((e)=>
						sendResponse({err: e})
					)
				else
					sendResponse({err: "ERROR: Could not find called function #{request.fn} in background portal."})
			else if request.target?
				@sendMessage(request).then((data)->
					sendResponse(data)
				).catch((e)=>
					sendResponse({err: e})
				)
			else
				sendResponse({err: "ERROR: Target of call not specified."})
			return true
		)
	register: (origin, tab)=>
		console.log "registering #{origin}"
		@tabs[origin] = tab
	sendMessage: (request)->
		request = @remotefns.beforeSend(request) if @remotefns.beforeSend?
		return new Promise((resolve, reject)=>
			tab = @tabs[request.target]
			console.log tab
			console.log request
			console.log request.args
			chrome.tabs.sendMessage(0 + tab.id, request, (response)=>
				resolve(response)
			)
		)
