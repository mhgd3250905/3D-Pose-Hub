# 027 居家弹力带单臂下压（2026-10-19）

新增 h-band-triceps-pressdown：站姿单臂弹力带下压。居家小器械 / 肌肉训练 / 肱三头肌。需要可靠额定高位锚点，非无器械办公。单一教学目标为上臂保持近体侧的抗阻伸肘，不摆肩、不借腰。先轻阻力、无痛范围，初学每侧4–6次；8秒演示一轮，左右分开练，不自动假定播放器镜像。

## 去重与依据
核对212个现有spec和全部INDEX/失败候选。triceps-A为窄距俯卧撑，triceps-B为平行杆支撑，triceps-C与h-chair-dip为臂屈伸，都是闭链复合或支撑；h-db-curl/h-biceps-self为屈肘；026 h-band-shoulder-ir是保持屈肘的肩旋转。本项提供独立开链抗阻伸肘，不复刻019过头三头肌拉伸的失败接触，也不把新镜头当新动作。
来源（2026-10-19查阅）：Physitrack https://us.physitrack.com/home-exercise-video/tricep-press-down-with-exercise-band 说明高于头的稳固带锚点；ACE https://www.acefitness.org/certifiednewsarticle/3008/ace-study-identifies-best-triceps-exercises/ 将下压列为伸肘训练。模型采用保守夹角100–160度，不强压锁死肘。

## 逐项检查
原生15fps、8秒，实际检查0/15/30/45/60/75/90/105/119帧，--pr 0.5 --jobs 1 --theme themes/glow-soft.json；另看正/侧/背视辅助图。主PNG和GIF为全身工作臂后侧斜视，工作肘、握柄、脚和锚点清楚。初稿正斜视受柱遮挡，换教学机位后完整复渲；物理姿态无修正轮次。
- 伸肘夹角100.15–160.42度；肘中心最大移动2.45mm，带长0.898→1.285m，伸肘时阻力带变长，躯干不摆。
- 双足实际鞋底分布各超过2800个2mm内顶点；接触跨足宽与足长，非单点；网格漂移见geometry-summary.json。通用pins左0.09/right0.46mm，地板最低0mm。
- 握柄实际手网格到圆柱径向最小0.502mm，369顶点在1mm内，接触分布见geometry-summary.json。D柄环及连接环独立检查0/1/2/7秒，无穿入顶点；最小1.526mm。探针未近区域9mm是上界截值，不冒充真实距离。
- 弹力带全路径对身体非工作手最小85.6mm，无穿体；高位柱位于身体前侧、非承重扶柱。锚柱是稳固锚点示意，使用时必须安全固定，不用会倾倒的落地杆替代。
- QA关节方向/髋/腰范围合格，self_clip最差间隙55mm；hand_clip=99是无45mm内近邻的哨兵值，不当作实测99mm。没有借这个值代替独立握持/D环检查。
- 求解告警0、触边0、首尾姿态一致；frames_complete=false与总pass=false为9/120稀疏帧的预期。

## 边界
保留待GPU，不是已发布或全片合格。历史5项坐姿待修原样保留；本批新增1项使累计25保留待GPU、5待修，登记213spec不等于验收数。未改引擎/模型/旧spec/发布记录。

## 渲染请求
id h-band-triceps-pressdown；theme themes/glow-soft.json；原生8s×15fps=120帧，主线若包装30fps为240帧。建议 --pr 2 --jobs 1 --keep，先查发布帧0/30/60/120/180/210/239；重点肘轨迹、D柄环和锚点清晰。低配仅9帧及辅助机位；全片QA/flickscan/propscan/编码及正式发布由主线完成。
