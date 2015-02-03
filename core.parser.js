(function () {
	'use strict';

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
			if (parserContext.options && !isNaN(input) && input > 0 && input <= parserContext.options.length) {
				finishDisambiguation(input);
				return;
			}
		}

		var bestMatch;
		var command;
		var maxStrength = -1;

		questkit.scopeCommands().forEach(function (cmd) {
			questkit.commandRegex(cmd).patterns.forEach(function (pattern) {
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
		if (questkit.commandRegex(command).groups.length > 0) {
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
			questkit.getscript(command + '.action')();
		}
	};

	var resolveNextName = function () {
		var parserContext = get('~parserContext');
		var index = parserContext.nextArgIndex;
		var command = parserContext.command;
		var group = questkit.commandRegex(command).groups[index];
		var args = parserContext.args;

		// TODO: resolve exits

		var resolveScope = null;
		var unresolvedTemplate = null;

		if (group.indexOf('object') === 0) {
			resolveScope = questkit.scopeVisible();
			unresolvedTemplate = 'UnresolvedObject';
		}
		else if (group.indexOf('exit') === 0) {
			resolveScope = questkit.scopeExits();
			unresolvedTemplate = 'UnresolvedExit';
		}
		else if (group.indexOf('walkthrough') === 0) {
			resolveScope = questkit.allWalkthroughs();
			unresolvedTemplate = 'UnresolvedWalkthrough';
		}

		if (resolveScope) {
			// Resolve object name

			var result = resolveName(args[index], resolveScope);

			if (result.resolved) {
				args[index] = result.value;
			}
			else if (result.pending) {
				startDisambiguation(args[index], result.value);
				return;
			}
			else {
				set('~parserContext', null);
				if (questkit.commandRegex(command).groups.length > 1) {
					// TODO: Unresolved template will depend on the scope we're searching
					msg(questkit.template('UnresolvedObjectMulti').format(args[index]));
				}
				else {
					msg(questkit.template(unresolvedTemplate));
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
		if (parserContext.nextArgIndex < questkit.commandRegex(command).groups.length) {
			set('~parserContext', parserContext);
			resolveNextName();
		}
		else {
			set('~parserContext', null);
			questkit.getscript(command + '.action').apply(this, args);
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
			compareNames(name, questkit.displayAlias(object).toLowerCase(), object, fullMatches, partialMatches);
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

	var startDisambiguation = function (name, options, prompt) {
		var parserContext = get('~parserContext');
		parserContext.options = options;
		set('~parserContext', parserContext);

		if (prompt) {
			msg(prompt + ':');
		}
		else {
			msg(questkit.template('DisambiguateMenu').format(name) + ':');
		}
		msg('');
		options.forEach(function (option, index) {
			msg((index + 1) + ': ' + questkit.displayAlias(option));
		});
	};

	var finishDisambiguation = function (index) {
		var parserContext = get('~parserContext');
		parserContext.args[parserContext.nextArgIndex] = parserContext.options[index - 1];
		parserContext.options = null;
		set('~parserContext', parserContext);
		finishedResolvingName();
	};

	questkit.runWalkthrough = function (walkthrough) {
		var steps = get(walkthrough, 'steps');
		steps.forEach(function (step) {
			msg('');
			msg('* ' + step);
			questkit.handleCommand(step);
		});
	};

	questkit.listWalkthroughs = function () {
		var parserContext = {
			command: 'walkthrough',
			args: [],
			nextArgIndex: 0,
		};
		set('~parserContext', parserContext);
		startDisambiguation(null, questkit.allWalkthroughs(), questkit.template('ChooseWalkthrough'));
	};
})();