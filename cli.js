/* jshint quotmark: single */

var readline = require('readline');

(function () {
	'use strict';

	questkit.ui.addText = function (text) {
		console.log(text);
	};

	questkit.ui.escapeString = function (str) {
		return str;
	};
})();

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.setPrompt('> ');
rl.prompt();

rl.on('line', function(input) {
	if (input == 'q') {
		rl.close();
	}
	else {
		questkit.handleCommand(input);
		console.log('');
		rl.prompt();
	}
});