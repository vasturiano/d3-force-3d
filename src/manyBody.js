/**
 * many-body在所有的节点之间相互作用。
 * 如果 strength 为正可以被用来模拟重力(吸引力)，如果强度为负可以用来模拟排斥力。
 * 这个力模型的实现采用四叉树以及 Barnes–Hut approximation大大提高了性能。
 * 精确度可以使用 theta 参数自定义。
 * 与弹簧力不同的是，弹簧力仅仅影响两端的节点，而电荷力是全局的: 每个节点都受到其他所有节点的影响，甚至他们处于不连通的子图
 *
 *
 * 为什么采用BH算法以及四叉树？
 * 因为对于每个节点要计算其它所有节点对它的作用力，这样时间复杂度就是n方
 * 因为有些节点距离当前节点很远，所以可将多个节点看成一团，质量就是整体质量，中心点是它们的质心。这就是BH算法。
 * 那如何分辨哪些节点距离这个节点远呢,如何将这些节点团的边界也即矩阵大小找到呢？用到四叉树。
 * 当节点团的面积/（节点团的质心坐标与当前节点坐标的距离的平方）< theta时，将之看做一团。否则仍逐个遍历。
 *
 *
 * 四叉树如何划分空间的？如果当前平面如果当前平面（或空间）所含的质点数量大于 1，
 * 则把该平面等分成四个子平面，并按照同样的方法递归地分割这四个子平面，直到每个子平面只包含一个质点为止
 * 四叉树怎么判断是内部节点还是叶子结点？
 * length 属性可以用来区分叶节点和内部节点：如果是叶节点则为 undefined，如果是 4 则为内部节点。（因为平面中为四叉树）
 */
import {binarytree} from "d3-binarytree";
import {quadtree} from "d3-quadtree";
import {octree} from "d3-octree";
import constant from "./constant.js";
import jiggle from "./jiggle.js";
import {x, y, z} from "./simulation.js";
import distancefile from "./allCapital.json"
import codeToProvince from "./codeToProvince.json"
export default function() {
  //获得省会之间距离,将之放入capDistance字典里
  var distance = distancefile.distances
  // var capDistance = distance.map(function(d,i) {
  //   return ({[d.city1+"-"+d.city2]:d.distance})
  // })
  var sumDistance = 0,averageAllDistance = 0,countProv = 0;
  var capDistance = new Map();
  distance.forEach(function(d) {
    capDistance.set(d.city1+"-"+d.city2,d.distance)
    sumDistance += +(d.distance)
    countProv++
  })
  averageAllDistance = sumDistance/countProv
  //获得各省代码与省会之间转换关系
  var codeToCap = codeToProvince.mapping
  var hashcodeToCap = new Map()
  codeToCap.forEach(d=>hashcodeToCap.set(d.prov_aid,d.prov))
  hashcodeToCap.set(11022,"上海")
  console.log("manybody!!!!!!!");
  var nodes,
      nDim,
      node,
      random,
      alpha,
      //当strength为正值时粒子间会互相吸引，当为负值时粒子间会互相排斥
      //在这里表现为当strength为正值时，两个互相作用的粒子速度会增加，互相靠近；为负值时，两个粒子速度减小，互相远离。
      strength = constant(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      weight = new Map(),
      theta2 = 0.81; //theta用于判断距离远近而采取不同的方法对粒子的速度进行处理
      // theta2 = 0; //theta用于判断距离远近而采取不同的方法对粒子的速度进行处理
      weight.set(16,2)
      weight.set(17,3)
  function force(_) {
    // console.log("aaa"); //调用200次
    var i,j,
        n = nodes.length;
    var currentSumDistance = 0;
    var tree =
            (nDim === 1 ? binarytree(nodes, x)
            :(nDim === 2 ? quadtree(nodes, x, y) //执行这个函数时已经构造完成了
            :(nDim === 3 ? octree(nodes, x, y, z)
            :null
        ))).visitAfter(accumulate);
    var averageDistance = getCurrentAverageDistance(n)
    // for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], distanceForce(node,n,averageDistance);
    // console.log(averageDistance);
    // console.log(averageAllDistance);
  }


  function getCurrentAverageDistance(n) {
    var provinceSet = new Set()
    var currentSumDistance = 0,currentValidCount = 0;
    for (var i=0;i<n;i++) {
      var node = nodes[i]
      for (var j=0;j<n;j++) {
        var treeNode = nodes[j]
        if (node.prov_aid != treeNode.prov_aid) {
          if ((hashcodeToCap.get(node.prov_aid) != undefined) && hashcodeToCap.get(treeNode.prov_aid) != undefined) {
            var keyOfcap = hashcodeToCap.get(node.prov_aid)+"-"+hashcodeToCap.get(treeNode.prov_aid)
            if (!provinceSet.has(keyOfcap)) {
              provinceSet.add(keyOfcap)
              var valueOfcapDistance = capDistance.get(keyOfcap)
              if (valueOfcapDistance>0) {
                currentSumDistance += +(valueOfcapDistance)
                currentValidCount++
              }
            }
          }
        }
      }
    }
    var averageDistance = Math.floor(currentSumDistance/currentValidCount)
    return averageDistance
  }
  function distanceForce(node,n,averageDistance) {
    for (var j=0;j<n;j++) {
      var treeNode = nodes[j]
      // console.log("aaaa");
      if (treeNode !== node) {
      var x = treeNode.x - node.x,
          y = (nDim > 1 ? treeNode.y - node.y : 0),
          z = (nDim > 2 ? treeNode.z - node.z : 0),
          l = x * x + y * y + z * z;
          var w = strengths[treeNode.index] * alpha / l ;
          // w = w/averageAllDistance
          // console.log(node,treeNode);
          if (node.prov_aid != treeNode.prov_aid) {
            if ((hashcodeToCap.get(node.prov_aid) != undefined) && hashcodeToCap.get(treeNode.prov_aid) != undefined) {
              var keycap = hashcodeToCap.get(node.prov_aid)+"-"+hashcodeToCap.get(treeNode.prov_aid)
              var keycapDistance = capDistance.get(keycap)
              // if (+(keycapDistance) > averageDistance) {
                w = w * Math.pow(keycapDistance/averageDistance,2)
                // w = w/10
                node.vx += x * w ;
                if (nDim > 1) { node.vy += y * w; }
                if (nDim > 2) { node.vz += z * w; }
              // }
            } else {
              // w = w/10
              node.vx += x * w;
              if (nDim > 1) { node.vy += y * w; }
              if (nDim > 2) { node.vz += z * w; }
            }
          } else {
            // w = -w
            w = 0
            // w = w/10
            // w = w * Math.pow(keycapDistance/averageDistance,2)
            node.vx += x * w;
            if (nDim > 1) { node.vy += y * w; }
            if (nDim > 2) { node.vz += z * w; }
          }
      }
    }
    // console.log(node.vx);
  }
  /**
   *
   * @returns 初始化各个节点的strength
   */
  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i){
      node = nodes[i];
      strengths[node.index] = +strength(node, i, nodes);
    }
  }

  /**
   * 自四叉树由下而上，即后序方式，求所有节点的合坐标与合静电电荷量(quadTree),value是电量，x是坐标
   * 求解时对于索引节点（叶子结点），使用quad.x=∑(),对于合电荷量直接相加。
   * 而对于真实节点（叶节点），坐标即为当前真实节点坐标，静电电荷量则为真实节点及其下挂真实节点 strength 总和
   *
   * 每一个单独的点都放置在一个单独的 node 中；重合的点由链表表示.
   * data - 与当前点关联的数据，也就是传递给 quadtree.add 的数据
   * treNode是四叉树中的节点，是一个结构体，里面有一项就是具体的data,还有x,y,value等数据
   * 也就是说如果看做一团时取treeNode的值，如果是单个节点取treeNode.data也即每个节点的值
   * 为什么没有左子树和右子树？因为这里是用链表表示的
   * @param {*} treeNode
   */
  function accumulate(treeNode) {
    var strength = 0, q, c, weight = 0, x, y, z, i; //strength可以看做节点的电荷力或重量
    var numChildren = treeNode.length;

    // For internal nodes, accumulate forces from children.
     // 对于内部节点，积累来自子节点的力。内部节点不存放节点数据data.
    if (numChildren) {
      for (x = y = z = i = 0; i < numChildren; ++i) {
        if ((q = treeNode[i]) && (c = Math.abs(q.value))) { //treeNode[i]存在且电荷量q.value不为空
          strength += q.value, weight += c, x += c * (q.x || 0), y += c * (q.y || 0), z += c * (q.z || 0);
        }
      }
      //根据维度数量衡量累积强度 https://github.com/d3/d3-force/issues/95
      strength *= Math.sqrt(4 / numChildren); // scale accumulated strength according to number of dimensions

      treeNode.x = x / weight;
      if (nDim > 1) { treeNode.y = y / weight; }
      if (nDim > 2) { treeNode.z = z / weight; }
    }

    // For leaf nodes, accumulate forces from coincident nodes.
     // 对于叶子节点，根据其是否有相同节点来计算strength值
     /**
      * data - 与当前点关联的数据，也就是传递给 quadtree.add 的数据
      * next - 当前叶节点的下一个数据，如果有的话
      */
    else {
      q = treeNode;
      q.x = q.data.x;
      if (nDim > 1) { q.y = q.data.y; }
      if (nDim > 2) { q.z = q.data.z; }
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    treeNode.value = strength;
  }

  /**
   *
   * 如果四叉树单元的宽度w与从节点到单元质心的距离l的比值w/l小于θ，
   * 则给定单元中的所有节点都被视为单个节点，而不是单独处理
   * 这里怎么判断某个节点是否被遍历过？因为是链表，所以直接遍历就行，不会有回溯
   * treeNode是前序遍历时遍历到的临时节点，node全局变量，是原始所有节点中的一个。
   * @param {treeNode 为四叉树索引节点，内有索引下属子节点的合坐标 (quad.x,quad.y) 和合电荷量} treeNode
   * @param {*} x1
   * @param {*} arg1
   * @param {*} arg2
   * @param {*} arg3
   * @returns callback返回 true 意味着，当前节点及其子节点已完成计算，否则需要继续向下遍历其所有子节点
   */
  function apply(treeNode, x1, arg1, arg2, arg3) {
    if (!treeNode.value) return true;
    //用于选择不同维度下的值，ndim为3时，选择arg3
    var x2 = [arg1, arg2, arg3][nDim-1];
    var x = treeNode.x - node.x, //当前节点 (node) 与象限合节点 (treeNode) 形成矩阵的边长
        y = (nDim > 1 ? treeNode.y - node.y : 0),
        z = (nDim > 2 ? treeNode.z - node.z : 0),
        w = x2 - x1, //当前象限局域边长，后面用于求面积
        l = x * x + y * y + z * z; //当前节点 (node) 与象限合节点 (treeNode) 形成矩阵面积

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    // 如果quad和node间的距离较远则根据value、alpha和l来调整node的速度
    //http://www.blackganglion.com/2016/09/07/d3-force%E5%8A%9B%E5%AF%BC%E5%BC%95%E5%B8%83%E5%B1%80%E5%8E%9F%E7%90%86%E4%B8%8E%E5%89%96%E6%9E%901/
    if (w * w / theta2 < l) { //将一团节点看做一个节点
      if (l < distanceMax2) {
        if (x === 0) x = jiggle(random), l += x * x;
        if (nDim > 1 && y === 0) y = jiggle(random), l += y * y;
        if (nDim > 2 && z === 0) z = jiggle(random), l += z * z;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        // l越大，力的强度越小，node.vx可看做移动的速度，也就是力的大小
        node.vx += x * treeNode.value * alpha / l;
        if (nDim > 1) { node.vy += y * treeNode.value * alpha / l; }
        if (nDim > 2) { node.vz += z * treeNode.value * alpha / l; }
      }
      //此时该节点的子节点不会继续遍历，控制逻辑在visit中
      return true;
    }

    // Otherwise, process points directly.
    // 如果quad为非子节点则返回去访问其子节点，此时处于不使用BH算法的情况分支
    //无法采用 Barnes-Hut 近似且 quad 有节点，或 l 大于距离上限，需要继续向下遍历
    else if (treeNode.length || l >= distanceMax2) return;

    //quad和node相同时不会执行以下过程
    // 排除自身对自身影响，由于遍历可能会遍历到自己所以有这个判断
    //当quad和node间距离较近时，同时要考虑strength来调整node的速度
    // Limit forces for very close nodes; randomize direction if coincident.
    if (treeNode.data !== node || treeNode.next) { //data就是具体的node节点，肯定唯一
      if (x === 0) x = jiggle(random), l += x * x;
      if (nDim > 1 && y === 0) y = jiggle(random), l += y * y;
      if (nDim > 2 && z === 0) z = jiggle(random), l += z * z;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    //对每个节点单独处理，递归处理该正方形区域的所有子区域。为什么会有递归，因为这是树，肯定要递归处理
    do if (treeNode.data !== node) {
      // console.log("aaaa");
      w = strengths[treeNode.data.index] * alpha / l;
        // if (node.dev_type == 17 && treeNode.data.dev_type == 16) {
        //   w = w/2
        // }
        //
        // if (node.dev_type == 16 && treeNode.data.dev_type == 16) {
        //   w = w*2
        // }
        //是否可以让系数为dev_type的权重相比
        // if (node.dev_type == treeNode.data.dev_type) {
        //   w = w*weight.get(node.dev_type)
        // }
      node.vx += x * w;
      if (nDim > 1) { node.vy += y * w; }
      if (nDim > 2) { node.vz += z * w; }
    } while (treeNode = treeNode.next);
  }

  force.initialize = function(_nodes, ...args) {
    nodes = _nodes;
    random = args.find(arg => typeof arg === 'function') || Math.random;
    nDim = args.find(arg => [1, 2, 3].includes(arg)) || 2;
    initialize();
  };

  /**
   *
   * @param {*} _
   * @returns 如果指定了 strength 则将强度访问器设置为指定的数值或者方法，重新评估每个节点的强度访问器并返回此电荷力。
   * 若强度为正值则表示节点之间相互吸引，负值表示节点之间相互排斥。
   * 如果没有指定 strength 则返回当前的强度访问器
   */
  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
  };

  /**
   *
   * @param {*} _
   * @returns 如果指定了 distance 则设置电荷力模型的最小节点间距参考距离。
   * 如果没有指定 distance 则返回当前默认的最小参考距离，默认为 1。
   * 最小间距在相邻的节点之间建立了一个强度上限以避免不稳定的情况。
   * 极端的情况是两个节点完全重叠，则它们之间的斥力可能无限大，此时力的方向是随机的，因此设置最小间距是必要的
   */
  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  /**
   *
   * @param {*} _
   * @returns 如果指定了 distance 则将节点之间的最大距离设置为指定的值并返回当前力模型。
   * 如果没有指定 distance 则返回当前默认的最大距离，默认为无穷大。
   * 指定最大间距可以提高性能，有利于生成局部布局。
   */
  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  /**
   *
   * @param {*} _
   * @returns 如果指定了 theta 则 Barnes–Hut 算法的临界阈值设置为指定的值并返回当前力模型。
   * 如果没有指定 theta 则返回当前的值，默认为 0.
   * 为了加快计算，这个力模型基于 Barnes–Hut approximation进行实现，其时间复杂度为 O(n log n)，其中 n 为 nodes 个数。
   * 在每次应用中，quadtree存储当前节点的位置；然后对于每个节点，计算其受其他所有节点的合力。
   * 对于距离很远的节点群，可以通过聚类将其视为一个更大的节点来模拟电荷力。
   * theta 参数决定了这种近似精度：如果比率 w / l (w 表示四叉树正方形的宽度，l 表示节点到正方形中心的距离) 小于 theta 则将该正方形内的所有节点视为一个单独的节点
   */
  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  return force;
}
