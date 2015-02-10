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

		questkit.ui.output
			.append(text + '<br/>')
			.css('min-height', questkit.ui.output.height());
	};

	var createNewDiv = function (alignment) {
		var classes = outputSections.join(' ');
		setDivCount(getDivCount() + 1);
		$('<div/>', {
			id: 'questkit-output-section' + getDivCount(),
			style: 'text-align: ' + alignment,
			'class': classes
		}).appendTo(questkit.ui.output);
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
		var scrollTo, currentScrollTop, distance, duration;
		if (questkit.ui.settings.scroll === 'element') {
			scrollTo = questkit.ui.output[0].scrollHeight - questkit.ui.output.height();
			currentScrollTop = questkit.ui.output.scrollTop();
			if (scrollTo > currentScrollTop) {
				distance = scrollTo - currentScrollTop;
				duration = distance / 0.4;
				// TODO: 'easeInOutCubic' is nice here
				questkit.ui.output.stop().animate({	scrollTop: scrollTo }, duration);
			}
		}
		else {
			scrollTo = beginningOfCurrentTurnScrollPosition;
			currentScrollTop = Math.max($('body').scrollTop(), $('html').scrollTop());
			if (scrollTo > currentScrollTop) {
				var maxScrollTop = $(document).height() - $(window).height();
				if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
				distance = scrollTo - currentScrollTop;
				duration = distance / 0.4;
				// TODO: 'easeInOutCubic' is nice here
				$('body,html').stop().animate({ scrollTop: scrollTo }, duration);
			}
		}
		questkit.ui.input.focus();
	};

	questkit.ui.markScrollPosition = function () {
		beginningOfCurrentTurnScrollPosition = questkit.ui.output.height();
	};

	questkit.ui.escapeString = function (str) {
		return str.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	questkit.ui.init = function () {
	};

})();

$.fn.questkit = function (options) {
	var settings = $.extend({
        scroll: 'body'
    }, options);

    questkit.ui.output = this;
    questkit.ui.settings = settings;
    questkit.ui.input = $(settings.input);
	questkit.ui.input.focus();
	questkit.ui.input.keydown(function (e) {
		if (e.which != 13) return;
		var input = $(this).val();
		$(this).val('');
		questkit.ui.markScrollPosition();
		msg('');
		msg(questkit.ui.escapeString('> ' + input));
		questkit.handleCommand(input);
		questkit.ui.scrollToEnd();
	});

	if (settings.scroll === 'element') {
		questkit.ui.output.css('overflow-y', 'auto');
	}

	questkit.ready();
    
    return this;
};