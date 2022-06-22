export default function(centers = () => ({ x: 0, y: 0, z: 0 })) {
  let nDim,
    nodes,
    centerpoints = [],
    strength = 0.1,
    centerInertia = 0.0;
    console.log("cluster")
  function force(alpha) {
    alpha *= strength * alpha;

    let c, x, y, z, l, r;
    nodes.forEach((d, i) => {
      c = centerpoints[i];
      if (!c || c === d) return;
      c.radius = c.radius || 1

      x = d.x - c.x;
      y = nDim > 1 ? d.y - c.y : 0;
      z = nDim > 2 ? d.z - c.z : 0;
      l = Math.sqrt(x * x + y * y);
      r = d.radius + (c.radius || 0);

      if (l && l !== r) {
        l = (l - r) / l * alpha;
        d.vx -= x *= l;
        c.vx += (1 - centerInertia) * x;
        if (nDim > 1) {
          d.vy -= y *= l;
          c.vy += (1 - centerInertia) * y;
        }
        if (nDim > 2) {
          d.vz -= z *= l;
          c.vz += (1 - centerInertia) * z;
        }
      }
    });
  }

  function getArray(nodes) {
    var cityset = new Map()
    nodes.forEach(function (node,i) {
      if (!cityset.has(node.prov_aid)) {
        var d = {x:node.x}
        if (nDim > 1) {
          d.y = node.y
        }
        if (nDim > 2) {
          d.z = node.z
        }
        cityset.set(node.prov_aid,d)
      } else {
        cityset.set(node.prov_aid,cityset.get(node.prov_aid))
      }
    })
    return cityset
  }
  function initialize () {
    if (nodes) {
      var cityset = getArray(nodes)
      centers = function (node) {
        return cityset.get(node.prov_aid)
      }
    }
    centerpoints = (nodes || []).map(centers);
  }

  force.initialize = function(initNodes, ...args) {
    nodes = initNodes;
    nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };

  force.centers = function(_) {
    return arguments.length ? (centers = _, initialize(), force) : centers;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.centerInertia = function(_) {
    return arguments.length ? (centerInertia = +_, force) : centerInertia;
  };

  return force;
}
