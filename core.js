if (typeof questkit === "undefined") questkit = {};

(function () {
	var world = {
		attributes: {}
	};

	questkit.Init = function(data) {
		world.scripts = data.scripts || {};
		world.objects = data.objects || [];
		world.commands = data.commands || [];
		world.exits = data.exits || [];
		world.regexes = data.regexes || {};
		world.templates = data.templates || {};
	};

	var povParent = function () {
		return get(get("pov"), "parent");
	};

	questkit.HandleCommand = function(input) {
		// TODO: Full conversion
		questkit.ScopeCommands().forEach(function(cmd) {
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

						questkit.ScopeVisible().forEach(function(object) {
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
						msg(questkit.Template("UnresolvedObject"));
					}
				}
			});
		});
	};

	questkit.ScopeCommands = function() {
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

	questkit.ScopeVisible = function() {
		return questkit.ScopeVisibleNotHeld().concat(questkit.ScopeInventory());
	};

	questkit.ScopeVisibleNotHeld = function() {
		return questkit.ScopeReachableNotHeldForLocation(povParent()).concat(questkit.ScopeVisibleNotReachableForLocation(povParent()));
	};

	questkit.ScopeReachableNotHeldForLocation = function(location) {
		var result = [];
		var pov = get("pov");
		questkit.GetAllChildObjects(location).forEach(function(object) {
			if (questkit.ContainsReachable(location, object) && object != pov && !questkit.Contains(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	questkit.GetAllChildObjects = function(object) {
		// TODO: Cache direct children of each object
		var result = [];
		world.objects.forEach(function(child) {
			if (get(child, "parent") == object) {
				result.push(child);
				result = result.concat(questkit.GetAllChildObjects(child));
			}
		});
		return result;
	};

	questkit.ContainsVisible = function(parent, search) {
		return containsAccessible(parent, search, false);
	};

	questkit.ContainsReachable = function(parent, search) {
		return containsAccessible(parent, search, true);
	};

	var containsAccessible = function (parent, search, onlyReachable) {
		var searchParent = get(search, "parent");
		if (!searchParent) return false;
		if (get(search, "visible") == false) return false;
		if (get(parent, "darklevel") && !get(search, "lightsource")) return false;
		if (searchParent == parent) return true;
		
		var canAdd;
		if (onlyReachable) {
			canAdd = questkit.CanReachThrough(searchParent);
		}
		else {
			canAdd = questkit.CanSeeThrough(searchParent);
		}

		if (canAdd) {
			return (questkit.ContainsAccessible(parent, searchParent, onlyReachable));
		} else {
			return false;
		}
	};

	questkit.CanSeeThrough = function(object) {
		return (get(object, "transparent") || questkit.CanReachThrough(object)) && !get(object, "hidechildren");
	};

	questkit.CanReachThrough = function(object) {
		return get(object, "isopen") && !get(object, "hidechildren");
	};

	questkit.Contains = function(parent, search) {
		var searchParent = get(search, "parent");
		if (!searchParent) return false;
		if (searchParent == parent) return true;
		return questkit.Contains(parent, searchParent);
	};

	questkit.ScopeVisibleNotReachableForLocation = function(location) {
		// TODO
		return [];
	};

	questkit.ScopeInventory = function() {
		var result = [];
		var pov = get("pov");
		questkit.GetAllChildObjects(pov).forEach(function(object) {
			if (questkit.ContainsVisible(pov, object)) {
				result.push(object);
			}
		});
		return result;
	};

	questkit.GoDirection = function(direction) {
		// TODO: Locked exits, exits with scripts, non-directional exits
		var foundExit;
		questkit.ScopeExits().forEach(function(exit) {
			if (get(exit, "direction") == direction) {
				foundExit = exit;
				return;
			}
		});

		if (!foundExit) {
			msg(questkit.Template("UnresolvedLocation"));
			return;
		}

		set(get("pov"), "parent", get(foundExit, "to"));		
	};

	questkit.ScopeExits = function() {
		return questkit.ScopeExitsForLocation(povParent());
	};

	questkit.ScopeExitsForLocation = function(location) {
		var result = [];
		world.exits.forEach(function(exit) {
			if (get(exit, "parent") != location) return;
			if (get(exit, "visible") == false) return;
			if (get(location, "darklevel") && !get(exit, "lightsource")) return;
		  	result.push(exit);
		});
		return result;
	};

	questkit.Template = function(template) {
		return world.templates[template];
	};

	// questkit script commmands =====================================================

	questkit.get = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + "." + arg2;
		}
		return world.attributes[attribute];
	}

	questkit.set = function (arg1, arg2, arg3) {
		var attribute = arg1;
		var value = arg2;
		if (arg3) {
			attribute = arg1 + "." + arg2;
			value = arg3;
		}
		world.attributes[attribute] = value;
	};

	questkit.getscript = function (arg1, arg2) {
		var attribute = arg1;
		if (arg2) {
			attribute = arg1 + "." + arg2;
		}
		return world.scripts[attribute];
	};

	questkit.msg = function (text) {
		questkit.UI.addText(text);
	};
})();

function get(arg1, arg2) {
	return questkit.get(arg1, arg2);
}

function set(arg1, arg2, arg3) {
	return questkit.set(arg1, arg2, arg3);
}

function getscript(arg1, arg2) {
	return questkit.getscript(arg1, arg2);
}

function msg(text) {
	return questkit.msg(text);
}

var initData = {
	attributes: {},
	scripts: {},
	objects: [],
	commands: [],
	exits: [],
	regexes: {},
};