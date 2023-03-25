'use strict';


// Open Connection

const domain   = 'localhost';
const secure   = location.protocol === 'https:';
const protocol = secure ? 'wss' : 'ws';
const port     = secure ? '8081' : '8080';
const server   = new WebSocket(`${protocol}://${domain}:${port}`);

server.onclose   = onClose;
server.onerror   = onError;
server.onmessage = onMessage;
server.onopen    = onOpen;


// Event Handlers

function onClose(e) {
	drawMessage(`Closed connection with a ${protocol} server`, 'info');
};

function onError(e) {
	drawMessage(`Error with a ${protocol} server`, 'info');
};

function onMessage(e) {
	let message;
	try {
		message = JSON.parse(e.data);
	} catch (error) {
		console.error('Error parsing JSON');
		console.error(error);
		return;
	}

	if (message.action === 'message')
		drawMessage(message.message, 'other');
};

function onOpen(e) {
	drawMessage(`Opened connection with a ${protocol} server`, 'info');
};


// UI

const sending  = document.getElementById('sending');
const messages = document.getElementById('messages');

function drawMessage(message, from) {
	const messageDiv = document.createElement('div');
	messageDiv.className = 'message ' + from;
	messages.appendChild(messageDiv);

	const text = document.createTextNode(message);
	messageDiv.appendChild(text);

	messages.scrollTo(0, messages.scrollHeight);
}

sending.onkeydown = e => {
	if (e.key !== 'Enter')
		return;

	const value = e.target.value;
	if (!value)
		return;

	drawMessage(value, 'me');
	e.target.value = '';

	if (!server)
		return drawMessage('No server to send to', 'info');
	else
		server.send(JSON.stringify({
			action:  'message',
			message: value,
		}));
}
