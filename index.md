---
layout: index
title: QuestKit - Documentation
---

**Under development! Nothing much to see here yet...**

QuestKit is a tool for creating text adventure games with a parser.

Example
-------

<div class="row">
	<div class="col-md-6">
<pre>
{% include_relative samples/example.yaml %}
</pre>
	</div>
	<div class="col-md-6">
		<div id="sample-output" style="height: 270px"></div>
		<div class="form-group">
		  <input id="sample-input" class="form-control" placeholder="Type here..." />
		</div>
	</div>
</div>

<script src="samples/story.js"></script>
<script>
	$(function(){
		$("#sample-output").questkit({input:"#sample-input", scroll:"element"});
	});
</script>

Contributing
------------

[Development Roadmap](roadmap.html)

You can also discuss QuestKit at [the forum](http://forum.textadventures.co.uk/viewforum.php?f=15).

QuestKit is completely open source, including this documentation! The source code and documentation both live [on GitHub](https://github.com/textadventures/questkit) (documentation is in the `gh-pages` branch).

Things to document
------------------

- File format (YAML)
- Section types:
	- game title
	- location
	- object
	- character
	- command
	- exit
	- walkthrough
- Core libraries:
	- core.js
		- questkit.allCommands
		- questkit.allExits
		- questkit.allObjects
		- questkit.allWalkthroughs
		- questkit.commandRegex
		- questkit.displayAlias
		- questkit.objectPronoun
		- questkit.povParent
		- questkit.subjectPronoun
		- questkit.template
	- core.commands.js - implementations of commands from core.yaml
		- questkit.goDirection
		- questkit.goToExit
		- questkit.take
	- core.descriptions.js
		- questkit.go
		- questkit.showLocationDescription
		- questkit.startLocation (TODO: maybe should be private)
	- core.parser.js
		- questkit.handleCommand
		- questkit.runWalkthrough (implementation of command in core.yaml)
		- questkit.listWalkthroughs (implementation of command in core.yaml)
	- core.scopes.js
		- questkit.canReachThrough
		- questkit.canSeeThrough
		- questkit.contains
		- questkit.containsReachable
		- questkit.containsVisible
		- questkit.getAllChildObjects
		- questkit.getDirectChildren
		- questkit.getNonTransparentParent
		- questkit.scopeCommands
		- questkit.scopeExits
		- questkit.scopeExitsForLocation
		- questkit.scopeInventory
		- questkit.scopeReachableNotHeldForLocation
		- questkit.scopeVisible
		- questkit.scopeVisibleNotHeld
		- questkit.scopeVisibleNotReachableForLocation
	- core.yaml
- Translating QuestKit
	- en.yaml
	- en.js
- Generating and customising HTML
- CLI mode