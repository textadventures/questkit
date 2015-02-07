#!/usr/bin/env node
/* jshint quotmark: single */

'use strict';

var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')).toString());
var questKitVersion = packageJson.version;

function Compiler() {
    this.language = {};

    this.process = function (inputFilename, sourcePath, options) {
        var outputPath = path.resolve(path.dirname(inputFilename));

        this.language = yaml.safeLoad(fs.readFileSync(path.join(sourcePath, 'en.yaml')));

        var sections = [];

        this.processFile(sections, path.resolve(inputFilename), true);
        this.processFile(sections, this.findFile('core.yaml', outputPath, sourcePath), false);

        console.log('Loaded {0} sections'.format(sections.length));
        console.log('Writing story.js');

        var coreJsFiles = [
            'core.js',
            'core.scopes.js',
            'core.parser.js',
            'core.descriptions.js',
            'core.commands.js',
            'en.js',
        ];

        var coreJs = coreJsFiles.map(function (file) {
            return fs.readFileSync(path.join(sourcePath, file)).toString();
        }).join('');

        var coreJsFile = fs.readFileSync(path.join(sourcePath, 'core.js'));
        var uiJsFile = fs.readFileSync(path.join(sourcePath, options.cli ? 'cli.js' : 'ui.js'));
        var jsData = '// Created with QuestKit {0}\n// https://github.com/textadventures/questkit\n\n'.format(questKitVersion) + coreJs + '\n' + uiJsFile.toString();

        var outputJsFile = [];
        outputJsFile.push(jsData);
        outputJsFile.push('\n\n');

        var game = sections.shift();

        if (!game.pov) {
            game.pov = 'player';

            // If a player object doesn't exist already, create it in the first location

            var foundPlayer = false;
            var firstLocation;

            sections.forEach(function (section) {
                if (section['~name'] == 'player') {
                    foundPlayer = true;
                    return;
                }

                if (!firstLocation && section['~type'] == 'location') {
                    firstLocation = section['~name'];
                }
            });

            if (!foundPlayer) {
                sections.push({
                    '~name': 'player',
                    '~type': 'object',
                    parent: firstLocation
                });
            }
        }

        Object.keys(game).forEach(function (attr) {
            outputJsFile.push('set(\'{0}\', {1});\n'.format(attr, JSON.stringify(game[attr])));
        });

        sections.forEach(function (section) {
            outputJsFile.push('\n');
            this.writeSection(outputJsFile, section);
        }, this);

        outputJsFile.push('\n');
        outputJsFile.push('initData.templates = ' + JSON.stringify(this.language.defaults, null, '\t') + ';\n');
        outputJsFile.push('questkit.init(initData);\n');

        fs.writeFileSync(path.join(outputPath, 'story.js'), outputJsFile.join(''));

        if (!options.cli) {
            console.log('Writing index.html');

            var htmlTemplateFile = fs.readFileSync(this.findFile('index.template.html', outputPath, sourcePath));
            var htmlData = htmlTemplateFile.toString();
            htmlData = htmlData.replace('<!-- INFO -->', '<!--\n\nCreated with QuestKit {0}\n\n\nhttps://github.com/textadventures/questkit\n\n-->'.format(questKitVersion));
            htmlData = htmlData.replace(/<!-- TITLE -->/g, game.title);           
            fs.writeFileSync(path.join(outputPath, 'index.html'), htmlData);

            console.log('Copying jquery');
            fs.createReadStream(path.join(sourcePath, 'node_modules', 'jquery', 'dist', 'jquery.min.js')).pipe(fs.createWriteStream(path.join(outputPath, 'jquery.min.js')));

            console.log('Copying bootstrap');
            fs.createReadStream(path.join(sourcePath, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css')).pipe(fs.createWriteStream(path.join(outputPath, 'bootstrap.min.css')));
            fs.createReadStream(path.join(sourcePath, 'node_modules', 'bootstrap', 'dist', 'js', 'bootstrap.min.js')).pipe(fs.createWriteStream(path.join(outputPath, 'bootstrap.min.js')));

            console.log('Writing style.css');

            var cssTemplateFile = fs.readFileSync(this.findFile('style.template.css', outputPath, sourcePath));
            var cssData = cssTemplateFile.toString();
            fs.writeFileSync(path.join(outputPath, 'style.css'), cssData);
        }

        console.log('Done.');

        return outputPath;
    };

    this.processFile = function (sections, inputFilename, isFirst) {
        var compiler = this;
        var file = fs.readFileSync(inputFilename, 'utf8');

        var defaultParent;
        var count = 0;

        var docs = yaml.safeLoadAll(file, function (section) {
            sections.push(section);

            // If any attribute has a sub-attribute 'template', replace it with the value from the loaded language file

            Object.keys(section).forEach(function (attr) {
                if (section[attr] && section[attr].template) {
                    section[attr] = compiler.language[section[attr].template];
                }
            });

            if (++count == 1 && isFirst) {
                // no further processing for the game data at the top of the first file
                return;
            }

            var type = Object.keys(section)[0];
            if (!(type in compiler.sectionTypes)) {
                throw 'Unknown type - {0}: {1}'.format(type, section[type]);
            }
            
            var name = section[type];
            if (!name) name = '~' + compiler.anonymousCount++;

            if (type == 'location') {
                // set default parent to this for subsequent objects, exits etc.
                defaultParent = name;

                // convert any directional attributes into exits
                Object.keys(compiler.directions).forEach(function (direction) {
                    if (!(direction in section)) return;

                    // create the exit
                    sections.push({
                        '~name': '~' + compiler.anonymousCount++,
                        '~type': 'exit',
                        parent: name,
                        direction: direction,
                        alias: direction,
                        to: section[direction]
                    });

                    // and the exit in the opposite direction
                    sections.push({
                        '~name': '~' + compiler.anonymousCount++,
                        '~type': 'exit',
                        parent: section[direction],
                        direction: compiler.directions[direction],
                        alias: compiler.directions[direction],
                        to: name
                    });                    

                    delete section[direction];
                });
            }

            if (type == 'exit') {
                if (!section.alias) section.alias = section.direction || section.to;
            }

            if (type !== 'location' && type != 'walkthrough') {
                if (defaultParent && !section.parent && type != 'walkthrough') section.parent = defaultParent;
            }

            section['~type'] = type;
            section['~name'] = name;
        });
    };

    this.findFile = function (filename, outputPath, sourcePath) {
        var outputPathFile = path.join(outputPath, filename);
        if (fs.existsSync(outputPathFile)) {
            return outputPathFile;
        }
        return path.join(sourcePath, filename);
    };

    // section types and the initData list they live in

    this.sectionTypes = {
        'command': 'commands',
        'location': 'objects',
        'object': 'objects',
        'character': 'objects',
        'exit': 'exits',
        'walkthrough': 'walkthroughs',
    };

    // directions and their opposites

    this.directions = {
        'north': 'south',
        'east': 'west',
        'south': 'north',
        'west': 'east',
        'northeast': 'southwest',
        'southeast': 'northwest',
        'southwest': 'northeast',
        'northwest': 'southeast',
        'up': 'down',
        'down': 'up',
        'in': 'out',
        'out': 'in',
    };

    this.anonymousCount = 0;

    this.writeSection = function (outputJsFile, section) {
        var type = section['~type'];
        var name = section['~name'];
        outputJsFile.push('initData.{0}.push(\'{1}\');\n'.format(this.sectionTypes[type], name));

        if (type == 'command') {
            var patterns = [];
            if (!section.patterns) section.patterns = [];
            if (section.pattern) {
                section.patterns.push(section.pattern);
                delete section.pattern;
            }
            var variablesRegex = /\#(.*?)\#/g;
            var groups = [];
            var match;
            while (!!(match = variablesRegex.exec(section.patterns[0]))) {
                groups.push(match[1]);
            }
            section.patterns.forEach(function (pattern) {
                pattern = pattern.replace(/\(/g, '\\(');
                pattern = pattern.replace(/\)/g, '\\)');
                pattern = pattern.replace(/\./g, '\\.');
                pattern = pattern.replace(/\?/g, '\\?');
                pattern = pattern.replace(variablesRegex, '(.*?)');
                patterns.push('/^' + pattern + '$/');
            });
            delete section.patterns;

            outputJsFile.push('initData.regexes[\'{0}\'] = {\n'.format(name));
            outputJsFile.push('\tpatterns: [{0}],\n'.format(patterns.join(', ')));
            outputJsFile.push('\tgroups: {0}\n'.format(JSON.stringify(groups)));
            outputJsFile.push('};\n');

            if (section.action && section.action.script) {
                outputJsFile.push('initData.scripts[\'{0}.action\'] = function ({1}) {\n'.format(name, groups.join(', ')));
                this.writeJs(outputJsFile, 1, section.action.script);
                outputJsFile.push('};\n');

                delete section.action;
            }
        }

        if (type == 'walkthrough') {
            for (var i = 0; i < section.steps.length; i++) {
                var step = section.steps[i];
                if (step.assert) {
                    outputJsFile.push('initData.scripts[\'{0}.{1}\'] = function () {\n'.format(name, i));
                    this.writeJs(outputJsFile, 1, 'return ' + step.assert + ';');
                    outputJsFile.push('};\n');
                    step.script = '{0}.{1}'.format(name, i);
                }
            }
        }

        var attrs = Object.keys(section).slice(0);
        attrs.shift();
        attrs.forEach(function (attr) {
            if (attr.indexOf('~') === 0) return;
            if (section[attr].script) {
                outputJsFile.push('initData.scripts[\'{0}.{1}\'] = function () {\n'.format(name, attr));
                this.writeJs(outputJsFile, 1, section[attr].script);
                outputJsFile.push('};\n');
            }
            else {
                outputJsFile.push('set(\'{0}.{1}\', {2});\n'.format(name, attr, JSON.stringify(section[attr])));
            }
        }, this);
    };

    this.writeJs = function (outputJsFile, tabCount, js) {
        var tabs = new Array(tabCount).join('\t');
        var lines = js.trim().replace(/\r/g, '').split('\n');
        lines.forEach(function (jsLine) {
            outputJsFile.push('{0}\t{1}\n'.format(tabs, jsLine));
        });
    };
}

console.log('QuestKit ' + questKitVersion);

var argv = require('yargs')
    .usage('Compiles a QuestKit script file into HTML and JavaScript.\n' +
        'For help, see http://docs.textadventures.co.uk/questkit/\n' +
        'Usage: $0 filename.yaml [options]')
    .demand(1)
    .describe('cli', 'Generate command-line version')
    .argv;

var options = {
    cli: argv.cli
};

var compiler = new Compiler();
var result = compiler.process(argv._[0], __dirname, options);

if (result && options.cli) {
    var output = path.join(result, 'story.js');
    console.log('\nRunning ' + output);
    console.log('Type "q" to exit\n');
    var child = require('child_process');
    child.fork(output);
}