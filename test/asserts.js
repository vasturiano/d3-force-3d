/*
 * @Author: lvxiansen 1023727097@qq.com
 * @Date: 2022-04-27 16:51:22
 * @LastEditors: lvxiansen 1023727097@qq.com
 * @LastEditTime: 2022-05-20 20:37:02
 * @FilePath: \d3-force-3d\test\asserts.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import assert from "assert";

export function assertNodeEqual(actual, expected, delta = 1e-6) {
  assert(nodeEqual(actual, expected, delta), `${actual} and ${expected} should be similar`);
}

function nodeEqual(actual, expected, delta) {
  return actual.index == expected.index
      && Math.abs(actual.x - expected.x) < delta
      && Math.abs(actual.vx - expected.vx) < delta
      && Math.abs(actual.y - expected.y) < delta
      && Math.abs(actual.vy - expected.vy) < delta
      && !(Math.abs(actual.fx - expected.fx) > delta)
      && !(Math.abs(actual.fy - expected.fy) > delta);
}
