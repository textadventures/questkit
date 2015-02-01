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

		var parserContext = get('~parserContext');
		if (parserContext) {
			if (parserContext.options && !isNaN(input)) {
				finishDisambiguation(input);
				return;
			}
		}

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
		if (world.regexes[command].groups.length > 0) {
			var args = match.slice(0);
			args.shift();
			var parserContext = {
				command: command,
				args: args,
				nextArgIndex: 0
			};
			set('~parserContext', parserContext);
			resolveNextName();
		}
		else {
			world.scripts[command + '.action']();
		}
	};

	var resolveNextName = function () {
		var parserContext = get('~parserContext');
		var index = parserContext.nextArgIndex;
		var command = parserContext.command;
		var group = world.regexes[command].groups[index];
		var args = parserContext.args;

		// TODO: resolve exits

		if (group.indexOf('object') === 0) {
			// Resolve object name

			var result = resolveName(args[index], questkit.scopeVisible());

			if (result.resolved) {
				args[index] = result.value;
			}
			else if (result.pending) {
				startDisambiguation(args[index], result.value);
				return;
			}
			else {
				set('~parserContext', null);
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

		finishedResolvingName();
	};

	var finishedResolvingName = function () {
		var parserContext = get('~parserContext');
		var command = parserContext.command;
		var args = parserContext.args;

		parserContext.nextArgIndex++;
		if (parserContext.nextArgIndex < world.regexes[command].groups.length) {
			set('~parserContext', parserContext);
			resolveNextName();
		}
		else {
			set('~parserContext', null);
			world.scripts[command + '.action'].apply(this, args);
		}
	};

	var resolveName = function (name, scope) {
		// TODO: lists (e.g. "take all")
		// TODO: command metadata for non-disambiguating hyperlinks

		var fullMatches = [];
		var partialMatches = [];

		var result;
		var resolved = false;
		var pending = false;
		name = name.toLowerCase();
		
		scope.forEach(function (object) {
			compareNames(name, displayAlias(object).toLowerCase(), object, fullMatches, partialMatches);
			var alt = get(object, 'alt');
			if (alt) {
				alt.forEach(function (altName) {
					compareNames(name, altName.toLowerCase(), object, fullMatches, partialMatches);
				});
			}
		});

		if (fullMatches.length === 1) {
			resolved = true;
			result = fullMatches[0];
		}
		else if (fullMatches.length === 0 && partialMatches.length === 1) {
			resolved = true;
			result = partialMatches[0];
		}
		else if (fullMatches.length > 0 || partialMatches.length > 0) {
			pending = true;
			result = fullMatches.concat(partialMatches);
		}

		return {
			resolved: resolved,
			pending: pending,
			value: result
		};
	};

	var displayAlias = function (object) {
		var alias = get(object, 'alias');
		if (alias) return alias;
		return object;
	};

	var compareNames = function (enteredName, nameCandidate, object, fullMatches, partialMatches) {
		if (enteredName === nameCandidate) {
			if (fullMatches.indexOf(object) === -1) {
				fullMatches.push(object);
			}
			return;
		}

		// if any word of the name candidate starts with the entered name,
		// add it as a partial match
		if (nameCandidate.indexOf(enteredName) === 0 || nameCandidate.indexOf(' ' + enteredName) > -1) {
			if (partialMatches.indexOf(object) === -1) {
				partialMatches.push(object);
			}
			return;
		}
	};

	var startDisambiguation = function (name, options) {
		var parserContext = get('~parserContext');
		parserContext.options = options;
		set('~parserContext', parserContext);

		// TODO: Show name in template
		msg(questkit.template('DisambiguateMenu'));
		msg('');
		options.forEach(function (option, index) {
			msg(index + ': ' + displayAlias(option));
		});
	};

	var finishDisambiguation = function (index) {
		var parserContext = get('~parserContext');
		parserContext.args[parserContext.nextArgIndex] = parserContext.options[index];
		parserContext.options = null;
		set('~parserContext', parserContext);
		finishedResolvingName();
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