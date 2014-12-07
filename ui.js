if (typeof questkit === 'undefined') questkit = {};
if (typeof questkit.ui === 'undefined') questkit.ui = {};

(function () {
	questkit.ui.addText = function (text) {
		$('#questkit-output').append(text + '<br/>');
	};
})();

$(function () {
	$('#questkit-input').keydown(function (e) {
		if (e.which != 13) return;
		var input = $('#questkit-input').val();
		$('#questkit-input').val('');
		msg('<br/>&gt; ' + input + '<br/>');
		questkit.handleCommand(input);
	});
});