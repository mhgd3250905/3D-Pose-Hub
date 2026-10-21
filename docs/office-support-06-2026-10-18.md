# 第六批：办公支撑扩充 · 2026-10-18

分支drill/office-support-06；直接前批913c77f2593e97552620692182ce1a273cb8895b。尝试2项，保留1项，停止1项。不以候选数量代替接触真实性。保留项为低分抽查通过、待主线GPU验收；不是正式发布、医疗认证或治久坐承诺。

## 1. 保留：扶椅单腿髋铰链

- o-supported-single-leg-rdl，training-human-v2、alignClavicles:false、glow-soft，原生15fps×8秒，严格单路jobs1/pr0.5抽帧。
- 面向+X，身体左侧−Z。左脚支撑、左膝保持约12°软屈，右手掌固定在稳固无轮椅背上缘。右腿悬空后伸，骨盆与躯干一起由前倾6°到40°，腰弯0°，无主动骨盆扭转。左手自然垂下，不宣称扶腿。
- 8秒两次：每次0.3秒准备、1.4秒下、0.6秒停、1.4秒起、0.3秒歇。第0帧已经单腿支撑，右腿轻悬；入位/换侧不是这个循环的一部分。只能在稳固支点旁开始；播放另一侧需镜像并重新布置支点。8秒不是训练处方。
- 与实读hamstrings-A相比：保留单腿髋铰链机制，但有固定手支点，躯干幅度72°减至40°；与h-good-morning双腿、抱胸、大幅髋铰链不同。真实支撑条件改变，非改名复制。椅背板顶约99cm，宽60cm；确认不会滑移或翻倒，不将体重拉挂在椅背。不用转椅，不追求动画以外幅度。
- 高亮左侧hamstrings/glute-max，对应承重侧。主机位改到左侧以露出承重腿和臀部，反侧机位核对右掌及后腿。不是隔离某条深层肌的证明。

## 2. 实看与稀疏QA

实际看过主帧0/15/26/30/35/45/60/86/90/95/105/119及still；反机位0/30及still。覆盖起点、两次顶点、回程、四分点、首尾；1.7/2.3秒非整数帧按最近帧26/35取样。主镜头全身、椅背支点、承重膝和后腿路径可见，反侧补看被身体遮挡的右臂。首末处同一准备姿态，镜头固定。

- SHA：0b88ba087b42f6e42f1aa642ec8e6f5735ce250b52db7c1b852b58ba86107d22；spec源码提交：6121503eb96ef63000a42410ac455d682c8eeaf5。
- 抽样12帧，最低顶点-0.000mm、below_floor=False。
- pins：{"footL": {"frames": 12, "drift_mm_max": 0.09, "ok": true}, "handR": {"frames": 12, "drift_mm_max": 0.28, "ok": true}}。
- straight：{"knee.right when params.hinge>0.6": {"frames": 6, "min_deg": 177.54, "ok": true}, "knee.left": {"frames": 12, "min_deg": 168.0, "ok": true}}。
- limits：{"knee_flex_backward": true, "elbow_flex_forward": true, "hip_flex_deg_range": [-18.4, 53.6], "hip_abd_deg_range": [0.1, 0.3], "hip_abd_true_deg_range": [0.1, 0.3], "hip_flex_max_deg": 135.0, "hip_ok": true, "waist_bend_deg_max": 0, "waist_ok": true, "pelvis_to_chest_deg_max": 0, "elbow_deg_range": [64.3, 157.3], "knee_deg_range": [168.0, 177.5], "neck_note": "head/neck rigid with the upper torso in this rig (no neck bend possible)", "first_violation": {}}。
- self_clip最近12.1mm；左手身体最小间距5.27mm；求解告警0，出画0。
- frames_complete=false/pass=false是稀疏抽帧预期，不写全片PASS；没有降低QA阈值或新增allowContact掩盖问题。

## 3. 真实支点检查与修正

现有chair的所有Mesh BoxGeometry按实际世界AABB计算有符号距离；yaw90°为轴对齐，对座、腿、背板和立柱均检查。每个蒙皮顶点按主骨分组，右掌与其他部位分开审查；足底左右分别最低点，不拿左脚结果代替悬空右脚。15个采样时刻0/.8/1/1.7/2/2.3/3/3.7/4/5/5.7/6/6.3/7/7.933秒；原始结果在交付QA。

- 初稿借鉴旧hamstrings-A的自由腕/踝目标，出现“左手腕已限制”和“右脚踝已按真实腿长限制”。第一轮减短垂臂长度、后腿目标半径，右掌降低3mm至背板近接触；仍有左腕告警。第二轮删除腕轨迹的多余前向55mm偏置，消除腕告警。后腿第一轮缩短过多，膝173.1°未达原176°要求；第二轮半径改为0.7622m，重新抽查，并保留176°原阈值。没有第三轮重复微调。
- 最终右掌到椅网格间隙1.570mm，最大1.570mm；全部人体与椅最小间隙1.570mm。固定支点是几何近接触，不是接触力/椅子稳定性仿真。
- 主机位从右侧改左侧，stillAt改站立0秒并缩小画面占比，解决初稿头顶出框和承重侧被后腿遮挡。镜头变化不改变动作轨迹。

## 4. 停止：o-wall-forearm-plank

实读h-forearm-plank（地面前臂支撑）与h-incline-pushup（扶凳动态俯卧撑）。目标是双足站立、前臂贴墙的静态抗伸展斜板，不能退化为俯卧撑或只用掌支撑。

初稿手网格穿墙4.50mm、膝161.19°；第一轮调整骨盆高度和手位，第二轮调整墙面2mm。最终普通QA通过，双膝169.03°、腰弯0°、双掌距墙0.50mm、前臂最近点3.03mm。然而限定肘中心上下25mm的实际蒙皮区域，左右距墙仍约5.66mm；更窄区域更大，不能拿前臂更高位置的最近点冒充肘支点。真实肘掌同时支撑不充分，按两轮上限停止。

已查看0/30/60/90/119、still及反机位0/30。撤出spec目录，不登记、不计完成、不放进可用动作列表；失败源与证据只在交付QA/rejected留档。没有改引擎、模型或QA阈值，也没有重试此前椅抱膝/内收拉伸受阻项。

## 5. 主线GPU请求与离线交付

保留项包装为30fps×8秒=240帧；主题glow-soft、training-human-v2、alignClavicles:false、jobs1/pr2。先看发布帧0/30/52/60/70/90/120/172/180/190/210/239，重点支撑手/椅板接触、站膝、骨盆朝向、右腿长度和完整循环。未做全片QA、未采样帧、flickscan/propscan、绿幕/透明母帧和编码。主线决定App槽位、剂量与发布。

累计bundle范围posterior3160523050a3e1601036c6085ee4ce4fb258ef90..drill/office-support-06，包含001–006共11个保留动作；旧批勿重复cherry-pick/计数。previewZIP只含006，1项代表PNG和按真实时距复用12张抽帧的8秒GIF，非流畅全片。失败候选隔离在QA/rejected。

verify194规格/13模型源、portability7、media28和catalog应通过，以随附日志为准。原文件hash和所有原refs保护；临时离线原bundle+累计bundle导入验证HEAD/tree一致，无remote或网络Git。未改旧spec/引擎/固定13源/media/冻结记录。
