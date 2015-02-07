/* jshint quotmark: single */

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
})();