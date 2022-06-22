/*
 * @Author: lvxiansen 1023727097@qq.com
 * @Date: 2022-04-27 16:51:22
 * @LastEditors: lvxiansen 1023727097@qq.com
 * @LastEditTime: 2022-05-31 21:16:40
 * @FilePath: \d3-force-3d\src\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 节点与节点间模拟同种电荷相互排斥，并将节点存入四叉树中，利用 Barnes–Hut 近似来减少节点间电荷斥力的计算量。
 * 同时连线间的节点模拟弹簧牵引力，节点的速度综合斥力引力得出，并发生阻尼衰减，最终达到整图平衡
 */
export {default as forceCenter} from "./center.js";
export {default as forceCollide} from "./collide.js";
export {default as forceLink} from "./link.js";
export {default as forceManyBody} from "./manyBody.js";
export {default as forceRadial} from "./radial.js";
export {default as forceSimulation} from "./simulation.js";
export {default as forceX} from "./x.js";
export {default as forceY} from "./y.js";
export {default as forceZ} from "./z.js";
export {default as forceCluster } from './cluster.js';
export { default as forceLimit } from './limit';
