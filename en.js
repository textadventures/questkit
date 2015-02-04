/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.defaultPrefix = function (object) {
		var displayAlias = questkit.displayAlias(object);
		if ('aeiou'.indexOf(displayAlias.substr(0, 1)) >= 0) {
			return 'an';
		}
		return 'a';
	};
})();