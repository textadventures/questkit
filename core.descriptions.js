/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.showLocationDescription = function () {
		// TODO: Customisable description order
		// TODO: Darkness
		// TODO: Option to not use "You are in"

		var povParent = questkit.povParent();
		var descprefix = get(povParent, 'descprefix') || questkit.template('YouAreIn');

		msg(descprefix + ' ' + questkit.displayName(povParent) + '.');
	};

	questkit.displayName = function (object) {
		var prefix = get(object, 'prefix') || questkit.defaultPrefix(object);
		var suffix = get(object, 'suffix');
		var result = questkit.displayAlias(object);
		if (prefix) result = prefix + ' ' + result;
		if (suffix) result = result + ' ' + suffix;
		return result;
	};

	questkit.prefix = function (object) {

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