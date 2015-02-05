/* jshint quotmark: single */

(function () {
	'use strict';

	questkit.defaultPrefix = function (object) {
		if (get(object, 'plural')) return 'some';
		var displayAlias = questkit.displayAlias(object);
		if ('aeiou'.indexOf(displayAlias.substr(0, 1)) >= 0) {
			return 'an';
		}
		return 'a';
	};

	questkit.defaultSubjectPronoun = function (object) {
		if (get(object, 'plural')) return 'they';
		var gender = get(object, 'gender');
		if (gender === 'male') {
			return 'he';
		}
		if (gender === 'female') {
			return 'she';
		}
		return 'it';
	};

	questkit.defaultObjectPronoun = function (object) {
		if (get(object, 'plural')) return 'them';
		var gender = get(object, 'gender');
		if (gender === 'male') {
			return 'him';
		}
		if (gender === 'female') {
			return 'her';
		}
		return 'it';
	};
})();