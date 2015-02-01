var questkit = {};
questkit.ui = {};

(function () {
	'use strict';

	var world = {
		attributes: {}
	};

	questkit.init = function (data) {
		world.scripts = data.scripts || {};
		world.objects = data.objects || [];
		world.commands = data.commands || [];
		world.exits = data.exits || [];
		world.regexes = data.regexes || {};
		world.templates = data.templates || {};
	};

	var povParent = function () {
		return get(get('pov'), 'parent');
	};

	// The idea of getMatchStrength is that you have a regex like
	//          look at (.*)
	// And you have a string like
	//          look at thing
	// The strength is the length of the "fixed" bit of the string, in this case "look at ".
	// So we calculate this as the length of the input string, minus the length of the
	// text that matches the groups.
	
	var getMatchStrength = function (regex, input) {
		var lengthOfTextMatchedByGroups = 0;
		var matches = regex.exec(input);
		matches.shift();
		matches.forEach(function (group) {
			lengthOfTextMatchedByGroups += group.length;
		});
		return input.length - lengthOfTextMatchedByGroups;
	}

	questkit.handleCommand = function (input) {
		// TODO: Full conversion

		var bestMatch;
		var command;
		var maxStrength = -1;

		questkit.scopeCommands().forEach(function (cmd) {
			world.regexes[cmd].patterns.forEach(function (pattern) {
				var match = pattern.exec(input);
				if (match) {
					var matchStrength = getMatchStrength(pattern, input);
					
					// Core library commands are defined after game commands, so strength
					// has to be greater for a command to "win". An exception is if the current
					// winner has no parent, and the candidate does - a locally defined command
					// beats a global command.

					if (matchStrength > maxStrength || (command && !get(command, "parent") && get(cmd, "parent"))) {
						maxStrength = matchStrength;
						command = cmd;
						bestMatch = match;
					}
				}
			});
		});

		if (maxStrength > -1) {
			handleCommandPattern(command, bestMatch);
		}
		else {
			// TODO: Use game.unresolvedcommandhandler if it exists?
			msg(questkit.template('UnrecognisedCommand'));
		}
	};

	var handleCommandPattern = function (command, match) {
		var args = match.slice(0);
		args.shift();

		set('~command', command);
		set('~args', args);
		set('~nextArgIndex', 0);

		if (world.regexes[command].groups.length > 0) {
			resolveNextName();
		}
		else {
			world.scripts[command + '.action'].apply(this, args);
		}
	};

	var resolveNextName = function () {
		var index = get('~nextArgIndex');
		var command = get('~command');
		var group = world.regexes[command].groups[index];
		var args = get('~args');

		if (group.indexOf('object') === 0) {
			// Resolve object name

			var check = args[index].toLowerCase();
			var found = false;

			questkit.scopeVisible().forEach(function (object) {
				if (object.toLowerCase() == check) {
					args[index] = object;
					found = true;
				}
			});
			// TODO: Handle aliases, disambiguation etc...

			if (!found) {
				if (world.regexes[command].groups.length > 1) {
					// TODO: Add an UnresolvedObjectMulti template which we can pass unresolved object to
					msg(questkit.template('UnresolvedObject') + ' ("' + args[index] + '")');
				}
				else {
					msg(questkit.template('UnresolvedObject'));
				}
				return;
			}
		}

		index++;
		if (index >= world.regexes[command].length) {
			set('~nextArgIndex', index);
			resolveNextName();
		}
		else {
			world.scripts[command + '.action'].apply(this, args);
		}
	};

	questkit.scopeCommands = function () {
		var result = [];
		var currentPovParent = povParent();
		world.commands.forEach(function (cmd) {
			var parent = get(cmd, 'parent');
			if (!parent || parent == currentPovParent) {
				result.push(cmd);
			}
		});
		return result;
	};

	questkit.scopeVisible = function () {
		return questkit.scopeVisibleNotHeld().concat(questkit.scopeInventory());
	};

	questkit.scopeVisibleNotHeld = function () {
		return questkit.scopeReachableNotHeldForLocation(povParent()).concat(questkit.scopeVisibleNotReachableForLocation(povParent()));
	};

	questkit.scopeReachableNotHeldForLocation = function (location) {
		var result = [];
		var pov = get('pov');
		questkit.getAllChildObjects(location).forEach(function (object) {
			if (questkit.containsReachable(location, object) && object != pov && !questkit.contains(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	questkit.getAllChildObjects = function (object) {
		// TODO: Cache direct children of each object
		var result = [];
		world.objects.forEach(function (child) {
			if (get(child, 'parent') == object) {
				result.push(child);
				result = result.concat(questkit.getAllChildObjects(child));
			}
		});
		return result;
	};

	questkit.containsVisible = function (parent, search) {
		return containsAccessible(parent, search, false);
	};

	questkit.containsReachable = function (parent, search) {
		return containsAccessible(parent, search, true);
	};

	var containsAccessible = function (parent, search, onlyReachable) {
		var searchParent = get(search, 'parent');
		if (!searchParent) return false;
		if (get(search, 'visible') === false) return false;
		if (get(parent, 'darklevel') && !get(search, 'lightsource')) return false;
		if (searchParent == parent) return true;
		
		var canAdd;
		if (onlyReachable) {
			canAdd = questkit.canReachThrough(searchParent);
		}
		else {
			canAdd = questkit.canSeeThrough(searchParent);
		}

		if (canAdd) {
			return (questkit.containsAccessible(parent, searchParent, onlyReachable));
		} else {
			return false;
		}
	};

	questkit.canSeeThrough = function (object) {
		return (get(object, 'transparent') || questkit.canReachThrough(object)) && !get(object, 'hidechildren');
	};

	questkit.canReachThrough = function (object) {
		return get(object, 'isopen') && !get(object, 'hidechildren');
	};

	questkit.contains = function (parent, search) {
		var searchParent = get(search, 'parent');
		if (!searchParent) return false;
		if (searchParent == parent) return true;
		return questkit.contains(parent, searchParent);
	};

	questkit.scopeVisibleNotReachableForLocation = function (location) {
		// TODO
		return [];
	};

	questkit.scopeInventory = function () {
		var result = [];
		var pov = get('pov');
		questkit.getAllChildObjects(pov).forEach(function (object) {
			if (questkit.containsVisible(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	questkit.goDirection = function (direction) {
		// TODO: Locked exits, exits with scripts, non-directional exits
		var foundExit;
		questkit.scopeExits().forEach(function (exit) {
			if (get(exit, 'direction') == direction) {
				foundExit = exit;
				return;
			}
		});

		if (!foundExit) {
			msg(questkit.template('UnresolvedLocation'));
			return;
		}

		set(get('pov'), 'parent', get(foundExit, 'to'));		
	};

	questkit.scopeExits = function () {
		return questkit.scopeExitsForLocation(povParent());
	};

	questkit.scopeExitsForLocation = function (location) {
		var result = [];
		world.exits.forEach(function (exit) {
			if (get(exit, 'parent') != location) return;
			if (get(exit, 'visible') === false) return;
			if (get(location, 'darklevel') && !get(exit, 'lightsource')) return;
			result.push(exit);
		});
		return result;
	};

	questkit.template = function (template) {
		return world.templates[template];
	};

	// questkit script commmands =====================================================

	questkit.get = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + '.' + arg2;
		}
		return world.attributes[attribute];
	};

	questkit.set = function (arg1, arg2, arg3) {
		var attribute = arg1;
		var value = arg2;
		if (arg3) {
			attribute = arg1 + '.' + arg2;
			value = arg3;
		}
		world.attributes[attribute] = value;
	};

	questkit.getscript = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + '.' + arg2;
		}
		return world.scripts[attribute];
	};

	questkit.msg = function (text) {
		questkit.ui.addText(text);
	};
})();

var get = questkit.get;
var set = questkit.set;
var getscript = questkit.getscript;
var msg = questkit.msg;

var initData = {
	attributes: {},
	scripts: {},
	objects: [],
	commands: [],
	exits: [],
	regexes: {},
};