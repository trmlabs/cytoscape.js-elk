import elk from './elk';
import assign from './assign';
import defaults from './defaults';
import makeGraph from './convert-graph';

function mapToElkNS(elkOpts) {
  let keys = Object.keys(elkOpts);
  let ret = {};

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let nsKey = key;
    let val = elkOpts[key];
    ret[nsKey] = val;
  }

  return ret;
}

const elkOverrides = {};

function getPos(ele) {
  let parent = ele.parent();
  let k = ele.scratch('elk');
  let p = {
    x: k.x,
    y: k.y
  };

  if (parent.nonempty()) {
    let kp = parent.scratch('elk');

    p.x += kp.x;
    p.y += kp.y;
  }

  return p;
}

function Layout(options) {
  let elkOptions = options.elk;

  this.options = assign({}, defaults, options);

  this.options.elk = assign({}, defaults.elk, elkOptions, elkOverrides);
}

Layout.prototype.run = function() {
  let layout = this;
  let options = this.options;

  let eles = options.eles;
  let nodes = eles.nodes();
  let edges = eles.edges();

  let graph = makeGraph(nodes, edges, options);

  elk
    .layout(graph, {
      layoutOptions: mapToElkNS(options.elk)
    })
    .then(() => {
      nodes
        .filter(n => !n.isParent())
        .layoutPositions(layout, options, getPos);
    });

  return this;
};

Layout.prototype.stop = function() {
  return this; // chaining
};

Layout.prototype.destroy = function() {
  return this; // chaining
};

export default Layout;
