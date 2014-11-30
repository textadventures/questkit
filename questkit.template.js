var Quest = {
	_internal: {
		attributes: {},
		scripts: {},
		objects: [],
		commands: [],
		exits: [],
		regexes: {},
	},
	PovParent: function() {
		return get(get("pov"), "parent");
	},
	HandleCommand: function(input) {
		// TODO: Full conversion
		Quest.ScopeCommands().forEach(function(cmd) {
			Quest._internal.regexes[cmd].patterns.forEach(function(pattern) {
				var match = pattern.exec(input);
				if (match) {
					var args = match.slice(0);
					args.shift();
					var resolved = true;
					Quest._internal.regexes[cmd].groups.forEach(function(group, index) {
						if (group.indexOf("object") != 0) return;
						// Resolve object name

						var check = args[index].toLowerCase();
						var found = false;
						// TODO: Use a Scope function instead
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
						Quest._internal.scripts[cmd + ".action"].apply(this, args);
					}
					else {
						// TODO: Get proper message from template
						msg("Not resolved");
					}
				}
			});
		});
	},
	ScopeCommands: function() {
		var result = [];
		var povParent = Quest.PovParent();
		Quest._internal.commands.forEach(function(cmd) {
			var parent = get(cmd, "parent");
			if (!parent || parent == povParent) {
				result.push(cmd);
			}
		});
		return result;
	},
	ScopeVisible: function() {
		return Quest.ScopeVisibleNotHeld().concat(Quest.ScopeInventory());
	},
	ScopeVisibleNotHeld: function() {
		return Quest.ScopeReachableNotHeldForLocation(Quest.PovParent()).concat(Quest.ScopeVisibleNotReachableForLocation(Quest.PovParent()));
	},
	ScopeReachableNotHeldForLocation: function(location) {
		var result = [];
		var pov = get("pov");
		Quest.GetAllChildObjects(location).forEach(function(object) {
			if (Quest.ContainsReachable(location, object) && object != pov && !Quest.Contains(pov, object)) {
				result.push(object);
			}
		});
		return result;
	},
	GetAllChildObjects: function(object) {
		// TODO: Cache direct children of each object
		var result = [];
		Quest._internal.objects.forEach(function(child) {
			if (get(child, "parent") == object) {
				result.push(child);
				result = result.concat(Quest.GetAllChildObjects(child));
			}
		});
		return result;
	},
	ContainsVisible: function(parent, search) {
		return Quest.ContainsAccessible(parent, search, false);
	},
	ContainsReachable: function(parent, search) {
		return Quest.ContainsAccessible(parent, search, true);
	},
	ContainsAccessible: function(parent, search, onlyReachable) {
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
	},
	CanSeeThrough: function(object) {
		return (get(object, "transparent") || Quest.CanReachThrough(object)) && !get(object, "hidechildren");
	},
	CanReachThrough: function(object) {
		return get(object, "isopen") && !get(object, "hidechildren");
	},
	Contains: function(parent, search) {
		var searchParent = get(search, "parent");
		if (!searchParent) return false;
		if (searchParent == parent) return true;
		return Quest.Contains(parent, searchParent);
	},
	ScopeVisibleNotReachableForLocation: function(location) {
		// TODO
		return [];
	},
	ScopeInventory: function() {
		var result = [];
		var pov = get("pov");
		Quest.GetAllChildObjects(pov).forEach(function(object) {
			if (Quest.ContainsVisible(pov, object)) {
				result.push(object);
			}
		});
		return result;
	},
}

// Quest script commmands =====================================================

function get(arg1, arg2) {
	var attribute = arg1;
	if (arg2) {
		attribute = arg1 + "." + arg2;
	}
	return Quest._internal.attributes[attribute];
}

function set(arg1, arg2, arg3) {
	var attribute = arg1;
	var value = arg2;
	if (arg3) {
		attribute = arg1 + "." + arg2;
		value = arg3;
	}
	Quest._internal.attributes[attribute] = value;
}

function getscript(arg1, arg2) {
	var attribute = arg1;
	if (arg2) {
		attribute = arg1 + "." + arg2;
	}
	return Quest._internal.scripts[attribute];
}

function msg(text) {
	console.log(text);
}

// A simple way of running this as a node console app for now ======================

var readline = require('readline');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.setPrompt("> ");
rl.prompt();

rl.on("line", function(input) {
	if (input == "q") {
		rl.close();
	}
	else {
		Quest.HandleCommand(input);
		rl.prompt();
	}
});