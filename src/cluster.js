/*
 * @Author: lvxiansen 1023727097@qq.com
 * @Date: 2022-05-25 16:37:49
 * @LastEditors: lvxiansen 1023727097@qq.com
 * @LastEditTime: 2022-06-02 15:32:11
 * @FilePath: \d3-force-3d\src\cluster.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export default function(centers = () => ({ x: 0, y: 0, z: 0 })) {
  // console.log("ccccccccccccc");
  let nDim,
    nodes,
    centerpoints = [],
    strength = 0.1,
    centerInertia = 0.0;

  function force(alpha) {
    alpha *= strength * alpha;

    let c, x, y, z, l, r;
    nodes.forEach((d, i) => {
      c = centerpoints[i];
      if (!c || c === d) return;

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

  function initialize () {
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