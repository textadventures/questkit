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
		var youCanSee = formatObjectList(
			get(povParent, 'objectslistprefix') || questkit.template('SeeListHeader'),
			questkit.getNonTransparentParent(povParent),
			questkit.template('And'),
			'.'
		);
		if (youCanSee) msg(youCanSee);
	};

	questkit.displayName = function (object) {
		var prefix = get(object, 'prefix') || questkit.defaultPrefix(object);
		var suffix = get(object, 'suffix');
		var result = questkit.displayAlias(object);
		if (prefix) result = prefix + ' ' + result;
		if (suffix) result = result + ' ' + suffix;
		return result;
	};

	var formatObjectList = function (preList, parent, preFinal, postList) {
		var result = [];

		var list = removeSceneryObjects(questkit.getDirectChildren(parent));
		
		list.forEach(function (item, index) {
			if (result.length === 0) result.push(preList, ' ');
			result.push(questkit.displayName(item));
			// TODO: If item is transparent, add contained items
			if (index === list.length - 2) {
				result.push(' ', preFinal, ' ');
			}
			else if (index < list.length - 1) {
				result.push(', ');
			}
			else {
				result.push(postList);
			}
		});

		return result.join('');
	};

	var removeSceneryObjects = function (list) {
		var pov = get('pov');
		return list.filter(function (item) {
			return !get(item, 'scenery') && item !== pov;
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