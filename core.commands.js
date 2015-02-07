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

		if (get(object, 'take')) {
			set(object, 'parent', get('pov'));
			msg(questkit.template('TakeSuccessful').format(questkit.objectPronoun(object)));
			return;
		}

		msg(questkit.template('TakeUnsuccessful').format(questkit.objectPronoun(object)));
	};
})();