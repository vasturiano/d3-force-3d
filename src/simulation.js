//d3.forceSimulation用于设置节点和相关参数
import {dispatch} from "d3-dispatch";
import {timer} from "d3-timer";
import lcg from "./lcg.js";

var MAX_DIMENSIONS = 3;

export function x(d) {
  return d.x;
}

export function y(d) {
  return d.y;
}

export function z(d) {
  return d.z;
}

var initialRadius = 10,
    initialAngleRoll = Math.PI * (3 - Math.sqrt(5)), // Golden ratio angle
    initialAngleYaw = Math.PI * 20 / (9 + Math.sqrt(221)); // Markov irrational number

export default function(nodes, numDimensions) {
  // console.log("d3-force-3d");
  numDimensions = numDimensions || 2;
  var nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(numDimensions))),
      simulation,
      // count = 1,
      // cishu = 1,
      alpha = 1,    //alpha表示simulation当前的状态
      /**
       * alphaMin与target区别：alphaMin设置最小 alpha，当当前 alpha 低于它时，它将负责停止模拟。
       * 因此，如果将设置为alphaTarget高于的值alphaMin，则模拟永远不会停止
       * 如果alphaTarget的值设置的比alphaMin小，就会卡住，不会继续更新
       * https://blog.csdn.net/juzipidemimi/article/details/100787059
       * https://stackoverflow.com/questions/46426072/what-is-the-difference-between-alphatarget-and-alphamin#comment79812382_46426072
       */
      //这里改不会生效，因为three-forcegraph会修改默认值
      alphaMin = 0.001, //仿真内部，会不断的减小 alpha 值直到 alpha 值小于 最小 alpha
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), //alphaDecay表示alpha每次的衰减率,衰减系数决定了布局冷却的快慢
      alphaTarget = 0,  //alphaTarget表示最终要稳定时的状态
      velocityDecay = 0.6, //velocityDecay表示速度的衰退率
      forces = new Map(),  //用于存储force函数
      stepper = timer(step), //定义一个新的定时器，然后重复执行指定的 callback 直到定时器被 stopped
      event = dispatch("tick", "end"),  //simulation包含以下两种类型的事件
      random = lcg();

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation); //自定义的tick函数，在这里被调用
    if (alpha < alphaMin) {   //当alpha小于临界值即alphaMin时，停止计时
      stepper.stop();
      event.call("end", simulation);   //自定义的end函数在这里调用
    }
  }

  //按指定的迭代次数手动执行仿真，并返回仿真。如果没有指定 iterations 则默认为 1，也就是迭代一次
  function tick(iterations) {
    // console.log(alpha,"---------------------");
    // count++
    // console.log(count,"!!!!!!!!!!!!!!!!")
    // if (count >2) {
    //   stepper.stop()
    // }
    // console.log("---------------------");
    var i, n = nodes.length, node;
    if (iterations === undefined) iterations = 1;
    // var num = 1
    // alpha不断衰减
    for (var k = 0; k < iterations; ++k) {
      // num++
      alpha += (alphaTarget - alpha) * alphaDecay; //计算当前的 alpha 值
      // console.log(alpha)
      //alpha用于force中对速度vx和vy进行设置
      forces.forEach(function (force) {
        force(alpha); //调用注册的 力模型，并传入当前新的 alpha 值
      });

      //通过 velocity × [velocityDecay] 来递减每个节点的速度；最后根据速度计算出每个节点的位置
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        //fx和fy是node的固定点，如果设置了该属性则node会固定在该位置
        //这里简化了物理作用力，将当前位置坐标加上当前速度得到下一步的位置坐标
        if (node.fx == null) node.x += node.vx *= velocityDecay; //节点当前的 x-方向速度
        // 具有fx，说明当前节点被控制，不需要受到力的影响，速度置为0
        else node.x = node.fx, node.vx = 0;
        if (nDim > 1) {
          if (node.fy == null) node.y += node.vy *= velocityDecay;
          else node.y = node.fy, node.vy = 0;
        }
        if (nDim > 2) {
          if (node.fz == null) node.z += node.vz *= velocityDecay;
          else node.z = node.fz, node.vz = 0;
        }
      }
    }

    return simulation;
  }

  //初始化导入节点,添加index、x、y、vx、vy，并将节点按一定的半径和旋转角度环绕起来，形成叶子状
  /**每个 node 必须是一个对象类型
   * 位置 ⟨x,y⟩ 以及速度 ⟨vx,vy⟩ 随后可能被仿真中的 力模型 修改
   *  如果 vx 或 vy 为 NaN, 则速度会被初始化为 ⟨0,0⟩. 
   * 如果 x 或 y 为 NaN, 则位置会按照 phyllotaxis arrangement被初始化, 这样初始化布局是为了能使得节点在原点周围均匀分布
   */
  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      node.sourceCount = 0
      //如果node中不含x、 y值，则按默认方法计算。
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (node.fz != null) node.z = node.fz;
      if (isNaN(node.x) || (nDim > 1 && isNaN(node.y)) || (nDim > 2 && isNaN(node.z))) {
        var radius = initialRadius * (nDim > 2 ? Math.cbrt(0.5 + i) : (nDim > 1 ? Math.sqrt(0.5 + i) : i)),
          rollAngle = i * initialAngleRoll,
          yawAngle = i * initialAngleYaw;
        if (nDim === 1) {
          node.x = radius;
        } else if (nDim === 2) {
          node.x = radius * Math.cos(rollAngle);
          node.y = radius * Math.sin(rollAngle);
        } else { // 3 dimensions: use spherical distribution along 2 irrational number angles
          node.x = radius * Math.sin(rollAngle) * Math.cos(yawAngle);
          node.y = radius * Math.cos(rollAngle);
          node.z = radius * Math.sin(rollAngle) * Math.sin(yawAngle);
        }
      }
      //如果不含vx、vy值，则默认为0。
      if (isNaN(node.vx) || (nDim > 1 && isNaN(node.vy)) || (nDim > 2 && isNaN(node.vz))) {
        node.vx = 0;
        if (nDim > 1) { node.vy = 0; }
        if (nDim > 2) { node.vz = 0; }
      }
    }
  }

  /**
   * @param {*} force force是一个具体的力
    * 力模型可以选择通过 force.initialize 来接收仿真的节点数组
    * 将 nodes 数组分配给此力模型。
    * 这个方法在将力模型通过 simulation.force 添加到仿真中并且通过 simulation.nodes 指定节点数组时被调用。
    * 可以在初始化阶段执行必要的工作，比如评估每个节点的参数特征，
    * 要避免在每次使用力模型时执行重复的工作。
   * @returns 
   */
  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes, random, nDim);
    return force;
  }

  initializeNodes();

  return simulation = {
    /**
     * 按指定的迭代次数手动执行仿真，并返回仿真。如果没有指定 iterations 则默认为 1，也就是迭代一次(单步)。 
     *      对于每一次迭代，仿真都会通过 (alphaTarget - alpha) × alphaDecay 计算当前的 alpha 值。
     *      然后调用注册的 力模型，并传入当前新的 alpha 值；
     *      然后通过 velocity × [velocityDecay] 来递减每个节点的速度；
     *      最后 最后根据速度计算出每个节点的位置。 
     *      这个方法不会派发 events；事件仅仅在创建仿真自动启动或者使用 simulation.restart 时通过内部的定时器触发。
     * 自然迭代次数为 ⌈log(alphaMin) / log(1 - alphaDecay)⌉ 也就是默认为 300 次。 
     * 这个方法可以与 simulation.stop 结合使用计算一个 static force layout(静态力导向布局) 。对于规模比较大的图，静态布局应该使用 worker计算避免阻塞用户界面。
     */
    tick: tick,

    /**
     * 
     * @returns 重新启动仿真的内部定时器并且返回仿真。与 simulation.alphaTarget 或 simulation.alpha 结合使用，
     * 这个方法可以在交互期间再次激活仿真，比如拖拽节点或者在使用 simulation.stop 临时暂停仿真后使用
     */
    restart: function() {
      return stepper.restart(step), simulation;
    },

    /**
     * 
     * @returns 暂停仿真内部的定时器并返回当前仿真。如果仿真内部定时器已经处于停止状态则什么都不做。
     * 这个方法在手动运行仿真时很有用，参考 simulation.tick
     */
    stop: function() {
      return stepper.stop(), simulation;
    },

    numDimensions: function(_) {
      return arguments.length
          ? (nDim = Math.min(MAX_DIMENSIONS, Math.max(1, Math.round(_))), forces.forEach(initializeForce), simulation)
          : nDim;
    },

     //设置nodes时会对所有的force进行初始化，这是主要步骤
     /** 这里的.force可以看做是simulation后加上去的
      * var simulation = d3.forceSimulation().force("link", d3.forceLink().id(function(d) { return d.id; }))
      * simulation.nodes(graph.nodes).on("tick", ticked);
      */
     /**
      * 
      * @param {*} _ 
      * @returns 如果指定了 nodes 则将仿真的节点设置为指定的对象数组，并根据需要创建它们的位置和速度(也就是x,y,vx,vy)，然后 重新初始化 绑定的 力模型，并返回当前仿真。
      * 如果没有指定 nodes 则返回当前仿真的节点数组。
      */
    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },

    /**
     * 
     * @param {*} _ 
     * @returns 如果指定了 alpha 则将仿真的当前 alpha 值设置为指定的值，必须在 [0,1] 之间。
     * 如果没有指定 alpha 则返回当前的 alpha 值，默认为 1
     */
    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    /**
     * 
     * @param {*} _ 
     * @returns 如果指定了 min 则将 alpha 的最小值设置为指定的值，需要在 [0, 1] 之间。
     * 如果没有指定 min 则返回当前的最小 alpha 值，默认为 0.001. 
     * 在仿真内部，会不断的减小 alpha 值直到 alpha 值小于 最小 alpha。
     * 默认的 alpha decay rate(alpha 衰减系数) 为 ~0.0228，因此会进行 300 次迭代
     */
    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    /**
     * @returns 如果指定了 decay 则将当前的 alpha 衰减系数设置为指定的值，要在[0, 1] 之间。
     * 如果没有指定 decay 则返回当前的 alpha 衰减系数，默认为 0.0228… = 1 - pow(0.001, 1 / 300)，其中 0.001 是默认的 最小 alpha. 
     * alpha 衰减系数定义了当前的 alpha 值向 target alpha 迭代的快慢。
     * 默认的目标 alpha 为 0 因此从布局形式上可以认为衰减系数决定了布局冷却的快慢。
     * 衰减系数越大，布局冷却的越快，但是衰减系数大的话会引起迭代次数不够充分，导致效果不够好。
     * 衰减系数越小，迭代次数越多，最终的布局效果越好。
     * 如果想要布局永远停不下来则可以将衰减系数设置为 0；也可以设置 target alpha 大于 minimum alpha 达到相同的效果
     */
    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    /**
     * 
     * @param {*} _ 
     * @returns 如果指定了 target 则将当前的目标 alpha 设置为指定的值，需要在 [0, 1] 之间。
     * 如果没有指定 target 则返回当前默认的目标 alpha 值, 默认为 0.
     */
    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    /**
     * 
     * @param {*} _ 
     * @returns 如果指定了 decay 则设置仿真的速度衰减系数并返回仿真，范围为 [0, 1]。
     * 如果没有指定 decay 则返回当前的速度衰减系数，默认为 0.4，衰减系数类似于阻力。
     * 每次 tick 结束后每个节点的速度都会乘以 1 - decay 以降低节点的运动速度。
     * 速度衰减系数与 alpha decay rate 类似，较低的衰减系数可以使得迭代次数更多，其布局结果也会更理性，但是可能会引起数值不稳定从而导致震荡
     */
    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    randomSource: function(_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },

    //force函数，该函数用来模拟物理作用力来改变nodes的位置和速度
    /**
     * 
     * @param {*} name 
     * @param {*} _ 
     * @returns 如果指定了 force(指形参里的force) 则表示为仿真添加指定 name 的 力模型 并返回仿真。
     * 如果没有指定 force 则返回当前仿真的对应 name 的力模型，如果没有对应的 name 则返回 undefined。 
     * (默认情况下仿真没有任何力模型，需要手动添加)如果要移除对应的 name 的仿真，可以为其指定 null
     */
    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    /**
     * 
     * @returns 返回距离 ⟨x,y⟩ 位置最近的节点，并可以指定搜索半径 radius。 
     * 如果没有指定 radius 则默认为无穷大。如果在指定的搜索区域内没有找到节点，则返回 undefined
     */
    find: function() {
      // shift() 方法从数组中删除第一个元素，并返回该元素的值。
      var args = Array.prototype.slice.call(arguments);
      var x = args.shift() || 0,
          y = (nDim > 1 ? args.shift() : null) || 0,
          z = (nDim > 2 ? args.shift() : null) || 0,
          radius = args.shift() || Infinity;

      var i = 0,
          n = nodes.length,
          dx,
          dy,
          dz,
          d2,
          node,
          closest;

      radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - (node.y || 0);
        dz = z - (node.z ||0);
        d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    /**
     * 
     * @param {*} name 
     * @param {*} _  
     * @returns 如果指定了 listener 则将其指定的 typenames 的回调。
     * 如果对应的 typenames 已经存在事件监听器，则将其替换。
     * 如果 listener 为 null 则表示移除对应 typenames 的事件监听器。
     * 如果没有指定 listener 则返回第一个符合条件的 typenames 对应的事件监听器，当指定的事件触发时，每个回调都会被调用，回调中 this 指向仿真本身
     */
    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}
