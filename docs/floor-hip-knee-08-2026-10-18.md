# 第八批：地面髋外展 / 屈膝候选（停止记录）

本批从 `drill/floor-glute-07` 的 `80691dcafdb49bae5f28a295713e52859443e665` 建立 `drill/floor-hip-knee-08`。原离线基线仍为 `3160523050a3e1601036c6085ee4ce4fb258ef90`。两个候选均两轮后停止，新增完成数 **0**；累计001–007保留的12项不变。没有新spec/SHA登记，没有成功预览PNG/GIF，也没有完整循环验收。

## 1. 范围与机制

- `h-side-lying-hip-abduction` 侧卧直腿外展：居家地面、非办公，骨盆保持侧卧，下腿轻屈支撑，上腿直膝外展约25°。区别于站立 `h-side-leg-raise`、骨盆离地的 `hip-abductors-A` 侧平板抬腿，以及屈膝外旋的 `w-clamshell`。
- `h-prone-knee-curl` 俯卧徒手屈膝：居家地面、非办公，目标为大腿保持接触地面、膝屈伸约8–80°，不主动抬大腿。区别于 `n-prone-hip-ext` 的主动伸髋，及 `hamstrings-B` 的滑盘桥式。本候选实际几何没有达到“大腿贴地”，因此不能保留。
- 计划均为8秒、原生15fps，2次；1.2秒上、0.8秒停、1.4秒回、0.6秒余量。`training-human-v2`、`alignClavicles:false`、`glow-soft`、`--pr 0.5 --jobs 1`。
- 动作依据仅用于机制比较，不把康复处方移植为App剂量：AAOS Hip Conditioning Program https://www.orthoinfo.org/recovery/hip-conditioning-program （侧卧上腿外展、下腿弯曲支撑、头颈放松）；East Lancashire Hospitals NHS Knee Strengthening https://elht.nhs.uk/application/files/8017/4591/8619/MSK_knee_strengthening_booklet_2024.pdf （俯卧膝屈伸）。源码同时核查 `ss-geo.mjs`、`home-anim.mjs` 和 `page/engine.js` 手脚坐标机制。

## 2. 两轮检查与停止理由

实际查看每项第1轮和第2轮 f30 图；第2轮补看 f0 和 still。只渲染 f0、f30 与自动still，目的为早期否决，未执行正常保留项的完整稀疏帧集、反侧机位、GIF或全片。技术数值不代表动作可信。

| 候选 | 第1轮 | 第2轮 | 结论 |
|---|---|---|---|
| 侧卧外展 | 手掌目标误用默认胸坐标，实际下侧手臂深穿地；改为明确world坐标后，网格探针仍显示下侧肩/上臂穿地，头未被可靠承托 | 改腰侧屈18°、掌托头并下调骨盆以改善侧卧支撑。最低顶点−20.4mm（短裤），托头手穿入头部6.57mm；self_clip head/上臂约−14.7mm；2/2帧含可达告警；肘方向判据失败 | 两轮停止；头手支撑和地面接触均不可信，不登记 |
| 俯卧屈膝 | 同样纠正手的默认胸坐标；world探针显示前臂穿地约29.7mm，膝表面约82mm离地 | 折叠双臂尝试承托额部，并调整腿姿。双手穿入头部38.84/33.87mm；前臂最低−4.5mm；膝关节高度221.8–222.4mm、膝表面约153mm，足部也悬空 | 两轮停止；该腿姿的静态−12°伸髋实际上抬高大腿，不是目标要求的贴地，不能用“膝钉住0.54mm”冒充贴地；不登记 |

第2轮数值：侧卧右膝伸直最小179.94°、右掌漂移0.29mm、镜头触边0；俯卧膝屈约8–80°、髋约−12°、腰0°、无求解告警、镜头触边0。但上述局部通过不足以抵消支撑/穿插/悬空失败。没有扩展allowContact以豁免失败，没有修改阈值、固定模型或引擎，也没有加枕头/新道具遮盖。

## 3. 引擎与作者几何教训

- `hands.mode:'free'` 的 `palmAt` 默认按胸部坐标；世界坐标必须显式 `frame:'world'`。`pole` 为世界点，`poleUp/poleLow` 跟随身体。
- 头颈固定跟随上躯干；本次没有可用独立颈关节。侧卧肩宽、骨盆宽以及刚性头部关系必须先解决承托，再设计循环。
- `leg(flex,knee)` 使用站姿rest坐标，俯卧映射中负髋屈为伸髋、会抬高大腿。第二轮未正确实现贴地，应停止而非追加试错。
- 下侧肩/前臂、头手实际网格必须检查；胶囊QA的允许接触对不等于网格接触合格。
- 最初两次任务在第一项逐帧渲染结束、合成阶段曾有Vite生命周期重叠约3秒；没有两路逐帧渲染并发。后续严格等待前任务退出再启动render/probe，所有jobs均1。
- 以上只能证明本次候选失败，不能证明固定模型在所有合理姿态下都绝对无法完成这两个动作。若未来重做，应先有通过的头/肘/骨盆/膝接触静态构型。本批不再重试。

## 4. 审计与交接

`QA/rejected/<id>/` 隔离两轮PNG、第2轮原始指标与失败candidate-source.js；不放入正常previews，不登记SHA。`previews/README.txt` 明确本批没有成功预览。

提交前执行：verify（195 specs / 13固定源）、portability7项、media28项、catalog检查；对本批开始时全部tracked文件和所有refs留存校验，除允许catalog更新和新批次文档外不得变化。bundle范围仍为posterior基线..第八批分支，含001–008的累计提交，本批只增加停止记录；ZIP仅第八批失败审计，不重计001–007。新临时仓库从原始离线包导入，再导入第八批bundle核对HEAD/tree与三基线不变。

无GitHub/remote/push/rebase、无完整视频/编码/母帧、无发布/App接入。下一批由父任务安排。
