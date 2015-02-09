#!/usr/bin/env node
/* jshint quotmark: single */

'use strict';

var path = require('path');
var fs = require('fs');
var compiler = require('./compiler.js');

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')).toString());
var questKitVersion = packageJson.version;

console.log('QuestKit ' + questKitVersion);

var argv = require('yargs')
    .usage('Compiles a QuestKit script file into HTML and JavaScript.\n' +
        'For help, see http://docs.textadventures.co.uk/questkit/\n' +
        'Usage: $0 filename.yaml [options]')
    .demand(1)
    .describe('cli', 'Generate command-line version')
    .describe('scriptonly', 'Only generate JavaScript file (and optionally specify a name)')
    .describe('pluginname', 'Specify the jQuery plugin name instead of .questkit (only with --scriptonly)')
    .argv;

var result = compiler.process(argv._[0], __dirname, argv);

if (result && argv.cli) {
    var output = path.join(result, typeof argv.scriptonly === 'string' ? argv.scriptonly : 'story.js');
    console.log('\nRunning ' + output);
    console.log('Type "q" to exit\n');
    var child = require('child_process');
    child.fork(output);
}