/* jshint quotmark: single */

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
})();