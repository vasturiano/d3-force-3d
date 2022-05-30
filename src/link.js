/**
 * link froce(弹簧模型) 可以根据 link distance 将有关联的两个节点拉近或者推远。
 * 力的强度与被链接两个节点的距离成比例，类似弹簧力
 */
//force用于控制节点之间的联系
//!将于节点相连的link的数量记作该节点的权值
import constant from "./constant.js";
import jiggle from "./jiggle.js";

function index(d) {
  return d.index;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("node not found: " + nodeId);
  return node;
}

export default function(links) {
  console.log("link");
  var id = index,
      strength = defaultStrength,
      strengths,
      distance = constant(30), //默认link的长度都为30
      distances,
      nodes,
      nDim,
      count, //count记录跟每个节点有关联的节点数量，即该节点的权值
      bias,  //bias存储每条link对应的source的权值与source和target权值和的比值
      random,
      iterations = 1;

  if (links == null) links = [];

  // //默认计算link的强度的方法
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  /**
   * 遍历所有连线，计算施加在连线两端节点的引力，最终推导出速度的变化:
   * @param {*} alpha
   * @returns 应用此力模型，可以选择观测指定的 alpha 值。
   * 通常情况下，该力在节点数组被传递给 force.initialize 之前被应用，但是某些力可能适用于节点子集或者有不同的行为，
   * 比如 d3.forceLink 被应用于每个边的 source 和 target 
   */
  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {//这里是迭代次数
      for (var i = 0, link, source, target, x = 0, y = 0, z = 0, l, b; i < n; ++i) { //遍历是对于每条边而言的
        link = links[i], source = link.source, target = link.target;
        x = target.x  - source.x  || jiggle(random);
        if (nDim > 1) { y = target.y - source.y || jiggle(random); }
        if (nDim > 2) { z = target.z - source.z  || jiggle(random); }
        //target和source的距离为l
        l = Math.sqrt(x * x + y * y + z * z);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l, z *= l;
        // console.log(bias);
        if (source.dev_net==4 || target.dev_net==4) {
        // if ((source.dev_type == 17 && target.dev_type==16) || (target.dev_type == 17 && source.dev_type==16)) {
          // bias[i] *= bias[i]
          b = Math.sqrt(bias[i])
          // console.log(bias[i]);
        // } 
        // else if (source.dev_type == 16 && target.dev_type == 16) {
          // b = Math.sqrt(b) 
          // bias[i] = Math.cbrt(bias[i])
          // console.log(bias[i]);
          // bias[i] *= bias[i]
          // console.log(bias[i]);
          // b = Math.pow(bias[i],10)
          // b = bias[i] * bias[i]
          // console.log(bias[i],"--",Math.cbrt(bias[i]));
        } else {
          b = bias[i]
        }
        // b = bias[i]
        //对target和source的速度进行调整 bias[i]越大，引力越大
        target.vx -= x * (b);
        if (nDim > 1) { target.vy -= y * b; }
        if (nDim > 2) { target.vz -= z * b; }

        source.vx += x * (1-b);
        if (nDim > 1) { source.vy += y * b; }
        if (nDim > 2) { source.vz += z * b; }
      }
    }
  }

  /**
   * 
   * @returns 初始化连线，统计每个节点的度，求每一条边的起点 (source) 度的占比，
   * 使 bias = 起点度 / (起点度 + 终点度)。
   * 每条边的默认长度 (distance) 为30，默认弹簧劲度系数 (strength) 为 1 / min(起点度, 终点度)，
   * 这是为了减小对于度较大节点的引力，提高稳定性
   */
  function initialize() {
    if (!nodes) return;
    var i,
        n = nodes.length,
        m = links.length,
         //对nodes中每个值设置id作为键值
        nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
        link;
    //计算count
    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      //将link中的source和target值作为id来查找node
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i = 0, bias = new Array(m); i < m; ++i) {
      // console.log();
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  /**
   * 
   * @param {*} _nodes 
   * @param  {...any} args 
   * @returns 将 nodes 数组分配给此力模型。
   * 这个方法在将力模型通过 simulation.force 添加到仿真中并且通过 simulation.nodes 指定节点数组时被调用。
   * 可以在初始化阶段执行必要的工作，比如评估每个节点的参数特征，要避免在每次使用力模型时执行重复的工作
   */
  force.initialize = function(_nodes, ...args) {
    nodes = _nodes;
    random = args.find(arg => typeof arg === 'function') || Math.random;
    nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };

  //像initialize(),force这样的名词意思是执行这些命令
  /**
   * 
   * @param {*} _ 
   * @returns 如果指定了 links 则将其设置为该弹簧力模型的关联边数组，并重新计算每个边的 distance 和 strength 参数，返回当前力模型。
   * 如果没有指定 links 则返回当前力模型的边数组，默认为空.
   * index - 基于 0 的在 links 中的索引, 会自动分配
   */
  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };
  /** 这里的最后面的id是上面的定义的局部变量
   * 
   * @param {*} _ 
   * @returns 如果指定了 id 则将节点的 id 访问器设置为指定的函数并返回弹簧模型。
   * 如果 id 没有指定则返回当前的节点 id 访问器，默认为数值类型的节点索引 node.index
   */
  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  /**
   * 
   * @param {*} _ 
   * @returns 如果指定了 iterations 则将迭代次数设置为指定的值并返回当前力模型。
   * 如果没有指定 iterations 则返回当前的迭代次数，默认为 1。
   * 增加迭代次数会增加约束的刚性，这对于复杂结构，如格子会有用，但是同时也会增加程序运行消耗
   */
  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  /** 这里的最后面的strength是上面的定义的局部变量
   * 
   * @param {*} _ 
   * @returns 如果指定了 strength 则将强度访问器设置为指定的数值或者方法，并重新计算每个边的强度访问器，返回当前力模型。
   * 如果没有指定 strength 则返回当前的强度访问器
   * 使用这种方法设置会自动降低连接到度大的节点的边的强度，有利于提高稳定性.
   * count(node) 是一个根据指定节点计算其出度和入度的函数.
   */
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
  };

  /** 这里的最后面的distance是上面的定义的局部变量
   * 
   * @param {*} _ 
   * @returns 如果指定了 distance 则将距离访问器设置为指定的数值或者方法，并重新计算每个边的距离访问器，返回当前力模型。
   * 如果没有指定 distance 则返回当前的距离访问器
   */
  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
  };

  return force;
}
