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

	questkit.take = function (object) {
		// TODO: Full conversion

		var it = questkit.objectPronoun(object);

		if (get(object, 'parent') == get('pov')) {
			msg(questkit.template('AlreadyTaken').format(it));
			return;
		}

		if (get(object, 'take')) {
			set(object, 'parent', get('pov'));
			msg(questkit.template('TakeSuccessful').format(it));
			return;
		}

		msg(questkit.template('TakeUnsuccessful').format(it));
	};

	questkit.drop = function (object) {
		// TODO: Full conversion

		var it = questkit.objectPronoun(object);

		if (questkit.scopeInventory().indexOf(object) == -1) {
			msg(questkit.template('NotCarrying').format(it));
			return;
		}

		if (get(object, 'drop') !== false) {
			set(object, 'parent', questkit.povParent());
			msg(questkit.template('DropSuccessful').format(it));
			return;
		}

		msg(questkit.template('DropUnsuccessful').format(it));
	};	
})();