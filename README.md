# CDhz · 透明 CD 盒

在线体验：https://baiyungugugu-boop.github.io/CDhz/

一个用 three.js 从零编写的 3D 透明 CD 盒网页（代码与素材均为原创，默认封面由程序实时生成）。

## 功能
- 透明塑料外壳：物理折射（transmission / IOR 1.5 / 清漆反光），环境光由程序生成
- 外壳颜色、透明度可调
- 上传自己的照片作为封面，光盘印刷面同步显示（也可单独上传光盘图案）
- 打开盒盖：铰链动画，光盘升起旋转并泛出彩虹光（iridescence）
- 自动旋转开关与速度；拖动旋转，滚轮/双指缩放
- 一键保存截图；手机、电脑都能用（手机点右上角 ⚙︎ 打开设置）
- 网址加 `?open` 可直接以打开状态展示

## 文件
`index.html` / `style.css` / `main.js`，three.js r160 放在 `vendor/`（MIT 许可）。
