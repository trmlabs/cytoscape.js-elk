import elk from './elk';
import assign from './assign';
import defaults from './defaults';

const elkOverrides = {};

const getPos = function(ele, options) {
  const dims = ele.layoutDimensions(options);
  const parent = ele.parent();
  const k = ele.scratch('static') || ele.scratch('elk');

  const p = {
    x: k.x,
    y: k.y
  };

  if (ele.scratch('static')) {
    return p;
  }

  if (parent.nonempty()) {
    const kp = parent.scratch('static') || parent.scratch('elk');

    p.x += kp.x;
    p.y += kp.y;
  }

  // elk considers a node position to be its top-left corner, while cy is the centre
  p.x += dims.w / 2;
  p.y += dims.h / 2;

  return p;
};

const makeNode = function(node, options) {
  const k = {
    _cyEle: node,
    id: node.id(),
    ports: node.data().ports,
    properties: node.data().properties
  };

  if (!node.isParent()) {
    const dims = node.layoutDimensions(options);
    const p = node.position();

    // the elk position is the top-left corner, cy is the centre
    k.x = p.x - dims.w / 2;
    k.y = p.y - dims.h / 2;

    k.width = dims.w;
    k.height = dims.h;
  }

  node.scratch('elk', k);

  return k;
};

const makeEdge = function(edge, options) {
  const k = {
    _cyEle: edge,
    id: edge.id(),
    source: edge.data('source'),
    target: edge.data('target')
  };

  if (edge.data('label')) {
    k.labels = [{ text: edge.data('label') }];
  } else if (options.desiredEdgeLength) {
    k.labels = [{ width: options.desiredEdgeLength, text: ' ' }];
  }

  edge.scratch('elk', k);

  return k;
};

const makeGraph = function(nodes, edges, options) {
  const elkNodes = [];
  const elkEdges = [];
  const elkEleLookup = {};
  const graph = {
    id: 'root',
    children: [],
    edges: []
  };

  // map all nodes
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const k = makeNode(n, options);

    elkNodes.push(k);

    elkEleLookup[n.id()] = k;
  }

  // map all edges
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const k = makeEdge(e, options);

    elkEdges.push(k);

    elkEleLookup[e.id()] = k;
  }

  // make hierarchy
  for (let i = 0; i < elkNodes.length; i++) {
    const k = elkNodes[i];
    const n = k._cyEle;

    if (!n.isChild()) {
      graph.children.push(k);
    } else {
      const parent = n.parent();
      const parentK = elkEleLookup[parent.id()];

      const children = (parentK.children = parentK.children || []);

      children.push(k);
    }
  }

  for (let i = 0; i < elkEdges.length; i++) {
    const k = elkEdges[i];

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

function Layout(options) {
  const elkOptions = options.elk;
  const cy = options.cy;

  this.options = assign({}, defaults, options);

  this.options.elk = assign(
    {
      aspectRatio: cy.width() / cy.height()
    },
    defaults.elk,
    elkOptions,
    elkOverrides
  );
}

const heightCollision = 150;
const widthCollision = 120;

const testCollision = (posX, posY, staticCoords) => {
  let collision = false;

  // use a for loop to break once we find it
  // staticCoords[i][0=x,1=y]
  for (let i = staticCoords.length - 1; i >= 0; i--) {
    if (
      Math.abs(staticCoords[i][1] - posY) < heightCollision &&
      Math.abs(staticCoords[i][0] - posX) < widthCollision
    ) {
      collision = true;
      break;
    }
  }

  return collision;
};

const safeNode = (node, staticCoords) => {
  const scratch = node.scratch('elk');
  let posX = scratch.x;
  let posY = scratch.y;
  let flipMovement = false;

  // while collision exists, keep moving flipping between horizontal and vertical until no collisions
  while (testCollision(posX, posY, staticCoords)) {
    if (flipMovement) {
      posX += widthCollision;
    } else {
      posY += heightCollision;
    }

    flipMovement = !flipMovement;
  }

  if (posX !== scratch.x || posY !== scratch.y) {
    staticCoords.push([posX, posY]);
    node.scratch('static', {
      x: posX,
      y: posY
    });
  }
};

Layout.prototype.run = function() {
  const layout = this;
  const options = this.options;

  const eles = options.eles;
  const nodes = eles.nodes();
  const edges = eles.edges();

  const graph = makeGraph(nodes, edges, options);

  elk
    .layout(graph, {
      layoutOptions: options.elk
    })
    .then(() => {
      const filteredNodes = nodes.filter(n => !n.isParent());

      const staticCoords = [];
      const staticBox = {
        xMax: null,
        xMin: null,
        yMax: null,
        yMin: null
      };

      const newNodes = filteredNodes.filter(n => !n.scratch('static'));
      const staticNodes = filteredNodes.filter(n => !!n.scratch('static'));

      const isGroupMove = newNodes.length > 1 && staticNodes.length > 1;

      // these nodes are not moved
      staticNodes
        .layoutPositions(layout, options, n => getPos(n, options))
        .forEach(node => {
          const { x, y } = node.scratch('static');

          if (isGroupMove) {
            if (staticBox.xMax === null) {
              staticBox.xMax = x;
              staticBox.xMin = x;
              staticBox.yMax = y;
              staticBox.yMin = y;
            } else {
              staticBox.xMax = Math.max(staticBox.xMax, x);
              staticBox.xMin = Math.min(staticBox.xMin, x);
              staticBox.yMax = Math.max(staticBox.yMax, y);
              staticBox.yMin = Math.min(staticBox.yMin, y);
            }
          } else {
            staticCoords.push([x, y]);
          }
        });

      if (isGroupMove) {
        // we need to move it as 1
        const newBox = {
          xMax: null,
          xMin: null,
          yMax: null,
          yMin: null
        };

        newNodes.forEach(node => {
          const scratch = node.scratch('elk');

          if (newBox.xMax === null) {
            newBox.xMax = scratch.x;
            newBox.xMin = scratch.x;
            newBox.yMax = scratch.y;
            newBox.yMin = scratch.y;
          } else {
            newBox.xMax = Math.max(newBox.xMax, scratch.x);
            newBox.xMin = Math.min(newBox.xMin, scratch.x);
            newBox.yMax = Math.max(newBox.yMax, scratch.y);
            newBox.yMin = Math.min(newBox.yMin, scratch.y);
          }
        });

        if (
          (newBox.xMax <= staticBox.xMax + 100 &&
            newBox.xMax >= staticBox.xMin - 100) ||
          (newBox.xMin <= staticBox.xMax + 100 &&
            newBox.xMin >= staticBox.xMin - 100) ||
          (newBox.yMax <= staticBox.yMax + 100 &&
            newBox.yMax >= staticBox.yMin - 100) ||
          (newBox.yMin <= staticBox.yMax + 100 &&
            newBox.yMin >= staticBox.yMin - 100)
        ) {
          // this box has collision, lets move the least amount
          // we need bottom-right movement
          // right = new x min -> static x max
          // bottom = new y max -> static y min
          const xDiff = Math.abs(newBox.xMin - staticBox.xMax);
          const yDiff = Math.abs(newBox.yMax - staticBox.yMin);

          if (xDiff < yDiff) {
            // this means Y is bigger, so move X
            newNodes.forEach(node => {
              const scratch = node.scratch('elk');

              node.scratch('static', {
                x: scratch.x + xDiff + widthCollision,
                y: scratch.y
              });
            });
          } else {
            // this means X is bigger, so move Y
            newNodes.forEach(node => {
              const scratch = node.scratch('elk');

              node.scratch('static', {
                x: scratch.x,
                y: scratch.y + yDiff + heightCollision
              });
            });
          }
        }
      } else {
        if (staticCoords.length) {
          newNodes.forEach(node => safeNode(node, staticCoords));
        }
      }

      newNodes.layoutPositions(layout, options, n => getPos(n, options));
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
