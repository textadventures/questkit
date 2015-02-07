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
};