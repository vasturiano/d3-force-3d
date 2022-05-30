export default function(x) {
// 构造一个返回参数值的常量函数
// let a = constant(123); a() 输出： 123
  return function() {
    return x;
  };
}
