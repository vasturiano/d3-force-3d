export default function(random) {
  // 微小晃动随机数
  return (random() - 0.5) * 1e-6;
}
