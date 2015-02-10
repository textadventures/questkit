---
layout: index
title: QuestKit ScratchPad
---

<style type="text/css" media="screen">
    #editor { 
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }
</style>

<div class="row">
    <div class="col-md-6" style="height: 500px">
        <div id="editor">title: QuestKit demo

---
location: room
description: This is a simple example of a room in QuestKit.
south: another room

---
object: book
look: This is an object. You can pick me up and drop me somewhere else.
take: true

---
location: another room
description: This is another room.</div>
    </div>
    <div class="col-md-6">
        <button id="run" class="btn btn-success">Run</button>
        <div id="output-container"></div>
    </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.1.3/ace.js"></script>
<script>
    var $_GET = {};
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }
        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });

    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/eclipse");
    editor.getSession().setMode("ace/mode/yaml");
    editor.getSession().setUseWrapMode(true);
    editor.focus();

    if ($_GET["gistid"] && $_GET["filename"]) {
        var gistid = $_GET["gistid"];
        var filename = $_GET["filename"];
        $.ajax({
            url: "https://api.github.com/gists/" + gistid,
            type: "GET",
            dataType: "jsonp"
        }).success(function (gistdata) {
            var content = gistdata.data.files[filename].content;
            editor.setValue(content, -1);
        });
    }

    $("#run").click(function () {
        $("#output").remove();
        $("#input").remove();
        $.post("http://questkit.textadventures.co.uk", editor.getValue(), function (data) {
            $("<div/>", { id: "output", style: "max-height: 400px" })
                .appendTo("#output-container");

            if (data.indexOf("Failed") === 0) {
                $("#output").html(data);
                return;
            }

            $("<input/>", { id: "input", 'class': "form-control", placeholder: 'Type here...' })
                .appendTo("#output-container");

            eval(data);
            $("#output").questkit({ input: "#input", scroll: "element" });
        });
    });
</script>