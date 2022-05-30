
/**
 * x- 和 y-定位力模型可以将节点沿着指定的维度进行排列。与 radial 力类似，只不过环形力的参考位置是一个闭合的环。力的强度与节点位置到目标位置的距离成正比。
 * 虽然这些里可以定位某个单个节点，但是主要用于适用于所有(或大多数)节点的全局力布局
 */
import constant from "./constant.js";

export default function(x) {
  var strength = constant(0.1),
      nodes,
      strengths,
      xz;

  if (typeof x !== "function") x = constant(x == null ? 0 : +x);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      //通过xz和strength来改变node的x轴方向的速度，使得节点像xz处靠近。
      //strength的值越大，node的速度改变的越快，即会更快的到达指定坐标位置而趋于稳定
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      //对每个node分别计算x坐标存入xz数组中，同时计算strength值
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
  };

  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), initialize(), force) : x;
  };

  return force;
}
