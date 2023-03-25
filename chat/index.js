'use strict';


// Import node module
const fs = require('node:fs');

// Import classes from modules
const Env     = require('../spinneret/src/env');
const Server  = require('../spinneret/src/server');


// Instantiate
const env = new Env([
	{ filename: '.env' },
	{ process: true },
]);
const server = new Server();


// Middleware
server.midAsync(
	server.midReqBodyJson,
	server.midReqBodyOther,
	server.midReqUrlParams,
	server.midResDefaults,
	server.midResEnd,
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
	// Add soc to map
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
});
