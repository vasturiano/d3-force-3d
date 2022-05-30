/**
 * collision（碰撞力） 将节点视为具有一定 radius 的圆，而不是点，并且阻止节点之间的重叠。
 * 从形式上来说，假设节点 a 和节点 b 是两个独立的节点，则 a 和 b 之间最小距离为 radius(a) + radius(b)。
 * 为减少抖动，默认情况下，碰撞检测是一个可配置 strength(强度) 和 iteration count(迭代次数) 的软约束。
 * https://cloud.tencent.com/developer/article/1682977
 * https://blog.csdn.net/QQ276592716/article/details/45999831 
*/
import {binarytree} from "d3-binarytree";
import {quadtree} from "d3-quadtree"; // 四叉树
import {octree} from "d3-octree";
import constant from "./constant.js"; // 构造常量函数
import jiggle from "./jiggle.js"; // 微小晃动随机数

// vx vy 是指当前节点的运动速度
function x(d) {
  return d.x + d.vx; // 运动一步 x + vx
}

function y(d) {
  return d.y + d.vy; // 运动一步 y + vy
}

function z(d) {
  return d.z + d.vz;
}
/**
 * 
 * @param {根据指定的 radius 创建一个新的圆形区域的碰撞检测。如果没有指定 radius 则默认所有的节点半径都为 1.} radius 
 * @returns 
 */
export default function(radius) {
  console.log("collide");
  // console.log("dddddddddddddd")
  /**
   * 如果指定了 iterations 则将每次应用碰撞检测力模型时候的迭代次数设置为指定的数值。
   * 如果没有指定 iterations 则返回当前的迭代次数，默认为 1。迭代次数越大，最终的布局越优
   * 
   * 如果指定了 strength 则将碰撞强度设置为指定的数值，强度范围为 [0, 1]。并返回当前碰撞力模型。
   * 如果没有指定 strength 则返回当前的碰撞强度，默认为 0.7.
   */
  var nodes, //所有的节点组成的数组
      nDim, //维度
      radii,//节点半径的平方？
      random, //传入的随机数
      strength = 1, // 力度
      iterations = 1;

  // radius 设置默认值，值类型为常量函数
  /**
   * radius 则表示设置节点半径访问器，radius 可以是一个数值或者方法，如果是方法则会为每个节点调用，并返回碰撞检测力模型
   * 半径访问器为仿真中的每个节点调用并传递当前的节点 node 以及基于 0 的 index。
   * 其返回值在内部被保存，这样的话每个节点的半径仅在初始化以及使用新的半径访问器时才会被调用，而不是每次应用时候重新计算
   */ 
  if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

  // 单例对象模式
  function force() {
    var i, 
        n = nodes.length,
        tree,
        node,
        xi,
        yi,
        zi,
        ri, // 半径
        ri2; // 半径平方

    //四叉树相关
    for (var k = 0; k < iterations; ++k) {
      // 以x,y访问器构建一个四叉树，即节点运动到下一步位置为坐标（就像我们走夜路，探出一步试试看）
      // visitAfter是后序遍历树的节点，执行prepare为每个节点求半径r,参数为各个节点，
      // 返回树的根节点root。
      //visitAfter函数使得对每个node都执行prepare。这里采用后序遍历的方法，因为只有知道了孩子节点的半径才能确定根节点半径
      tree =
          (nDim === 1 ? binarytree(nodes, x)
          :(nDim === 2 ? quadtree(nodes, x, y)
          :(nDim === 3 ? octree(nodes, x, y, z)
          :null
      ))).visitAfter(prepare);
      // for循环普通遍历节点
      //依次访问所有的node节点，判断其他节点是否可能与其重叠
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        if (nDim > 1) { yi = node.y + node.vy; }
        if (nDim > 2) { zi = node.z + node.vz; }
        // 前序遍历所有节点，apply返回true则不访问其子节点
        /**
         * 对于每个节点，都从根节点开始进行前序遍历
         * 以前序遍历的方式遍历所有的 node，并传入参数 node, x0, y0, x1, y1 调用指定的 callback，
         * 其中 node 为当前被遍历到的节点，⟨x0, y0⟩ 是当前节点的下界而 ⟨x1, y1⟩ 是当前节点的上界，
         * 返回四叉树
         * 如果 callback 返回真值，则当前节点的子节点将不会被遍历，否则当前节点的子节点都会被遍历到。
         */
        tree.visit(apply);
      }
    }

    //这里用于对重叠的节点进行处理，如果当前节点为根节点则判断node是否与该根节点的范围有重叠，
    //如果没有则返回true，不再访问其子节点；否则继续访问其子节点。
    //-----------上面这句话对应的是if(data)下面那个操作。访问根节点的操作在visit里有。
    //----------- 如果为根节点，此时只需比较根节点的边界，如果无重叠说明与根节点里所有值都不会有交叉
    //如果当前节点为叶子节点，执行if里面的操作
    //----------怎么判断是否是叶子结点？data = treeNode.data有值
    function apply(treeNode, arg1, arg2, arg3, arg4, arg5, arg6) {
      var args = [arg1, arg2, arg3, arg4, arg5, arg6];
      var x0 = args[0],
          y0 = args[1],
          z0 = args[2],
          x1 = args[nDim],
          y1 = args[nDim+1],
          z1 = args[nDim+2];

      var data = treeNode.data, rj = treeNode.r, r = ri + rj; //两个点与其作用域构成两个圆,圆与圆的碰撞测验
      if (data) { // 存在data说明此节点叶子节点，每个叶子节点为一个坐标点
        // 只比较index大于i的，可防止重复比较
        if (data.index > node.index) {
          // 因为这是二重循环，所有index小于自身的点坐标已经与自身判断过了，此处是为了避免重复测验
          // 设第一重循环Node[i]为节点A（xi,yi） 第二重循环为节点B(data.x,data.y)下一步运动(+=vx,+=vy)
          var x = xi - data.x - data.vx,
              y = (nDim > 1 ? yi - data.y - data.vy : 0),
              z = (nDim > 2 ? zi - data.z - data.vz : 0),
              l = x * x + y * y + z * z; // 勾股定理 d^2 = x^2 +y^2
              /**
               * 勾股定理有开方，所以这里要相乘
               */
          if (l < r * r) { // 判断是否碰撞，如果碰撞执行以下，l：实际距离平方，r：半径之和
            if (x === 0) x = jiggle(random), l += x * x; // 避免x值为0
            if (nDim > 1 && y === 0) y = jiggle(random), l += y * y; // 避免y值为0
            if (nDim > 2 && z === 0) z = jiggle(random), l += z * z;

            // strength:碰撞力的强度，可以理解为两点之间的斥力系数
            // l = 重叠长度/实际距离 * 碰撞力度
            // 重叠越多，斥力越大。斥力影响点的运动速度
            l = (r - (l = Math.sqrt(l))) / l * strength;

            /**
             * vx - 节点当前的 x-方向速度
             * vy - 节点当前的 y-方向速度
             */
            // 根据求出的斥力计算AB点新的运动速度与方向
            // A点x方向的运动速度
            // A速度 += ，B速度 -= ， 使得AB两点往相反方向运动。注意，这里的x是B到A的距离，所以是A+= ，B-=
            // 但斥力的原因会使得节点的vx ,vy 趋近于0.
            // node.vx = B-A点x方向距离(也就是x) *= 斥力(也就是l) * [（rj = B半径平方）/( A半径平方+B半径平方)](也就是r)；
            //根据两个节点间的距离和两个节点的半径和斥力对node和data的速度进行调整
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj)); //原节点
            // 同x方向
            if (nDim > 1) { node.vy += (y *= l) * r; }
            if (nDim > 2) { node.vz += (z *= l) * r; }

            data.vx -= x * (r = 1 - r); //遍历的节点
            if (nDim > 1) { data.vy -= y * r; }
            if (nDim > 2) { data.vz -= z * r; }
          }
        }
        return;
      }
      // 如果是父节点，这里需要读者理解四叉树
      // 节点坐标为中心的正方形，如果没有覆盖到该父节点的正方形区域，则该点与此父节点的任何子节点都不会发生碰撞，则无需遍历其子节点校验。
      // 返回true 不遍历子节点
      // 这也是v4 相比v3对性能优化最重要的一个步骤，成倍的减少计算量
      /**
       * x0为传入的坐标边界，xi为node节点
       */
      return x0 > xi + r || x1 < xi - r
          || (nDim > 1 && (y0 > yi + r || y1 < yi - r))
          || (nDim > 2 && (z0 > zi + r || z1 < zi - r));
    }
  }

  // 遍历树节点过滤器，返回true节点不可见
  //为所有节点设置半径
  function prepare(treeNode) {
    // quad.data是叶子节点才有的，所以这里是判断是否是叶子节点
    if (treeNode.data) return treeNode.r = radii[treeNode.data.index];
    for (var i = treeNode.r = 0; i < Math.pow(2, nDim); ++i) {
      // 因为是后序遍历，所以节点的叶子节点一定在之前已经遍历过。
      // 取叶子节点四个象限最大的r
      if (treeNode[i] && treeNode[i].r > treeNode.r) {
        treeNode.r = treeNode[i].r;
      }
    }
  }

  //初始化时通过radius函数处理nodes得到每个node的半径
  function initialize() {
    if (!nodes) return; // 判断是否有节点
    var i, n = nodes.length, node;
    radii = new Array(n);
    // 按照node.index索引排序nodes 并又 radius【后文解析】 计算出半径 后 存储在 radii
    /**
     * 这里为什么radius参数有多个？后面有
     */
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }
  /**
   * 只在初始化时被调用，可选的
   * 将 nodes 数组分配给此力模型。
   * 这个方法在将力模型通过 simulation.force 添加到仿真中并且通过 simulation.nodes 指定节点数组时被调用。可以在初始化阶段执行必要的工作，
   * 比如评估每个节点的参数特征，要避免在每次使用力模型时执行重复的工作
   * 
   * args 包含一个随机数生成器，以及当前dim维度。random会根据是否传进随机数生成函数选择随机数生成方法。
   * 
   * includes方法用来判断一个数组是否包含一个指定的值，根据情况，如果包含则返回 true，否则返回 false
   * find() 方法返回数组中满足提供的测试函数的第一个元素的值 
  */
  force.initialize = function(_nodes, ...args) {
    nodes = _nodes; // 赋值节点
    random = args.find(arg => typeof arg === 'function') || Math.random;
    nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
    initialize(); // 初始化
  };

  //iteration值越大，node节点重叠情况就会越小
  force.iterations = function(_) {
    // get or set iterations (迭代次数)
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  //strength用于在两个节点重叠时调整节点的速度
  force.strength = function(_) {
    // get or set strength(力度)
    return arguments.length ? (strength = +_, force) : strength;
  };

  //设置节点的获取半径的函数
  force.radius = function(_) {
    // 前端加+号 将字符串转为number  +"123" === 123
    // 有参数：
    // 执行1：(radius = typeof _ === "function" ? _ : constant(+_)
    //radius 值是一个返回自身的函数
    // 执行2：initialize()
    // 执行3：return force
    // 无参数：
    // 执行：return radius
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
  };

  return force;
}
