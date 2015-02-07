/* jshint quotmark: single */

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
})();