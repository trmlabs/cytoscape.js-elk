const makeNode = function(node, options) {
  let dims = node.layoutDimensions(options);
  let padding = node.numericStyle('padding');

  let k = {
    _cyEle: node,
    id: node.id(),
    ports: node.data().ports,
    properties: node.data().properties,
    padding: {
      top: padding,
      left: padding,
      bottom: padding,
      right: padding
    }
  };

  if (!node.isParent()) {
    k.width = dims.w;
    k.height = dims.h;
  }

  node.scratch('elk', k);

  return k;
};

const makeEdge = function(edge, options) {
  let k = {
    _cyEle: edge,
    id: edge.id(),
    source: edge.data('source'),
    target: edge.data('target')
  };

  let priority = options.priority && options.priority(edge);

  if (priority != null) {
    k.priority = priority;
  }

  edge.scratch('elk', k);

  return k;
};

const makeGraph = function(nodes, edges, options) {
  let elkNodes = [];
  let elkEdges = [];
  let elkEleLookup = {};
  let graph = {
    id: 'root',
    children: [],
    edges: []
  };

  // map all nodes
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    let k = makeNode(n, options);

    elkNodes.push(k);

    elkEleLookup[n.id()] = k;
  }

  // map all edges
  for (let i = 0; i < edges.length; i++) {
    let e = edges[i];
    let k = makeEdge(e, options);

    elkEdges.push(k);

    elkEleLookup[e.id()] = k;
  }

  // make hierarchy
  for (let i = 0; i < elkNodes.length; i++) {
    let k = elkNodes[i];
    let n = k._cyEle;

    if (!n.isChild()) {
      graph.children.push(k);
    } else {
      let parent = n.parent();
      let parentK = elkEleLookup[parent.id()];

      let children = (parentK.children = parentK.children || []);

      children.push(k);
    }
  }

  for (let i = 0; i < elkEdges.length; i++) {
    let k = elkEdges[i];

    // put all edges in the top level for now
    // TODO does this cause issues in certain edgecases?
    /*let e = k._cyEle;
      let parentSrc = e.source().parent();
      let parentTgt = e.target().parent();
      if ( false && parentSrc.nonempty() && parentTgt.nonempty() && parentSrc.same( parentTgt ) ){
        let kp = elkEleLookup[ parentSrc.id() ];
  
        kp.edges = kp.edges || [];
  
        kp.edges.push( k );
      } else {*/
    graph.edges.push(k);
    //}
  }

  return graph;
};

export default makeGraph;
