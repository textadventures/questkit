#!/usr/bin/env node

var path = require("path");
var fs = require("fs");

var questKitVersion = "0.0.1";

function Compiler() {
    this.process = function(inputFilename, sourcePath, options) {
        var outputPath = path.resolve(path.dirname(inputFilename));
        var yaml = require('js-yaml');

        var file = fs.readFileSync(inputFilename, "utf8");

        try {
            var docs = yaml.safeLoadAll(file, function(doc) {
                console.log(doc);
            });
        }
        catch (e) {
            console.log(e);
            return;
        }

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

var argv = require('yargs')
    .usage("Compiles a QuestKit script file into HTML and JavaScript.\nFor help, see http://docs.textadventures.co.uk/questkit/\nUsage: $0 filename.yaml [options]")
    .demand(1)
    .argv;

var options = {
};

var compiler = new Compiler();
var result = compiler.process(argv._[0], __dirname, options);