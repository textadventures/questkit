if (typeof Quest === "undefined") Quest = {};
if (typeof Quest.UI === "undefined") Quest.UI = {};

(function(){
	Quest.UI.addText = function(text) {
		$("#questkit-output").append(text + "<br/>");
	}
})();

$(function() {
	$("#questkit-input").keydown(function(e) {
		if (e.which != 13) return;
		var input = $("#questkit-input").val();
		$("#questkit-input").val("");
		msg("<br/>&gt; " + input + "<br/>");
		Quest.HandleCommand(input);
	});
});