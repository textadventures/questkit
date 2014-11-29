#!/usr/bin/env node

var questKitVersion = "0.0.1";

var path = require("path");
var fs = require("fs");
var yaml = require("js-yaml");

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

        var sections = [];

        this.processFile(sections, path.resolve(inputFilename));
        this.processFile(sections, this.findFile("core.yaml", outputPath, sourcePath));

        console.log("Loaded {0} sections".format(sections.length));
        console.log("Writing story.js");

        var jsTemplateFile = fs.readFileSync(path.join(sourcePath, "questkit.template.js"));
        var jsData = "// Created with QuestKit {0}\n// https://github.com/textadventures/questkit\n\n".format(questKitVersion) + jsTemplateFile.toString();

        var outputJsFile = [];
        outputJsFile.push(jsData);
        outputJsFile.push("\n\n");

        var game = sections.shift();

        Object.keys(game).forEach(function(attr) {
            outputJsFile.push("set(\"{0}\", {1});\n".format(attr, JSON.stringify(game[attr])));
        });

        sections.forEach(function(section) {
            this.writeSection(outputJsFile, section);
        }, this);

        fs.writeFileSync(path.join(outputPath, "story.js"), outputJsFile.join(""));

        console.log("Done.");

        return outputPath;
    };

    this.processFile = function(sections, inputFilename) {
        var file = fs.readFileSync(inputFilename, "utf8");
        var docs = yaml.safeLoadAll(file, function(doc) {
            sections.push(doc);
        });
    };

    this.findFile = function(filename, outputPath, sourcePath) {
        var outputPathFile = path.join(outputPath, filename);
        if (fs.existsSync(outputPathFile)) {
            return outputPathFile;
        }
        return path.join(sourcePath, filename);
    };

    this.sectionTypes = {
        "command": "commands",
        "location": "objects",
        "object": "objects",
        "character": "objects",
        "exit": "exits",
    };

    this.anonymousCount = 0;

    this.writeSection = function(outputJsFile, section) {
        var type = Object.keys(section)[0];
        if (!(type in this.sectionTypes)) {
            throw "Unknown type - {0}: {1}".format(type, section[type]);
        }
        
        var name = section[type];
        if (!name) name = "~" + this.anonymousCount++;

        outputJsFile.push("Quest._internal.{0}.push(\"{1}\");\n".format(this.sectionTypes[type], name));

        var attrs = Object.keys(section).slice(0);
        attrs.shift();
        attrs.forEach(function (attr) {
            outputJsFile.push("set(\"{0}.{1}\", {2});\n".format(name, attr, JSON.stringify(section[attr])));
        });
    };
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