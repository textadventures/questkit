var Quest = {
	_internal: {
		attributes: {},
		scripts: {},
		objects: [],
		commands: [],
		exits: [],
		regexes: {},
	},
	HandleCommand: function(input) {
		Quest.ScopeCommands().forEach(function(cmd) {
			Quest._internal.regexes[cmd].patterns.forEach(function(pattern) {
				var match = pattern.exec(input);
				if (match) {
					var args = match.slice(0);
					args.shift();
					Quest._internal.scripts[cmd + ".action"].apply(this, args);
				}
			});
		});
	},
	ScopeCommands: function() {
		var result = [];
		Quest._internal.commands.forEach(function(cmd) {
			var parent = get(cmd, "parent");
			if (!parent || parent == get(get("pov"), "parent")) {
				result.push(cmd);
			}
		});
		return result;
	},
}

// Quest script commmands =====================================================

function get(arg1, arg2) {
	var attribute = arg1;
	if (arg2) {
		attribute = arg1 + "." + arg2;
	}
	return Quest._internal.attributes[attribute];
}

function set(arg1, arg2, arg3) {
	var attribute = arg1;
	var value = arg2;
	if (arg3) {
		attribute = arg1 + "." + arg2;
		value = arg3;
	}
	Quest._internal.attributes[attribute] = value;
}

function getscript(arg1, arg2) {
	var attribute = arg1;
	if (arg2) {
		attribute = arg1 + "." + arg2;
	}
	return Quest._internal.scripts[attribute];
}

function msg(text) {
	console.log(text);
}

// A simple way of running this as a node console app for now ======================

var readline = require('readline');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.setPrompt("> ");
rl.prompt();

rl.on("line", function(input) {
	if (input == "q") {
		rl.close();
	}
	else {
		Quest.HandleCommand(input);
		rl.prompt();
	}
});