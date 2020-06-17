cytoscape-elk
================================================================================

## Description

The [elk](https://github.com/OpenKieler/elkjs) layout algorithm adapter for Cytoscape.js ([demo](https://cytoscape.github.io/cytoscape-elk.js))

This discrete layout creates good results for most graphs and it supports compound nodes.


## Dependencies

 * Cytoscape.js ^3.2.0
 * elkjs ^0.5.1


## Usage instructions

Download the library:
 * via npm or yarn: `npm install cytoscape-elk` or `yarn add cytoscape-elk`,
 * via direct download in the repository (probably from a tag).

Import the library as appropriate for your project:

ES import:

```js
import cytoscape from 'cytoscape';
import elk from 'cytoscape-elk';

cytoscape.use( elk );
```

CommonJS require:

```js
let cytoscape = require('cytoscape');
let elk = require('cytoscape-elk');

cytoscape.use( elk ); // register extension
```

AMD:

```js
require(['cytoscape', 'cytoscape-elk'], function( cytoscape, elk ){
  elk( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## API

```js
var options = {
  nodeDimensionsIncludeLabels: false, // Boolean which changes whether label dimensions are included when calculating node dimensions
  fit: true, // Whether to fit
  padding: 20, // Padding on fit
  animate: false, // Whether to transition the node positions
  animateFilter: function( node, i ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // Duration of animation in ms if enabled
  animationEasing: undefined, // Easing of animation if enabled
  transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  elk: {
    // All options are available at http://www.eclipse.org/elk/reference.html
    // 'org.eclipse.elk.' can be dropped from the Identifier
    // Or look at demo.html for an example.
    // Enums use the name of the enum e.g.
    // 'searchOrder': 'DFS'
  },
  priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when geedy edge cycle breaking is enabled
};

cy.layout( options ).run();
```


## Build targets

* `npm run test` : Run Mocha tests in `./test`
* `npm run build` : Build `./src/**` into `cytoscape-elk.js`
* `npm run watch` : Automatically build on changes with live reloading (N.b. you must already have an HTTP server running)
* `npm run dev` : Automatically build on changes with live reloading with webpack dev server
* `npm run lint` : Run eslint on the source

N.b. all builds use babel, so modern ES features can be used in the `src`.


## Publishing instructions

This project is set up to automatically be published to npm.  To publish:

1. Build the extension : `npm run build:release`
2. Commit the build : `git commit -am "Build for release"`
3. Bump the version number and tag: `npm version major|minor|patch`
4. Push to origin: `git push && git push --tags`
5. Publish to npm: `npm publish .`