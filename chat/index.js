'use strict';


// Import Spinneret classes
const Env    = require('../spinneret/src/env');
const Server = require('../spinneret/src/server');


// Instantiate
const env    = new Env();
const server = new Server();


// Middleware
server.midApiAsync(
	server.midApiReqBodyJson,
	server.midApiReqBodyOther,
	server.midApiReqUrlParams,
	server.midApiResDefaults,
	server.midApiResEnd,
);


// Serve files
server.files();



// WebSocket

const all = new Map();
let socI = 0;

server.ws('close', function(soc)
{
	// Remove socket from map
	all.delete(soc.i);
});

server.ws('error', function(soc)
{
	console.error(soc.error);
});

server.ws('message', function(soc)
{
	// Skip if no message
	if (!soc.message)
		return;

	// Cache a message to broadcast
	const buffer = soc.encode(soc.message);

	// Broadcast to all others
	for (const [_, otherSoc] of all)
		if (otherSoc.i !== soc.i)
			otherSoc.send(buffer, true);
});

server.ws('open', function(soc)
{
	// When the socket is open too long, end it
	soc.setTimeout(env.SOCKET_TIMEOUT);
	soc.on('timeout', soc.end);

	// Add socket to map
	all.set(socI, soc);
	soc.i = socI;

	// Cache a message to broadcast
	const buffer = soc.encode({
		action:  'message',
		message: `Client ${socI} has entered the chat`,
	});

	// Broadcast to all
	for (const [_, otherClient] of all)
		otherClient.send(buffer, true);

	socI += 1;
});


// Listen
server.listen({
	port: env.PORT,
	requestTimeout: env.REQUEST_TIMEOUT,
});
