#!/usr/bin/env node

var questKitVersion = "0.0.1";

var path = require("path");
var fs = require("fs");

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
};

function Compiler() {
    this.process = function(inputFilename, sourcePath, options) {
        var outputPath = path.resolve(path.dirname(inputFilename));
        var yaml = require("js-yaml");

        var file = fs.readFileSync(inputFilename, "utf8");
        var sections = [];

        try {
            var docs = yaml.safeLoadAll(file, function(doc) {
                sections.push(doc);
            });
        }
        catch (e) {
            console.log(e);
            return;
        }

        console.log("Loaded {0} sections".format(sections.length));
        console.log("Writing story.js");

        var jsTemplateFile = fs.readFileSync(path.join(sourcePath, "questkit.template.js"));
        var jsData = "// Created with QuestKit {0}\n// https://github.com/textadventures/questkit\n\n".format(questKitVersion) + jsTemplateFile.toString();

        var outputJsFile = [];
        outputJsFile.push(jsData);
        outputJsFile.push("\n\n");

        var game = sections.shift();

        Object.keys(game).forEach(function(attr) {
            outputJsFile.push("set(\"{0}\", {1});".format(attr, JSON.stringify(game[attr])));
        });

        fs.writeFileSync(path.join(outputPath, "story.js"), outputJsFile.join(""));

        console.log("Done.");

        return outputPath;
    }

    this.findFile = function(filename, outputPath, sourcePath) {
        var outputPathFile = path.join(outputPath, filename);
        if (fs.existsSync(outputPathFile)) {
            return outputPathFile;
        }
        return path.join(sourcePath, filename);
    }
}

console.log("QuestKit " + questKitVersion);

var argv = require("yargs")
    .usage("Compiles a QuestKit script file into HTML and JavaScript.\nFor help, see http://docs.textadventures.co.uk/questkit/\nUsage: $0 filename.yaml [options]")
    .demand(1)
    .argv;

var options = {
};

var compiler = new Compiler();
var result = compiler.process(argv._[0], __dirname, options);