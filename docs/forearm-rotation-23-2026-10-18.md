# 023 · 站姿屈肘前臂旋转

## 缺口、分类与查重
无器械徒手／肌肉训练（低负荷主动活动控制辅助标签）／前臂旋前旋后肌群／桡尺关节旋转。办公适用，无坐地、跪地或躺地。单一教学目标：上臂保持稳定、肘屈约90°，前臂带手掌缓慢朝上/朝下转动，腕保持中立。不把它标成被动拉伸或高强度力量训练。
逐一读出208份spec的id及名称，核对相邻规格：018扶墙腕屈肌拉伸与020主动腕伸肌拉伸是腕屈伸；forearms-A是承重腕多向摇摆，forearms-B为哑铃腕屈伸，forearms-C为倒握行走；rotator-cuff-B/C和h-side-er改变肩旋转、使腕绕肘走弧，和本项固定肘腕的轴向前臂旋转不同。
初选扶椅徒手髋后伸已查到h-chair-kickback，因本质重复而在写入前撤销，不能用小幅度/入门名称冒充新增。023转向独立上肢缺口；没有重试两轮失败的坐姿、地面或束带问题。

## 动作依据与边界
2026-10-18核实 Cambridge University Hospitals 的 Elbow Range of Movement Exercises，Supination (palm up) and Pronation (palm down)，以及 University Hospitals Sussex 的 Elbow and wrist exercises，Forearm Rotations：肘在身体侧方约90°，前臂转掌上/下。
https://www.cuh.nhs.uk/patient-information/elbow-range-of-movement-exercises/
https://www.uhsussex.nhs.uk/resources/elbow-and-wrist-exercises/
这里只参考运动模式，不采用伤后个体处方。模型演示无外力±60°舒适范围，不追求强扳末端，无痛无麻刺；有术后限制、急性疼痛者遵医嘱。8秒是动画循环，不是完整训练剂量，不宣称治疗效果。
目标包含旋前圆肌/旋前方肌/旋后肌等；固定模型只能高亮宽泛forearms组，不能宣称高亮精准分离深层旋前方肌或每条肌肉。桡骨尺骨没有独立可见动画，本片展示外表前臂轴向转动，不是骨骼机制解剖片。

## 制作与几何证据
15fps×8秒，thumb-up中立→约60°旋后→中立→约60°旋前→中立。使用已有elbowTwist字段旋转真实rightForearm骨及蒙皮，并同步手掌法向；不是仅旋转手腕。肩、肘、腕世界位置固定。两侧脚全掌站稳，非承重的手在身前留净空，无器械接触。
- 九时刻实际蒙皮检查：左鞋2895、右鞋2907个顶点距地2mm以内，各自分布约112.81×268.43mm；最低约0mm（浮点误差），同索引网格漂移0mm。
- 右肩/肘/腕的各采样位置漂移0mm；肘内角约91°，腰弯0°。rightForearm真实世界旋转相对中立为±60°，手骨同步±60°，两者轴方向差小于0.08°，不是在固定前臂末端独立扭腕。
- 前臂中段390个Coach_Body顶点跟随轴向旋转，顶点中位位移34.62mm；到前臂长轴的半径分布不变（数值误差内），没有把中段缩瘪成一根细杆。肘端变形另以掌上/掌下和反向视角检查。该检查不模拟桡尺骨相互交叉，也不能替代全片像素复核。
- 实际看原生0、15、30、45、60、75、90、105、119帧，另看正面、反侧、掌上/掌下/中立近景。主机位前外上方略俯视，掌上/掌下可辨，右前臂高亮同时覆盖两个方向，身体脚不出画。镜头固定，避免运镜掩盖转动。
- 稀疏QA所有单项通过：脚骨锚漂移左0.09mm/右0.46mm；无穿地，膝肘方向正常，self_clip最小间隙55mm；手穿模检测无穿透，solver_warning=0，frame_edge_touch=0。frames_complete=false，总pass=false如实保留。
- 预览GIF按原生帧间隔生成8秒稀疏演示；detail-preview.gif为同一原帧的手臂区域裁切，便于低分辨率审核掌向，不替代全身支撑图。初稿几何门槛通过；只修正了高亮脉冲为旋转绝对值，避免负向时高亮减弱。诊断近景构图做过调整，无需改人体或引擎。

## 状态与工程检查
本批1项低分抽查保留待GPU，累计21保留待GPU＋5历史坐姿待修；209登记spec并非验收总数。原46候选没有因此增加完成数。
verify、portability7、media28、catalog、保护旧文件/既有分支、离线bundle导入HEAD/tree一致检查见QA。只新增spec、登记SHA、catalog及本批文档；未改固定模型、引擎、旧规格或冻结记录。

## 主线4080渲染请求
id=h-standing-forearm-rotation；modelProfile=training-human-v2；alignClavicles=false；theme=themes/glow-soft.json；原生120帧/15fps，正式包装30fps×8s=240帧。
建议 python drill-anim/drill.py render h-standing-forearm-rotation --theme themes/glow-soft.json --jobs 1 --pr 2 --keep
发布帧先看0、30、60、90、120、150、180、210、238。重点：肘端和腕部蒙皮连续、掌上掌下方向清晰、肩肘无代偿、双足支撑、循环接缝。仅新候选，未绑定App；未做全片渲染/QA、flickscan、propscan、绿幕/透明母帧、编码或发布。
