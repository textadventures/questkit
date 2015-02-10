// Created with QuestKit 6.0.0-alpha.5
// https://github.com/textadventures/questkit

(function ($) {
/* jshint quotmark: single */

var questkit = {};
questkit.ui = {};

String.prototype.format = function () {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function (match, number) { 
	  return typeof args[number] != 'undefined' ? args[number] : match;
	});
};

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
		world.walkthroughs = data.walkthroughs || {};

		questkit.initPov();
		questkit.startLocation();
		questkit.ui.init();
	};

	questkit.povParent = function () {
		return get(get('pov'), 'parent');
	};

	questkit.allObjects = function () {
		return world.objects;
	};

	questkit.allCommands = function () {
		return world.commands;
	};

	questkit.allExits = function () {
		return world.exits;
	};

	questkit.allWalkthroughs = function () {
		return world.walkthroughs;
	};

	questkit.commandRegex = function (command) {
		return world.regexes[command];
	};

	questkit.displayAlias = function (object) {
		var alias = get(object, 'alias');
		if (alias) return alias;
		return object;
	};

	questkit.subjectPronoun = function (object) {
		return get(object, 'subjectpronoun') || questkit.defaultSubjectPronoun(object);
	};

	questkit.objectPronoun = function (object) {
		return get(object, 'objectpronoun') || questkit.defaultObjectPronoun(object);
	};

	questkit.template = function (template) {
		return world.templates[template];
	};

	questkit.get = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + '.' + arg2;
		}
		var value = world.attributes[attribute];
		if (value === undefined) return null;
		return JSON.parse(value);
	};

	questkit.set = function (arg1, arg2, arg3, isUndoing) {
		var attribute = arg1;
		var value = arg2;
		if (arg3) {
			attribute = arg1 + '.' + arg2;
			value = arg3;
		}
		if (!isUndoing) logOldValue(attribute);
		world.attributes[attribute] = JSON.stringify(value);
	};

	questkit.startTransaction = function (command) {
		var current = get('~undo.current') || 0;
		current++;
		set('~undo.current', current);
		set('~undo', 'log' + current, {});
		set('~undo', 'command' + current, command);
	};

	var logOldValue = function (attribute) {
		if (attribute.indexOf('~undo.') === 0) return;
		var current = get('~undo.current');
		if (!current) return;
		var log = get('~undo', 'log' + current);
		if (attribute in log) return;
		log[attribute] = get(attribute);
		set('~undo', 'log' + current, log);
	};

	questkit.undo = function () {
		var current = get('~undo.current') || 0;
		if (!current) {
			msg(questkit.template('NothingToUndo'));
			return;
		}
		var log = get('~undo', 'log' + current);
		msg(questkit.template('UndoTurn').format(get('~undo', 'command' + current)));
		for (var attribute in log) {
			set(attribute, log[attribute], null, true);
		}
		current--;
		set('~undo.current', current);
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

	questkit.initPov = function (oldPov) {
		if (oldPov) {
			set(oldPov, 'alias', get(oldPov, 'externalalias'));
			set(oldPov, 'alt', get(oldPov, 'externalalt'));
			set(oldPov, 'look', get(oldPov, 'externallook'));
		}

		var pov = get('pov');

		set(pov, 'externalalias', get(pov, 'alias'));
		set(pov, 'externalalt', get(pov, 'alt'));
		set(pov, 'externallook', get(pov, 'look'));

		set(pov, 'alias', get(pov, 'povalias'));
		set(pov, 'alt', get(pov, 'povalt'));
		set(pov, 'look', get(pov, 'povlook'));
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
	walkthroughs: [],
};/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.scopeCommands = function () {
		var result = [];
		var povParent = questkit.povParent();
		questkit.allCommands().forEach(function (cmd) {
			var parent = get(cmd, 'parent');
			if (!parent || parent == povParent) {
				result.push(cmd);
			}
		});
		return result;
	};

	questkit.scopeVisible = function () {
		return questkit.scopeVisibleNotHeld().concat(questkit.scopeInventory());
	};

	questkit.scopeVisibleNotHeld = function () {
		var povParent = questkit.povParent();
		return questkit.scopeReachableNotHeldForLocation(povParent).concat(questkit.scopeVisibleNotReachableForLocation(povParent));
	};

	questkit.scopeReachableNotHeldForLocation = function (location) {
		var result = [];
		var pov = get('pov');
		questkit.getAllChildObjects(location).forEach(function (object) {
			if (questkit.containsReachable(location, object) && object != pov && !questkit.contains(pov, object)) {
				result.push(object);
			}
		});
		if (location == get(pov, 'parent')) {
			result.push(pov);
		}
		return result;
	};

	var getChildObjects = function (object, recurse) {
		var result = [];
		questkit.allObjects().forEach(function (child) {
			if (get(child, 'parent') == object) {
				result.push(child);
				if (recurse) result = result.concat(getChildObjects(child, true));
			}
		});
		return result;
	};

	questkit.getAllChildObjects = function (object) {
		return getChildObjects(object, true);
	};

	questkit.getDirectChildren = function (object) {
		return getChildObjects(object, false);
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

	questkit.scopeExits = function () {
		return questkit.scopeExitsForLocation(questkit.povParent());
	};

	questkit.scopeExitsForLocation = function (location) {
		var result = [];
		questkit.allExits().forEach(function (exit) {
			if (get(exit, 'parent') != location) return;
			if (get(exit, 'visible') === false) return;
			if (get(location, 'darklevel') && !get(exit, 'lightsource')) return;
			result.push(exit);
		});
		return result;
	};

	questkit.getNonTransparentParent = function (object) {
		if (get(object, 'transparent')) {
			var parent = get(object, 'parent');
			if (parent) return questkit.getNonTransparentParent(parent);
		}
		return object;
	};
})();/* jshint quotmark: single */

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
	};

	questkit.handleCommand = function (input) {
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

					if (matchStrength > maxStrength || (command && !get(command, 'parent') && get(cmd, 'parent'))) {
						maxStrength = matchStrength;
						command = cmd;
						bestMatch = match;
					}
				}
			});
		});

		if (maxStrength > -1) {
			handleCommandPattern(input, command, bestMatch);
		}
		else {
			// TODO: Use game.unresolvedcommandhandler if it exists?
			msg(questkit.template('UnrecognisedCommand'));
		}
	};

	var handleCommandPattern = function (input, command, match) {
		if (questkit.commandRegex(command).groups.length > 0) {
			var args = match.slice(0);
			args.shift();
			var parserContext = {
				command: command,
				args: args,
				nextArgIndex: 0,
				input: input
			};
			set('~parserContext', parserContext);
			resolveNextName();
		}
		else {
			runCommand(input, command);
		}
	};

	var resolveNextName = function () {
		var parserContext = get('~parserContext');
		var index = parserContext.nextArgIndex;
		var command = parserContext.command;
		var group = questkit.commandRegex(command).groups[index];
		var args = parserContext.args;

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
			var result;
			if (getscript(command, 'multiple')) {				
				result = resolveNameList(args[index], resolveScope, command);
			}
			else {
				result = resolveName(args[index], resolveScope);
			}

			if (result.resolved) {
				args[index] = result.value;
				set('~parserContext', parserContext);
			}
			else if (result.pending) {
				startDisambiguation(args[index], result.value);
				return;
			}
			else {
				set('~parserContext', null);
				if (questkit.commandRegex(command).groups.length > 1) {
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
			runCommand(parserContext.input, command, args);
		}
	};

	var resolveName = function (name, scope) {
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

	var resolveNameList = function (value, scope, command) {
		if (questkit.template('AllObjects').indexOf(value) !== -1) {
			return {
				resolved: true,
				pending: false,
				value: getscript(command, 'multiple')()
			};
		}

		var result = resolveName(value, scope);
		result.value = [result.value];
		return result;
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

	var runCommand = function (input, command, args) {
		set('~parserContext', null);
		if (!get(command, 'isundo')) {
			questkit.startTransaction(input);
		}
		questkit.getscript(command + '.action').apply(this, args);
	};

	questkit.runWalkthrough = function (walkthrough) {
		var steps = get(walkthrough, 'steps');
		for (var i = 0; i < steps.length; i++) {
			var step = steps[i];
			msg('');
			if (!step.assert) {
				msg('* ' + step);
				questkit.handleCommand(step);
			}
			else {
				msg('? ' + step.assert);
				if (!getscript(step.script)()) {
					msg('FAILURE');
					return;
				}
				msg('OK');
			}
		}
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
})();/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.showLocationDescription = function () {
		// TODO: Customisable description order
		// TODO: Darkness
		// TODO: Option to not use "You are in"

		var povParent = questkit.povParent();
		
		var descprefix = get(povParent, 'descprefix') || questkit.template('YouAreIn');
		msg(descprefix + ' ' + displayName(povParent, true) + '.');
		
		var objects = questkit.removeSceneryObjects(questkit.getDirectChildren(questkit.getNonTransparentParent(povParent)));
		var youCanSee = questkit.formatList(
			get(povParent, 'objectslistprefix') || questkit.template('SeeListHeader'),
			objects,
			questkit.template('And'),
			true
		);
		if (youCanSee) msg(youCanSee);

		var youCanGo = questkit.formatList(
			get(povParent, 'exitslistprefix') || questkit.template('GoListHeader'),
			questkit.removeSceneryExits(questkit.scopeExits()),
			questkit.template('Or'),
			false
		);
		if (youCanGo) msg(youCanGo);

		var description = get(povParent, 'description');
		if (description) msg(description);
	};

	var displayName = function (object, useDefaultPrefix) {
		var prefix = get(object, 'prefix') || (useDefaultPrefix ? questkit.defaultPrefix(object) : null);
		var suffix = get(object, 'suffix');
		var result = questkit.displayAlias(object);
		if (prefix) result = prefix + ' ' + result;
		if (suffix) result = result + ' ' + suffix;
		return result;
	};

	var formatObjectList = function (preList, parent, preFinal) {
		var list = questkit.removeSceneryObjects(questkit.getDirectChildren(parent));
		return questkit.formatList(preList, list, preFinal, true);
	};

	questkit.formatList = function (preList, list, preFinal, useDefaultPrefix) {
		var result = [];

		list.forEach(function (item, index) {
			if (result.length === 0) result.push(preList, ' ');
			result.push(displayName(item, useDefaultPrefix));

			if (index === list.length - 2) {
				result.push(' ', preFinal, ' ');
			}
			else if (index < list.length - 1) {
				result.push(', ');
			}
			else {
				result.push('.');
			}
		});

		return result.join('');
	};

	questkit.removeSceneryObjects = function (list) {
		var pov = get('pov');
		return list.filter(function (item) {
			return !get(item, 'scenery') && item !== pov;
		});
	};

	questkit.removeSceneryExits = function (list) {
		return list.filter(function (item) {
			return !get(item, 'scenery');
		});
	};

	questkit.go = function (location) {
		var oldLocation = questkit.povParent();
		set(get('pov'), 'parent', location);
		questkit.startLocation(oldLocation);
	};

	questkit.startLocation = function (oldLocation) {
		// TODO: Run "on entering location", "on exiting previous location" scripts etc.
		questkit.showLocationDescription();
	};
})();/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.goDirection = function (direction) {
		// TODO: Locked exits, exits with scripts
		var foundExit;
		questkit.scopeExits().forEach(function (exit) {
			if (get(exit, 'direction') == direction) {
				foundExit = exit;
				return;
			}
		});

		if (!foundExit) {
			msg(questkit.template('UnresolvedDirection'));
			return;
		}

		questkit.goToExit(foundExit);
	};

	questkit.goToExit = function (exit) {
		// TODO: Locked exits, exits with scripts
		questkit.go(get(exit, 'to'));
	};

	questkit.take = function (objects) {
		objects.forEach(function (object) {
			take(object, objects.length > 1);
		});
	};

	var take = function (object, showName) {
		// TODO: Full conversion

		var template;
		var it = questkit.objectPronoun(object);

		if (get(object, 'parent') == get('pov')) {
			template = 'AlreadyTaken';
		}
		else if (get(object, 'take')) {
			set(object, 'parent', get('pov'));
			template = 'TakeSuccessful';
		}
		else {
			template = 'TakeUnsuccessful';	
		}

		msg ((showName ? questkit.displayAlias(object) + ': ' : '') + questkit.template(template).format(it));
	};

	questkit.drop = function (objects) {
		objects.forEach(function (object) {
			drop(object, objects.length > 1);
		});
	};

	var drop = function (object, showName) {
		// TODO: Full conversion

		var template;
		var it = questkit.objectPronoun(object);

		if (questkit.scopeInventory().indexOf(object) == -1) {
			template = 'NotCarrying';
		}
		else if (get(object, 'drop') !== false) {
			set(object, 'parent', questkit.povParent());
			template = 'DropSuccessful';
		}
		else {
			template = 'DropUnsuccessful';
		}

		msg ((showName ? questkit.displayAlias(object) + ': ' : '') + questkit.template(template).format(it));
	};
})();/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.defaultPrefix = function (object) {
		if (get(object, 'plural')) return 'some';
		var displayAlias = questkit.displayAlias(object);
		if ('aeiou'.indexOf(displayAlias.substr(0, 1)) >= 0) {
			return 'an';
		}
		return 'a';
	};

	questkit.defaultSubjectPronoun = function (object) {
		if (object === get('pov')) return 'you';
		if (get(object, 'plural')) return 'they';
		var gender = get(object, 'gender');
		if (gender === 'male') {
			return 'he';
		}
		if (gender === 'female') {
			return 'she';
		}
		return 'it';
	};

	questkit.defaultObjectPronoun = function (object) {
		if (object === get('pov')) return 'yourself';
		if (get(object, 'plural')) return 'them';
		var gender = get(object, 'gender');
		if (gender === 'male') {
			return 'him';
		}
		if (gender === 'female') {
			return 'her';
		}
		return 'it';
	};
})();
/* jshint quotmark: single */

(function () {
	'use strict';

	var currentDiv = null;
	var outputSections = [];
	var divCount = -1;
	var beginningOfCurrentTurnScrollPosition = 0;
	
	questkit.ui.addText = function (text) {
		if (getCurrentDiv() === null) {
			createNewDiv('left');
		}

		questkit.ui.output
			.append(text + '<br/>')
			.css('min-height', questkit.ui.output.height());
	};

	var createNewDiv = function (alignment) {
		var classes = outputSections.join(' ');
		setDivCount(getDivCount() + 1);
		$('<div/>', {
			id: 'questkit-output-section' + getDivCount(),
			style: 'text-align: ' + alignment,
			'class': classes
		}).appendTo(questkit.ui.output);
		setCurrentDiv('#questkit-output-section' + getDivCount());
	};

	var getCurrentDiv = function () {
		if (currentDiv) return currentDiv;

		var divId = questkit.get('~ui.divid');
		if (divId) {
			currentDiv = $(divId);
			return currentDiv;
		}

		return null;
	};

	var setCurrentDiv = function (div) {
		currentDiv = $(div);
		questkit.set('~ui.divid', div);
	};

	var getDivCount = function () {
		if (divCount == -1) {
			divCount = questkit.get('~ui.divcount') || 0;
		}
		return divCount;
	};

	var setDivCount = function (count) {
		divCount = count;
		questkit.set('~ui.divcount', divCount);
	};

	questkit.ui.scrollToEnd = function () {
		var scrollTo, currentScrollTop, distance, duration;
		if (questkit.ui.settings.scroll === 'element') {
			scrollTo = questkit.ui.output[0].scrollHeight - questkit.ui.output.height();
			currentScrollTop = questkit.ui.output.scrollTop();
			if (scrollTo > currentScrollTop) {
				distance = scrollTo - currentScrollTop;
				duration = distance / 0.4;
				// TODO: 'easeInOutCubic' is nice here
				questkit.ui.output.stop().animate({	scrollTop: scrollTo }, duration);
			}
		}
		else {
			scrollTo = beginningOfCurrentTurnScrollPosition;
			currentScrollTop = Math.max($('body').scrollTop(), $('html').scrollTop());
			if (scrollTo > currentScrollTop) {
				var maxScrollTop = $(document).height() - $(window).height();
				if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
				distance = scrollTo - currentScrollTop;
				duration = distance / 0.4;
				// TODO: 'easeInOutCubic' is nice here
				$('body,html').stop().animate({ scrollTop: scrollTo }, duration);
			}
		}
		questkit.ui.input.focus();
	};

	questkit.ui.markScrollPosition = function () {
		beginningOfCurrentTurnScrollPosition = questkit.ui.output.height();
	};

	questkit.ui.escapeString = function (str) {
		return str.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	questkit.ui.init = function () {
	};

})();

$.fn.questkit = function (options) {
	var settings = $.extend({
        scroll: 'body'
    }, options);

    questkit.ui.output = this;
    questkit.ui.settings = settings;
    questkit.ui.input = $(settings.input);
	questkit.ui.input.focus();
	questkit.ui.input.keydown(function (e) {
		if (e.which != 13) return;
		var input = $(this).val();
		$(this).val('');
		questkit.ui.markScrollPosition();
		msg('');
		msg(questkit.ui.escapeString('> ' + input));
		questkit.handleCommand(input);
		questkit.ui.scrollToEnd();
	});

	if (settings.scroll === 'element') {
		questkit.ui.output.css('overflow-y', 'auto');
	}

	questkit.ready();
    
    return this;
};

set('title', "QuestKit demo");
set('pov', "player");

initData.objects.push('room');
set('room.description', "This is a simple example of a room in QuestKit.");

initData.exits.push('~0');
set('~0.parent', "room");
set('~0.direction', "south");
set('~0.alias', "south");
set('~0.to', "another room");

initData.exits.push('~1');
set('~1.parent', "another room");
set('~1.direction', "north");
set('~1.alias', "north");
set('~1.to', "room");

initData.objects.push('book');
set('book.look', "This is an object. You can pick me up and drop me somewhere else.");
set('book.take', true);
set('book.parent', "room");

initData.objects.push('another room');
set('another room.description', "This is another room.");

initData.commands.push('drop');
initData.regexes['drop'] = {
	patterns: [/^drop (.*?)$/],
	groups: ["objects"]
};
initData.scripts['drop.action'] = function (objects) {
	questkit.drop(objects);
};
initData.scripts['drop.multiple'] = function () {
	return questkit.getDirectChildren(get('pov'));
};

initData.commands.push('gonorth');
initData.regexes['gonorth'] = {
	patterns: [/^go north$/, /^go to north$/, /^north$/, /^n$/],
	groups: []
};
initData.scripts['gonorth.action'] = function () {
	questkit.goDirection('north');
};

initData.commands.push('gosouth');
initData.regexes['gosouth'] = {
	patterns: [/^go south$/, /^go to south$/, /^south$/, /^s$/],
	groups: []
};
initData.scripts['gosouth.action'] = function () {
	questkit.goDirection('south');
};

initData.commands.push('goeast');
initData.regexes['goeast'] = {
	patterns: [/^go east$/, /^go to east$/, /^east$/, /^e$/],
	groups: []
};
initData.scripts['goeast.action'] = function () {
	questkit.goDirection('east');
};

initData.commands.push('gowest');
initData.regexes['gowest'] = {
	patterns: [/^go west$/, /^go to west$/, /^west$/, /^w$/],
	groups: []
};
initData.scripts['gowest.action'] = function () {
	questkit.goDirection('west');
};

initData.commands.push('gonortheast');
initData.regexes['gonortheast'] = {
	patterns: [/^go northeast$/, /^go to northeast$/, /^northeast$/, /^ne$/],
	groups: []
};
initData.scripts['gonortheast.action'] = function () {
	questkit.goDirection('northeast');
};

initData.commands.push('gosoutheast');
initData.regexes['gosoutheast'] = {
	patterns: [/^go southeast$/, /^go to southeast$/, /^southeast$/, /^se$/],
	groups: []
};
initData.scripts['gosoutheast.action'] = function () {
	questkit.goDirection('southeast');
};

initData.commands.push('gosouthwest');
initData.regexes['gosouthwest'] = {
	patterns: [/^go southwest$/, /^go to southwest$/, /^southwest$/, /^sw$/],
	groups: []
};
initData.scripts['gosouthwest.action'] = function () {
	questkit.goDirection('southwest');
};

initData.commands.push('gonorthwest');
initData.regexes['gonorthwest'] = {
	patterns: [/^go northwest$/, /^go to northwest$/, /^northwest$/, /^nw$/],
	groups: []
};
initData.scripts['gonorthwest.action'] = function () {
	questkit.goDirection('northwest');
};

initData.commands.push('goin');
initData.regexes['goin'] = {
	patterns: [/^go in$/, /^in$/],
	groups: []
};
initData.scripts['goin.action'] = function () {
	questkit.goDirection('in');
};

initData.commands.push('goout');
initData.regexes['goout'] = {
	patterns: [/^go out$/, /^out$/, /^o$/],
	groups: []
};
initData.scripts['goout.action'] = function () {
	questkit.goDirection('out');
};

initData.commands.push('goup');
initData.regexes['goup'] = {
	patterns: [/^go up$/, /^up$/, /^u$/],
	groups: []
};
initData.scripts['goup.action'] = function () {
	questkit.goDirection('up');
};

initData.commands.push('godown');
initData.regexes['godown'] = {
	patterns: [/^go down$/, /^down$/, /^d$/],
	groups: []
};
initData.scripts['godown.action'] = function () {
	questkit.goDirection('down');
};

initData.commands.push('goto');
initData.regexes['goto'] = {
	patterns: [/^go (.*?)$/, /^go to (.*?)$/],
	groups: ["exit"]
};
initData.scripts['goto.action'] = function (exit) {
	questkit.goToExit(exit)
};

initData.commands.push('inventory');
initData.regexes['inventory'] = {
	patterns: [/^i$/, /^inv$/, /^inventory$/],
	groups: []
};
initData.scripts['inventory.action'] = function () {
	var list = questkit.scopeInventory();
	if (list.length == 0) {
	    msg(questkit.template('NotCarryingAnything'));
	    return;
	}
	msg(questkit.formatList(questkit.template('CarryingListHeader'), list, questkit.template('And'), true));
};

initData.commands.push('listwalkthroughs');
initData.regexes['listwalkthroughs'] = {
	patterns: [/^run$/],
	groups: []
};
initData.scripts['listwalkthroughs.action'] = function () {
	questkit.listWalkthroughs();
};

initData.commands.push('look');
initData.regexes['look'] = {
	patterns: [/^look$/, /^l$/],
	groups: []
};
initData.scripts['look.action'] = function () {
	questkit.showLocationDescription();
};

initData.commands.push('lookat');
initData.regexes['lookat'] = {
	patterns: [/^look at (.*?)$/, /^x (.*?)$/, /^examine (.*?)$/, /^exam (.*?)$/, /^ex (.*?)$/],
	groups: ["object"]
};
initData.scripts['lookat.action'] = function (object) {
	var found = false;
	var text = get(object, 'look');
	if (text) {
	    msg(text);
	    found = true;
	}
	var script = getscript(object, 'look');
	if (script) {
	    script();
	    found = true;
	}
	if (!found) {
	    msg(questkit.template('DefaultObjectDescription'));
	}
};

initData.commands.push('take');
initData.regexes['take'] = {
	patterns: [/^take (.*?)$/, /^get (.*?)$/, /^pick up (.*?)$/],
	groups: ["objects"]
};
initData.scripts['take.action'] = function (objects) {
	questkit.take(objects);
};
initData.scripts['take.multiple'] = function () {
	return questkit.removeSceneryObjects(questkit.getDirectChildren(questkit.povParent()));
};

initData.commands.push('walkthrough');
initData.regexes['walkthrough'] = {
	patterns: [/^run (.*?)$/],
	groups: ["walkthrough"]
};
initData.scripts['walkthrough.action'] = function (walkthrough) {
	questkit.runWalkthrough(walkthrough);
};

initData.commands.push('undo');
initData.regexes['undo'] = {
	patterns: [/^undo$/],
	groups: []
};
initData.scripts['undo.action'] = function () {
	questkit.undo();
};
set('undo.isundo', true);

initData.objects.push('player');
set('player.parent', "room");
set('player.look', "Looking good.");
set('player.povalias', "me");
set('player.povalt', ["myself","self"]);

initData.templates = {
	"AllObjects": [
		"all",
		"everything"
	],
	"AlreadyTaken": "You are already carrying {0}.",
	"And": "and",
	"CarryingListHeader": "You are carrying",
	"ChooseWalkthrough": "Choose a walkthrough",
	"DefaultObjectDescription": "Nothing out of the ordinary.",
	"DefaultSelfDescription": "Looking good.",
	"DisambiguateMenu": "Please choose which \"{0}\" you mean",
	"DropSuccessful": "You drop {0}.",
	"DropUnsuccessful": "You can't drop {0}.",
	"GoListHeader": "You can go",
	"NotCarrying": "You are not carrying {0}.",
	"NotCarryingAnything": "You are not carrying anything.",
	"NothingToUndo": "Nothing to undo!",
	"Or": "or",
	"SeeListHeader": "You can see",
	"SelfAlias": "me",
	"SelfAlt": [
		"myself",
		"self"
	],
	"TakeSuccessful": "You pick {0} up.",
	"TakeUnsuccessful": "You can't take {0}.",
	"UndoTurn": "Undo: {0}",
	"UnrecognisedCommand": "I don't understand your command.",
	"UnresolvedDirection": "You can't go there.",
	"UnresolvedExit": "I can't see that.",
	"UnresolvedObject": "I can't see that.",
	"UnresolvedObjectMulti": "I can't see that ({0}).",
	"UnresolvedWalkthrough": "No walkthrough of that name.",
	"YouAreIn": "You are in"
};
questkit.ready = function () { questkit.init(initData); };
}(jQuery));