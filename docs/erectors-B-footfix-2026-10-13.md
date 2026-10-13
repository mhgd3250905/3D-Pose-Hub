# 瑞士球背伸 · 鞋向修正（2026-10-13）

用户观看修正版后明确认可，并要求阶段版本管理与保存。当前认可限定于本鞋向修正版，不将其它38项原review或App真机验收一并销项。实现保存点为`a636b705432414dc3bf329372167e8116370dcd0`，阶段边界见[版本台账](../app/docs/version-ledger.md#2026-10-13-素材制作阶段收口)。

用户检查新人体素材库后指出鞋方向反了。原规格双脚`heading:-90, pitch:58`使鞋尖朝背后的墙（−X），与身体前下方向不协调。修正版双脚改为`heading:90`，保留58°俯角、脚踝位置、人体标准、原8秒动作、球、高亮和相机；鞋跟应靠墙、鞋尖朝身体前下方。

只旋转鞋会让鞋跟进入原墙约18.98mm，因此墙面从X=−0.5256调整到−0.545584，后移19.984mm，留下约1.0002mm间距。没有移动脚踝或重新调整腿/骨盆与球的接触。原59份规格、94项冻结批次、原素材包与App51视频保持。

当前选用[修订规格](../tools/drill-anim/revisions/erectors-B-footfix-20261013/spec.json)，完整复现使用[专用重渲工具](../tools/drill-anim/render-footfix.mjs)和原`met-cycle.json`的求解值/腕部目标重放，不能把独立spec冒称完整复现配方。人体仍`training-human-v2`，外观2.0.0／制作入口2.0.1，不修改网格或骨架。

制作输出`output/training-human-v2-erectors-B-footfix-20261013`含240帧／8秒的1080母版、720手机版、540封面，以及QA/规格/来源SHA/逐帧保真证明。240周期帧加2秒静帧共241次检查，不是241个独立时间点：所有非脚骨骼矩阵差、除Toe外关节差均0；0、2、3.2秒真实原接触求解与重放的非脚矩阵差均0。每帧全部17867鞋顶点（左8918、右8949）检查鞋尖+X、鞋底最低Y数值零、距墙0–2mm；实测约1.0002mm。双脚漂移0，QA通过、求解警告0、画面触边0。

更新版完整素材库在`output/training-human-v2-library-footfix-20261013`，画廊`http://127.0.0.1:8874/index.html`。仍选用94项（56ready/38review），仅瑞士球背伸选用新文件名`erectors-B-footfix`，其它93项沿用原媒体；旧瑞士球文件与全部原证据也保留。新两种视频经过独立完整CPU解码、尺寸/240帧/8秒/哈希核对，原93项媒体哈希与前次独立解码记录绑定。整包1930文件，1929条SHA回读一致、1776条相对链接有效；包清单SHA为`0c2555721a738ca7e3e120f18dd7c7bbf95ca2321873822f30c5f9e72a98fd43`。包内保留旧目标表和专用工具，但不含全部3D资产或运行时依赖，不承诺异机直接重渲。

在390×844浏览器实际播放新720视频，readyState4、paused=false、error=null、duration8，文档宽390无溢出；证据在`output/playwright/erectors-B-footfix-20261013/ui-check.json`、`phone-playback.png`。包回读在`output/rerender-planning-20261013/footfix-portable-verification.json`。这是素材预览检查，当前App仍L43/v41，未替换App视频或安装新包。
