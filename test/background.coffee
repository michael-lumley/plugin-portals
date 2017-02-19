portal = new pluginPortals.BackgroundPortal(
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
		request.backgroundBeforeSend = true
		return request
	backgroundFN: (args)->
		return {return: data.source}
)

data = {
	source: "background yes"
}
