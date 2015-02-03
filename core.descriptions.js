/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.showLocationDescription = function () {
		var povParent = questkit.povParent();

		msg('You are in ' + povParent);
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
})();