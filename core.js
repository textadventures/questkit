if (typeof Quest === "undefined") Quest = {};

(function () {
	var world = {
		attributes: {}
	};

	Quest.Init = function(data) {
		world.scripts = data.scripts || {};
		world.objects = data.objects || [];
		world.commands = data.commands || [];
		world.exits = data.exits || [];
		world.regexes = data.regexes || {};
		world.templates = data.templates || {};
	};

	function povParent() {
		return get(get("pov"), "parent");
	}

	Quest.HandleCommand = function(input) {
		// TODO: Full conversion
		Quest.ScopeCommands().forEach(function(cmd) {
			world.regexes[cmd].patterns.forEach(function(pattern) {
				var match = pattern.exec(input);
				if (match) {
					var args = match.slice(0);
					args.shift();
					var resolved = true;
					world.regexes[cmd].groups.forEach(function(group, index) {
						if (group.indexOf("object") != 0) return;
						// Resolve object name

						var check = args[index].toLowerCase();
						var found = false;

						Quest.ScopeVisible().forEach(function(object) {
							if (object.toLowerCase() == check) {
								args[index] = object;
								found = true;
								return;
							}
						});
						// TODO: Handle aliases, disambiguation etc...

						if (!found) {
							resolved = false;
							return;
						} 
					});
					if (resolved) {
						world.scripts[cmd + ".action"].apply(this, args);
					}
					else {
						msg(Quest.Template("UnresolvedObject"));
					}
				}
			});
		});
	};

	Quest.ScopeCommands = function() {
		var result = [];
		var currentPovParent = povParent();
		world.commands.forEach(function(cmd) {
			var parent = get(cmd, "parent");
			if (!parent || parent == currentPovParent) {
				result.push(cmd);
			}
		});
		return result;
	};

	Quest.ScopeVisible = function() {
		return Quest.ScopeVisibleNotHeld().concat(Quest.ScopeInventory());
	};

	Quest.ScopeVisibleNotHeld = function() {
		return Quest.ScopeReachableNotHeldForLocation(povParent()).concat(Quest.ScopeVisibleNotReachableForLocation(povParent()));
	};

	Quest.ScopeReachableNotHeldForLocation = function(location) {
		var result = [];
		var pov = get("pov");
		Quest.GetAllChildObjects(location).forEach(function(object) {
			if (Quest.ContainsReachable(location, object) && object != pov && !Quest.Contains(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	Quest.GetAllChildObjects = function(object) {
		// TODO: Cache direct children of each object
		var result = [];
		world.objects.forEach(function(child) {
			if (get(child, "parent") == object) {
				result.push(child);
				result = result.concat(Quest.GetAllChildObjects(child));
			}
		});
		return result;
	};

	Quest.ContainsVisible = function(parent, search) {
		return containsAccessible(parent, search, false);
	};

	Quest.ContainsReachable = function(parent, search) {
		return containsAccessible(parent, search, true);
	};

	function containsAccessible(parent, search, onlyReachable) {
		var searchParent = get(search, "parent");
		if (!searchParent) return false;
		if (get(search, "visible") == false) return false;
		if (get(parent, "darklevel") && !get(search, "lightsource")) return false;
		if (searchParent == parent) return true;
		
		var canAdd;
		if (onlyReachable) {
			canAdd = Quest.CanReachThrough(searchParent);
		}
		else {
			canAdd = Quest.CanSeeThrough(searchParent);
		}

		if (canAdd) {
			return (Quest.ContainsAccessible(parent, searchParent, onlyReachable));
		} else {
			return false;
		}
	}

	Quest.CanSeeThrough = function(object) {
		return (get(object, "transparent") || Quest.CanReachThrough(object)) && !get(object, "hidechildren");
	};

	Quest.CanReachThrough = function(object) {
		return get(object, "isopen") && !get(object, "hidechildren");
	};

	Quest.Contains = function(parent, search) {
		var searchParent = get(search, "parent");
		if (!searchParent) return false;
		if (searchParent == parent) return true;
		return Quest.Contains(parent, searchParent);
	};

	Quest.ScopeVisibleNotReachableForLocation = function(location) {
		// TODO
		return [];
	};

	Quest.ScopeInventory = function() {
		var result = [];
		var pov = get("pov");
		Quest.GetAllChildObjects(pov).forEach(function(object) {
			if (Quest.ContainsVisible(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	Quest.GoDirection = function(direction) {
		// TODO: Locked exits, exits with scripts, non-directional exits
		var foundExit;
		Quest.ScopeExits().forEach(function(exit) {
			if (get(exit, "direction") == direction) {
				foundExit = exit;
				return;
			}
		});

		if (!foundExit) {
			msg(Quest.Template("UnresolvedLocation"));
			return;
		}

		set(get("pov"), "parent", get(foundExit, "to"));		
	};

	Quest.ScopeExits = function() {
		return Quest.ScopeExitsForLocation(povParent());
	};

	Quest.ScopeExitsForLocation = function(location) {
		var result = [];
		world.exits.forEach(function(exit) {
			if (get(exit, "parent") != location) return;
			if (get(exit, "visible") == false) return;
			if (get(location, "darklevel") && !get(exit, "lightsource")) return;
		  	result.push(exit);
		});
		return result;
	};

	Quest.Template = function(template) {
		return world.templates[template];
	};

	// Quest script commmands =====================================================

	Quest.get = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + "." + arg2;
		}
		return world.attributes[attribute];
	}

	Quest.set = function (arg1, arg2, arg3) {
		var attribute = arg1;
		var value = arg2;
		if (arg3) {
			attribute = arg1 + "." + arg2;
			value = arg3;
		}
		world.attributes[attribute] = value;
	};

	Quest.getscript = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + "." + arg2;
		}
		return world.scripts[attribute];
	};

	Quest.msg = function (text) {
		Quest.UI.addText(text);
	};
})();

function get(arg1, arg2) {
	return Quest.get(arg1, arg2);
}

function set(arg1, arg2, arg3) {
	return Quest.set(arg1, arg2, arg3);
}

function getscript(arg1, arg2) {
	return Quest.getscript(arg1, arg2);
}

function msg(text) {
	return Quest.msg(text);
}

var initData = {
	attributes: {},
	scripts: {},
	objects: [],
	commands: [],
	exits: [],
	regexes: {},
};