/*
 * @Author: lvxiansen 1023727097@qq.com
 * @Date: 2022-04-27 16:51:22
 * @LastEditors: lvxiansen 1023727097@qq.com
 * @LastEditTime: 2022-05-05 10:17:41
 * @FilePath: \d3-force-3d\src\center.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export default function(x, y, z) {
  /*
  * 设置力导图点阵中心
  * center (向心力) 可以将所有的节点的中心统一整体的向指定的位置 ⟨x,y⟩ 移动。
  * 单例对象模式
  * */
  var nodes, strength = 1; //// 使用闭包构建私有变量，存储nodes。

  if (x == null) x = 0; // 力导图中心位置 x 默认值为0
  if (y == null) y = 0; // 力导图中心位置 y 默认值为0
  if (z == null) z = 0;

  // force 单例对象
  function force() {
    var i,
        n = nodes.length,
        node, // 临时变量用于循环
        sx = 0, // 临时变量用于计算
        sy = 0, // 临时变量用于计算
        sz = 0;

    for (i = 0; i < n; ++i) {
      // sx = sum(node.x);  节点x之和
      // sy = sum(node.y);  节点y之和
      node = nodes[i], sx += node.x || 0, sy += node.y || 0, sz += node.z || 0;
    }

    //这里简化了粒子的质量，认为都相等，通过sx / n和sy / n得到所有粒子的重心
    for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, sz = (sz / n - z) * strength, i = 0; i < n; ++i) {
      // sx / n 是点阵的中心x坐标；sy / n 是点阵的中心y坐标。
      // node.x = node.x + (x - (sx / n)); 该计算与此表达式等价，这样读者应该更好理解；
      // 坐标加减即平移坐标，即将整个点阵中心平移到坐标(x,y)
      //将所有粒子的坐标向中心点靠近
      //sx的值是不会变得，因为在最开始处，i也不会变
      node = nodes[i];
      if (sx) { node.x -= sx }
      if (sy) { node.y -= sy; }
      if (sz) { node.z -= sz; }
    }
  }

  // 初始化，为nodes私有变量赋值
  force.initialize = function(_) {
    nodes = _;
  };

  // 如果传入参数x则设置x，否则返回当前力导图中心位置 x
  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  // 如果传入参数y则设置y，否则返回当前力导图中心位置 y
  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  force.z = function(_) {
    return arguments.length ? (z = +_, force) : z;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  // 返回 force对象
  return force;
}