portal = new pluginPortals.ClientPortal("test Script"
	first: (args = {})->
		return args
	after: (response = {})->
		return response
	beforeSend: (request = {})->
		request.beforeSend = true
		return request
	testFN: (args)->
		return data.source
)

data = {
	source: "test"
}


setTimeout(()->
	portal.sendMessage(
		target: "background"
		fn: "backgroundFN"
		args: {
			test: 1
			test2: 2
		}
	).then((data)->
		console.log "background FN"
		console.log data
	).catch((e)->
		console.log e
	)
, "1000")


setTimeout(()->
	console.log "third party send"
	portal.sendMessage(
		target: "thirdparty"
		fn: "thirdpartyFN"
		args: {
			test: 3
			test4: 4
		}
	).then((data)->
		console.log "success third party"
		console.log data
	).catch((e)->
		console.log e
	)
, "2000")
