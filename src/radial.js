/*
 * @Author: lvxiansen 1023727097@qq.com
 * @Date: 2022-04-27 16:51:22
 * @LastEditors: lvxiansen 1023727097@qq.com
 * @LastEditTime: 2022-05-10 09:53:03
 * @FilePath: \d3-force-3d\src\radial.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import constant from "./constant.js";
//创建一个沿着指定 radius、圆心坐标在 ⟨x,y⟩ 的圆环的环形布局。如果没有指定 x 和 y 则默认为 ⟨0,0⟩

export default function(radius, x, y, z) {
  var nodes,
      nDim,
      strength = constant(0.1),
      strengths,
      radiuses;

  if (typeof radius !== "function") radius = constant(+radius);
  if (x == null) x = 0;
  if (y == null) y = 0;
  if (z == null) z = 0;

  function force(alpha) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var node = nodes[i],
          dx = node.x - x || 1e-6,
          dy = (node.y || 0) - y || 1e-6,
          dz = (node.z || 0) - z || 1e-6,
          r = Math.sqrt(dx * dx + dy * dy + dz * dz),
          k = (radiuses[i] - r) * strengths[i] * alpha / r;
      node.vx += dx * k;
      if (nDim>1) { node.vy += dy * k; }
      if (nDim>2) { node.vz += dz * k; }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    radiuses = new Array(n);
    for (i = 0; i < n; ++i) {
      radiuses[i] = +radius(nodes[i], i, nodes);
      strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(initNodes, ...args) {
    nodes = initNodes;
    nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };

  /**
   * 
   * @param {*} _ 
   * @returns 如果指定了 strength 则将强度访问函数设置为指定的数值或者方法，并重新评估每个节点的强度访问器，返回当前力模型。
   * strength 决定了节点的 x- 和 y-速度的增量。例如 0.1 表示每次应用力模型时从当前为值向最近的圆环上位置移动十分之一。
   * 值越大移动的越快，但是会牺牲其他力模型或者约束，因此建议使用 [0, 1] 之间的值
   */
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
  };

  /**
   * 
   * @param {*} _ 
   * @returns 如果指定了 radius 则将圆环的 radius 设置为指定的数值或者函数，并重新评估 radius 访问器，返回当前力模型。
   * 如果没有指定 radius 则返回当前的 radius 访问器。radius 访问器会为仿真中的每个节点进行调用，并传递当前的节点 node 以及基于 0 的索引
   */
  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  force.z = function(_) {
    return arguments.length ? (z = +_, force) : z;
  };

  return force;
}
