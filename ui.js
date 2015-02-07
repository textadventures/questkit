/* jshint quotmark: single */

(function () {
	'use strict';

	var currentDiv = null;
	var outputSections = [];
	var divCount = -1;
	var beginningOfCurrentTurnScrollPosition = 0;
	
	questkit.ui.addText = function (text) {
		if (getCurrentDiv() === null) {
			createNewDiv('left');
		}

		$('#questkit-output').append(text + '<br/>');
		$('#questkit-output').css('min-height', $('#questkit-output').height());
	};

	var createNewDiv = function (alignment) {
		var classes = outputSections.join(' ');
		setDivCount(getDivCount() + 1);
		$('<div/>', {
			id: 'questkit-output-section' + getDivCount(),
			style: 'text-align: ' + alignment,
			'class': classes
		}).appendTo('#questkit-output');
		setCurrentDiv('#questkit-output-section' + getDivCount());
	};

	var getCurrentDiv = function () {
		if (currentDiv) return currentDiv;

		var divId = questkit.get('~ui.divid');
		if (divId) {
			currentDiv = $(divId);
			return currentDiv;
		}

		return null;
	};

	var setCurrentDiv = function (div) {
		currentDiv = $(div);
		questkit.set('~ui.divid', div);
	};

	var getDivCount = function () {
		if (divCount == -1) {
			divCount = questkit.get('~ui.divcount') || 0;
		}
		return divCount;
	};

	var setDivCount = function (count) {
		divCount = count;
		questkit.set('~ui.divcount', divCount);
	};

	questkit.ui.scrollToEnd = function () {
		var scrollTo = beginningOfCurrentTurnScrollPosition;
		var currentScrollTop = Math.max($('body').scrollTop(), $('html').scrollTop());
		if (scrollTo > currentScrollTop) {
			var maxScrollTop = $(document).height() - $(window).height();
			if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
			var distance = scrollTo - currentScrollTop;
			var duration = distance / 0.4;
			// TODO: 'easeInOutCubic' is nice here
			$('body,html').stop().animate({ scrollTop: scrollTo }, duration);
		}
		$('#questkit-input').focus();
	};

	questkit.ui.markScrollPosition = function () {
		beginningOfCurrentTurnScrollPosition = $('#questkit-output').height();
	};

	questkit.ui.escapeString = function (str) {
		return str.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	questkit.ui.init = function () {
	};

	questkit.ui.start = function () {
		$(function () {
			questkit.ready();
		});
	};
})();

$(function () {
	$('#questkit-input').focus();
	$('#questkit-input').keydown(function (e) {
		if (e.which != 13) return;
		var input = $('#questkit-input').val();
		$('#questkit-input').val('');
		questkit.ui.markScrollPosition();
		msg('');
		msg(questkit.ui.escapeString('> ' + input));
		questkit.handleCommand(input);
		questkit.ui.scrollToEnd();
	});
});