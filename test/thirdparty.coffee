portal = new pluginPortals.ClientPortal("thirdparty",
	first: (args)->
		args.firstArg = true
		return args
	after: (args, response)->
		if args.firstArg?
			response.firstArgResponse = true
		if args.beforeSend?
			response.beforeSendResponse = true
		response.afterSendResponse = true
		return response
	beforeSend: (request)->
		return request
	thirdpartyFN: (args)->
		return {source: data.source}
)

data = {
	source: window.document.getElementById("data").innerHTML
}

console.log window.document.getElementById("data").innerHTML
