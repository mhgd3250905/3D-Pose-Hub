# 动作目录（自动生成）

> 由 `node drill-anim/tools/catalog.mjs` 从 specs、`data/drills.json`、`data/home-pr-candidates.json`、`verify.mjs`、`media/manifest.json`、`media/releases/*.sources.json`、2026-10-13 批次 `job-catalog.json` 只读汇总生成，**不要手改**；改了 spec / 清单 / 文档后重新运行。“已知问题”一列只收文档里查得到的记录，并注明出处；没有记录 ≠ 没有问题。

## 统计

| 项 | 数 |
|---|---:|
| spec 文件（specs/*.js，不含 _*.mjs 共用模块） | 210 |
| 其中修订版（-r2/-r3） | 10 |
| FlareLab App 51（data/drills.json） | 51 |
| HipLab 已发布素材绑定的 spec 文件（v0.1.0（published）46 个动作 id、v0.2.0（published）46 个动作 id） | 47 |
| HipLab 自测静图在用 spec | 6 |
| 原版已被在用的修订版取代（保留不删） | 9 |
| 有 spec 但没有被任何 App/发布版本使用 | 99 |
| SHA 未登记 / 哈希不符 | 0 |

- g-* 健身房补充（cable-hip-12；非普通办公）：2
- FlareLab 肌群动作（17 肌群 × A 徒手 / B 家用 / C 健身房）：51
- s-* 拉伸（原 8 项 + 修订）：11
- t-* 托马斯专项（Flare，PR #106）：12
- o-* 办公室（PR #97–104 + office-hip-leg-02 + office-adductor-back-03 + office-knee-march-04 + office-calf-squat-05 + office-support-06）：20
- w-* 久坐强化（PR #105）：8
- h-* 居家/肌群补充/开胯/开肩/小器械力量/徒手后链/办公下肢候选（PR #111–115 + r2 + Pose-Hub PR #5、#6 + office-lower-body-01）：82
- n-* HipLab 开胯 MVP 新增（PR #119）：15
- a-* HipLab 自测对比静图（PR #119 + r2）：9

列说明：时长 = `timeline.duration` 秒；帧 = 时长 × spec 的 fps（未写 fps 按 30）。发布时 HipLab 统一包装成 30 fps，所以**发布片的帧号 ≠ spec 原生帧号**。profile 空 = 旧人物（未设 `modelProfile`），新做/重做必须写 `training-human-v2`。SHA 列：基线 59 = 由 git 提交 `1adcab8` 固定；PR #n = 在 `data/home-pr-candidates.json` 或 `verify.mjs` 登记。

## g-* 健身房补充（cable-hip-12；非普通办公）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `g-cable-hip-abduction` | 低位绳索髋外展 | 臀中肌 · 髋外展（right） | 椅、绳索、脚踝扣 | 8s/120f@15 | v2 |  | — | 已登记（cable-hip-12） | cable-hip-12：低位绳索髋外展；滑轮左前方，右髋5–24°外展并轻度屈髋避开支撑腿；低分抽查通过待GPU，非普通办公（docs/cable-hip-12-2026-10-18.md） |
| `g-cable-hip-extension` | 低位绳索髋后伸 | 臀大肌（right） | 椅、绳索、脚踝扣 | 8s/120f@15 | v2 |  | — | 已登记（cable-hip-12） | cable-hip-12：低位绳索髋后伸；踝扣绑定胫骨，右髋8–20°后伸，左脚/左掌轻扶支撑；低分抽查通过待GPU全片，非普通办公（docs/cable-hip-12-2026-10-18.md） |

## FlareLab 肌群动作（17 肌群 × A 徒手 / B 家用 / C 健身房）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `abs-A` | 空心体支撑 | 腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `abs-B` | 平行杆团身 L 撑 | 腹直肌（含深层腹横肌） | 平行杆 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `abs-C` | 双杠直臂支撑举腿 | 腹直肌（含深层腹横肌） | 双杠 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `adductors-A` | 哥萨克蹲 | 内收肌群 | — | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `adductors-B` | 屈膝哥本哈根侧撑 | 内收肌群（right） | 垫、凳 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） | 10-13库：Approved support-hold version; the failed dynamic draft is not selected.；10-13库：Selected final movie remains support/hold version; dynamic draft not adopted. |
| `adductors-C` | 绳索站姿髋内收 | 内收肌群（left） | 绳索、脚踝扣 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `chest-A` | 俯卧撑转侧撑 | 胸大肌 | 垫 | 12s/360f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `chest-B` | 平行杆深幅俯卧撑 | 胸大肌 | 平行杆 | 7s/210f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `chest-C` | 绳索单臂站姿推胸 | 胸大肌（right） | 绳索、单柄 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `deltoids-A` | 直臂侧平板支撑 | 三角肌 | — | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `deltoids-B` | 哑铃土耳其起立 | 三角肌 | 垫、哑铃 | 12s/360f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） | 只到高桥的半程土耳其起立；支撑肘与垫约 10.31 mm 间隙（docs/drill-anim/hark-4080-v1.md）；10-13库：Half Turkish get-up to high bridge, not a full standing get-up.；10-13库：Source support-elbow skin to mat gap remains about 10.31 mm.；10-13库：Historical supporting elbow skin-to-mat gap about 10.31 mm; half get-up ends at high bridge. |
| `deltoids-C` | 地雷杆半跪单臂推举 | 三角肌（right） | 地雷杆 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `erectors-A` | 反向平板（后撑抬髋） | 竖脊肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `erectors-B` | 瑞士球背伸 | 竖脊肌 | 瑞士球、墙 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） | 用户认可的鞋向修正在 revisions/erectors-B-footfix-20261013，本 spec 单独不是完整配方（docs/erectors-B-footfix-2026-10-13.md） |
| `erectors-C` | 45° 罗马椅背伸 | 竖脊肌 | 罗马椅 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `forearms-A` | 跪姿多方向腕部摇摆 | 前臂 · 腕屈伸肌 | 垫 | 16s/480f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `forearms-B` | 哑铃腕屈 + 腕伸 | 前臂 · 腕屈伸肌（right） | 凳、哑铃 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `forearms-C` | 壶铃倒握行走 | 前臂 · 腕屈伸肌（right） | 壶铃 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `glute-max-A` | 单腿臀桥 | 臀大肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布）；HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） | glow-B 下几乎看不到高亮，v0.2.0 已用 soft-v1 发布并改善（docs/soft-highlight-2026-10-18.md） |
| `glute-max-B` | 弹力带四足直腿后踢 | 臀大肌（right） | 垫、弹力带 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `glute-max-C` | 反向背伸机 | 臀大肌 | 反向背伸机 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hamstrings-A` | 徒手单腿罗马尼亚硬拉 | 腘绳肌 | — | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hamstrings-B` | 滑盘腿弯举 | 腘绳肌 | 垫、滑垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hamstrings-C` | GHD 北欧离心 | 腘绳肌 | GHD | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hip-abductors-A` | 侧平板抬腿 | 臀中肌 · 髋外展（right） | 垫 | 6s/180f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hip-abductors-B` | 仰卧弹力带 V 字开腿 | 臀中肌 · 髋外展 | 垫、弹力带 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） | hark-4080-v1 修订 240 帧求解警告保留（docs/drill-anim/hark-4080-v1.md）；10-13库：Source engine pass is true with 240 solver-warning frames retained.；10-13库：Historical original engine pass=true but solver_warning_frames=240; do not hide or turn into zero. |
| `hip-abductors-C` | 器械髋外展 | 臀中肌 · 髋外展 | 髋外展机 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hip-flexors-A` | 坐姿直腿抬腿（压缩） | 髋屈肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布）；HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） | glow-B 下几乎看不到高亮，v0.2.0 已用 soft-v1 发布并改善（docs/soft-highlight-2026-10-18.md） |
| `hip-flexors-B` | 弹力带站姿高抬膝 | 髋屈肌（right） | 墙、弹力带 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `hip-flexors-C` | 绳索站姿直腿前抬 | 髋屈肌（right） | 绳索、脚踝扣 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `lats-A` | 坐姿撑地抬臀 | 背阔肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `lats-B` | 弹力带直臂下拉 | 背阔肌 | 单杠、锚点、单柄、弹力带 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `lats-C` | 双杠支撑耸肩下压 | 背阔肌 | 双杠 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `obliques-A` | 熊爬穿腿 | 腹斜肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `obliques-B` | 弹力带抗旋转推 | 腹斜肌 | 弹力带、锚点、单柄 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `obliques-C` | 绳索高位伐木 | 腹斜肌 | 绳索、单柄 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `quadriceps-A` | 跪姿反向北欧 | 股四头肌 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `quadriceps-B` | 弹力带终末伸膝 | 股四头肌（right） | 弹力带 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `quadriceps-C` | 器械腿屈伸（顶端锁直） | 股四头肌 | 腿屈伸机 | 10s/300f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `rotator-cuff-A` | 俯撑交替触肩 | 肩袖肌群 | 垫 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `rotator-cuff-B` | 弹力带肘贴体侧外旋 | 肩袖肌群（right） | 弹力带、锚点、单柄、泡沫轴 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `rotator-cuff-C` | 绳索 90/90 外旋 | 肩袖肌群（right） | 绳索、单柄 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `scapular-A` | 俯卧 Y-T-W 举 | 斜方肌中下部 · 菱形肌 | 垫 | 12s/360f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `scapular-B` | 单杠肩胛引体 | 斜方肌中下部 · 菱形肌 | 单杠 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `scapular-C` | 吊环直臂支撑 | 斜方肌中下部 · 菱形肌 | 吊环 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `serratus-A` | 俯撑肩胛前伸 | 前锯肌 | 垫 | 6s/180f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `serratus-B` | 泡沫轴墙面上滑 | 前锯肌 | 墙、泡沫轴 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `serratus-C` | 吊环俯卧撑加前伸 | 前锯肌 | 吊环 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `triceps-A` | 窄距俯卧撑（锁肘停顿） | 肱三头肌 | 垫 | 7.2s/216f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `triceps-B` | 平行杆直臂支撑 | 肱三头肌 | 平行杆 | 7s/210f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |
| `triceps-C` | 双杠臂屈伸 | 肱三头肌 | 双杠 | 8s/240f@30 | 旧 |  | FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布） | 基线 59（git） |  |

## s-* 拉伸（原 8 项 + 修订）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `s-9090-r2` | 90/90坐姿换髋 | 臀大肌 | 垫 | 8s/240f@30 | v2 | `s-9090` | HipLab v0.1.0 作 s-9090；HipLab v0.2.0 作 s-9090 | PR #121 |  |
| `s-9090` | 90/90坐姿换髋 | 臀大肌 | 垫 | 8s/240f@30 | 旧 |  | 原版；v0.1.0 绑定 s-9090-r2；原版；v0.2.0 绑定 s-9090-r2 | 基线 59（git） | hark-4080-v1 文档称本 spec 偏前屈拉伸，真正左右换髋的 s-9090-switch 只在 revisions/hark-4080-v1（docs/drill-anim/hark-4080-v1.md） |
| `s-butterfly` | 蝴蝶式 | 内收肌群 | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） |  |
| `s-figure4` | 仰卧4字梨状肌拉伸 | 臀大肌（right） | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） |  |
| `s-frog-r2` | 青蛙式 | 内收肌群 | 垫 | 8s/240f@30 | v2 | `s-frog` | HipLab v0.1.0 作 s-frog；HipLab v0.2.0 作 s-frog | PR #121 |  |
| `s-frog` | 青蛙式 | 内收肌群 | 垫 | 8s/240f@30 | 旧 |  | 原版；v0.1.0 绑定 s-frog-r2；原版；v0.2.0 绑定 s-frog-r2 | 基线 59（git） |  |
| `s-kneel-hipflex` | 半跪髋屈肌拉伸 | 髋屈肌（left） | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） |  |
| `s-lizard` | 蜥蜴式低弓步 | 髋屈肌（left） | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） |  |
| `s-pigeon` | 鸽子式 | 臀大肌（right） | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | 基线 59（git） |  |
| `s-seated-fold-r3` | 坐姿体前屈 | 腘绳肌 | 垫 | 8s/240f@30 | v2 | `s-seated-fold` | HipLab v0.1.0 作 s-seated-fold；HipLab v0.2.0 作 s-seated-fold | 已登记（2026-10-17 HipLab accepted media） | 63 条历史腕部可达范围警告保留（media/releases/0.1.0.md） |
| `s-seated-fold` | 坐姿体前屈 | 腘绳肌 | 垫 | 8s/240f@30 | 旧 |  | 原版；v0.1.0 绑定 s-seated-fold-r3；原版；v0.2.0 绑定 s-seated-fold-r3 | 基线 59（git） | v2 原片 f154→155 手跳约 30 mm（docs/training-media-library-2026-10-13.md）；10-13库：Selected original v2 has f154→155 hand jump about 30.3 mm; failed stabilization draft was not adopted. |

## t-* 托马斯专项（Flare，PR #106）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `t-flare-side-hold` | 托马斯侧撑定格 | 腹斜肌+三角肌（right） | 垫 | 8s/240f@30 | 旧 |  | — | PR #106（verify.mjs） |  |
| `t-half-straddle` | 半分腿支撑 | 肱三头肌 | 垫 | 8s/240f@30 | 旧 |  | — | PR #106（verify.mjs） | 用户已停止制作，保留历史，不恢复渲染（docs/thomas-app-model-v3-2026-10-12.md） |
| `t-lsit-open-close` | L撑开合 | 髋屈肌+内收肌群 | 垫 | 8s/240f@30 | v2 |  | — | PR #106（verify.mjs） |  |
| `t-lsit-tuck` | L 撑↔团身 | 腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | v2 |  | — | PR #106（verify.mjs） |  |
| `t-lsit-vsit-circles` | L 撑到 V 撑画圈 | 腹直肌（含深层腹横肌） | 垫 | 10s/300f@30 | v2 |  | — | PR #106（verify.mjs） | 原构图手机成片裁边，另存恒定构图派生（docs/training-media-library-2026-10-13.md） |
| `t-lsit-wide` | 宽腿L撑 | 髋屈肌+腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | v2 |  | — | PR #106（verify.mjs） |  |
| `t-seated-straddle-ext` | 坐姿分腿屈伸 | 腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | 旧 |  | — | PR #106（verify.mjs） |  |
| `t-seated-straddle-lift-1leg` | 坐姿分腿单腿抬起 | 髋屈肌 | 垫 | 10s/300f@30 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #106（verify.mjs） |  |
| `t-seated-straddle-lifts` | 坐姿分腿双腿抬起 | 髋屈肌 | 垫 | 8s/240f@30 | 旧 |  | — | PR #106（verify.mjs） | 10-13库：历史预览求解警告 24 帧（已视觉认可） |
| `t-straddle-hold` | 分腿支撑 | 髋屈肌+腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | 旧 |  | — | PR #106（verify.mjs） | 10-13库：历史预览求解警告 40 帧（已视觉认可） |
| `t-tuck-planche` | 团身俄挺 | 三角肌+前锯肌 | 垫 | 24s/720f@30 | 旧 |  | — | PR #106（verify.mjs） | 原构图手机成片裁边，另存恒定构图派生（docs/training-media-library-2026-10-13.md）；10-13库：历史预览求解警告 120 帧（已视觉认可） |
| `t-vsit` | V 撑 | 腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | v2 |  | — | PR #106（verify.mjs） |  |

## o-* 办公室（PR #97–104 + office-hip-leg-02 + office-adductor-back-03 + office-knee-march-04 + office-calf-squat-05 + office-support-06）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `o-chair-knee-extension` | 坐椅徒手伸膝 | 股四头肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） |  |
| `o-seated-calf-raise` | 坐椅提踵 | 小腿三头肌 | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | office-calf-squat-05：屈膝坐位低负荷提踵；实际前足网格锚点另查，双股座面近接触0.7–4.12mm，待GPU全片（docs/office-calf-squat-05-2026-10-18.md） |
| `o-seated-catcow` | 坐姿猫牛式 | 竖脊肌 | 办公椅 | 8s/240f@30 | 旧 |  | — | PR #104（verify.mjs） | 人体无独立颈屈，头随上躯干刚性（docs/training-media-library-2026-10-13.md）；10-13库：Head/neck follows the upper torso rigidly; the model has no independent neck bend. |
| `o-seated-fig4` | 坐姿四字前压 | 臀大肌（right） | 办公椅 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #97（verify.mjs） |  |
| `o-seated-ham` | 坐姿腘绳肌前伸 | 腘绳肌（right） | 办公椅 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #99（verify.mjs） |  |
| `o-seated-hip-er` | 坐椅无阻力髋外旋控制 | 臀大肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） |  |
| `o-seated-sidebend` | 坐椅单臂侧伸 | 腹斜肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（office-hip-leg-02） |  |
| `o-seated-twist` | 坐姿扶椅扭转 | 腹斜肌+竖脊肌 | 办公椅 | 8s/240f@30 | 旧 |  | — | PR #98（verify.mjs） |  |
| `o-stand-crossreach` | 扶椅站姿交叉侧伸 | 臀中肌 · 髋外展（right） | 办公椅 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #102（verify.mjs） |  |
| `o-stand-ham` | 扶椅站姿单腿腘绳肌拉伸 | 腘绳肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（office-hip-leg-02） |  |
| `o-stand-lunge` | 扶椅站姿弓步屈髋拉伸 | 髋屈肌（left） | 办公椅 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #100（verify.mjs） |  |
| `o-stand-quad` | 扶椅站姿股四头肌拉伸 | 股四头肌（right） | 办公椅 | 8s/240f@30 | 旧 |  | — | PR #101（verify.mjs） |  |
| `o-stand-sidebend` | 站姿举手侧屈 | 腹斜肌（right） | 办公椅 | 8s/240f@30 | 旧 |  | — | PR #103（verify.mjs） |  |
| `o-supported-ankle-inversion` | 扶椅悬空足内翻控制 | 胫骨前肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | supported-ankle-inversion-24：扶椅悬空足内翻12°后回中立；真实足骨/鞋网格转动而胫骨不转，非踝泵屈伸；低分保留待GPU（docs/supported-ankle-inversion-24-2026-10-18.md） |
| `o-supported-ankle-pump` | 扶椅悬空踝屈伸 | 小腿三头肌+胫骨前肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | supported-ankle-pump-21：扶椅轻触平衡、固定髋膝的悬空踝屈伸；低负荷主动活动控制，区别于承重提踵/靠墙勾脚；低分保留待GPU（docs/supported-ankle-pump-21-2026-10-18.md） |
| `o-supported-knee-curl` | 扶椅站姿徒手屈膝 | 腘绳肌（right） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | supported-knee-curl-22：扶椅站姿徒手屈膝，髋固定、膝15–80°低负荷控制；区别髋后踢和踝泵；低分保留待GPU（docs/supported-knee-curl-22-2026-10-18.md） |
| `o-supported-march` | 扶椅站姿交替抬膝 | 髋屈肌 | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） |  |
| `o-supported-mini-squat` | 扶椅浅蹲 | 股四头肌+臀大肌 | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | office-calf-squat-05：双掌扶60cm宽稳椅高背、浅幅动态蹲；双掌网格与背板间隙1.62mm，待GPU全片（docs/office-calf-squat-05-2026-10-18.md） |
| `o-supported-single-leg-rdl` | 扶椅单腿髋铰链 | 腘绳肌+臀大肌（left） | 椅 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | office-support-06：右掌扶稳椅背、左腿支撑髋铰链；近接触1.57mm，待GPU全片（docs/office-support-06-2026-10-18.md） |
| `o-wall-hip-hinge-stretch` | 扶墙髋后移躯干延展 | 背阔肌 | 墙 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） |  |

## w-* 久坐强化（PR #105）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `w-bird-dog` | 鸟狗式 | 竖脊肌 | 垫 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） |  |
| `w-chair-hip-thrust` | 椅子臀推 | 臀大肌 | 椅 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |
| `w-clamshell` | 侧卧蚌式开合 | 臀中肌 · 髋外展（right） | 垫 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |
| `w-dead-bug` | 死虫式 | 腹直肌（含深层腹横肌） | 垫 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |
| `w-feet-on-chair-bridge` | 脚踩椅面臀桥 | 腘绳肌+臀大肌 | 垫、椅 | 8s/240f@30 | 旧 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |
| `w-fire-hydrant` | 四足消防栓 | 臀中肌 · 髋外展（right） | 垫 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |
| `w-prone-swimmer` | 俯卧游泳式 | 斜方肌中下部 · 菱形肌+竖脊肌 | 垫 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） |  |
| `w-wall-sit` | 靠墙静蹲 | 股四头肌+臀大肌 | 墙 | 8s/240f@30 | 旧 |  | — | PR #105（verify.mjs） | 10-13库：Original QA is a key/intermediate-frame probe only: frames_complete=false and pass=false; no full-film vali… |

## h-* 居家/肌群补充/开胯/开肩/小器械力量/徒手后链/办公下肢候选（PR #111–115 + r2 + Pose-Hub PR #5、#6 + office-lower-body-01）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `h-9090-liftoff-r2` | 90/90后腿主动抬起 | 臀中肌 · 髋外展+臀大肌（left） | 垫 | 8s/120f@15 | v2 | `h-9090-liftoff` | HipLab v0.1.0 作 h-9090-liftoff；HipLab v0.2.0 作 h-9090-liftoff | PR #121 |  |
| `h-9090-liftoff` | 90/90后腿主动抬起 | 臀中肌 · 髋外展+臀大肌（left） | 垫 | 8s/120f@15 | v2 |  | 原版；v0.1.0 绑定 h-9090-liftoff-r2；原版；v0.2.0 绑定 h-9090-liftoff-r2 | PR #113 |  |
| `h-adductor-rock` | 四足单腿侧伸后摇 | 内收肌群（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-banana` | 仰卧香蕉式侧伸 | 腹斜肌+背阔肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-band-hip-ir` | 坐椅弹力带髋内旋 | 臀中肌 · 髋外展+臀大肌（right） | 椅、弹力带 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-band-leg-out` | 仰卧弹力带单腿侧落 | 内收肌群+腘绳肌（right） | 垫、弹力带 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-band-pallof` | 弹力带抗旋转推 | 腹斜肌 | 弹力带、锚点、单柄 | 8s/120f@15 | v2 |  | — | PR #5 | obliques-B 的 training-human-v2 重做，推到顶 z 0.4356→0.431（docs/home-small-equipment-2026-10-18.md） |
| `h-band-pull-apart` | 弹力带水平拉开 | 斜方肌中下部 · 菱形肌+三角肌 | 弹力带 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-band-row` | 弹力带坐姿划船 | 背阔肌+斜方肌中下部 · 菱形肌 | 垫、弹力带 | 8s/120f@15 | v2 |  | — | PR #5 | propscan 8 坏帧是两根弹力带互相扫过，不是 z-fighting（docs/home-small-equipment-2026-10-18.md） |
| `h-band-standing-abduction` | 扶椅弹力带站姿外展 | 臀中肌 · 髋外展（right） | 椅、弹力带、锚点、脚踝扣 | 8s/120f@15 | v2 |  | — | 已登记（band-hip-sides-13） | band-hip-sides-13：扶椅弹力带站姿外展；独立可靠固定低位锚点，胫骨踝扣，约5–24°外展；低分抽查通过待GPU，非普通办公（docs/band-hip-sides-13-2026-10-18.md） |
| `h-band-standing-adduction` | 弹力带站姿内收 | 内收肌群（right） | 椅、弹力带、锚点、脚踝扣 | 8s/120f@15 | v2 |  | — | 已登记（band-hip-sides-13） | band-hip-sides-13：家用弹力带站姿内收；右腿前方通过中线，约25°屈髋避开支撑鞋；低分抽查通过待GPU，椅子不是锚点（docs/band-hip-sides-13-2026-10-18.md） |
| `h-bear-plank` | 熊式支撑 | 腹直肌（含深层腹横肌）+股四头肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-biceps-self` | 双手对抗弯举 | 肱二头肌（right） | — | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-bridge-march` | 臀桥交替踏步 | 臀大肌+腘绳肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #6 | 第 0 帧即保持中的臀桥（只教踏步，不教起桥）；右掌比左掌靠脚 5 mm，让右肘 ≥170°（qa 肘向判据按站姿 +Z）（docs/home-posterior-chain-2026-10-18.md） |
| `h-bridge-overhead` | 臀桥过头伸臂 | 背阔肌+臀大肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-bulgarian` | 椅子保加利亚分腿蹲 | 股四头肌+臀大肌（left） | 椅 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-butterfly-active` | 仰卧蝴蝶主动开合 | 内收肌群 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-calf-raise` | 扶墙提踵 | 小腿三头肌 | 墙 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-catcow-quad` | 四足猫牛式 | 竖脊肌+腹直肌（含深层腹横肌） | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-chair-dip` | 椅子臂屈伸 | 肱三头肌 | 椅 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-chair-kickback` | 扶椅站姿后踢腿 | 臀大肌（right） | 椅 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-chair-lat` | 扶椅背阔肌拉伸 | 背阔肌 | 椅 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-chair-sit-to-stand` | 普通椅双脚坐站 | 股四头肌+臀大肌 | 椅 | 8s/120f@15 | v2 |  | — | 已登记（office-lower-body-01） |  |
| `h-chair-step-up` | 椅子上步 | 股四头肌+臀大肌 | 椅 | 8s/120f@15 | v2 |  | — | PR #6 | 用无靠背椅（back: 0）；构图按站上椅面的最高姿态放置（stillAt 2.2），所以 still.png 不是起始站姿（docs/home-posterior-chain-2026-10-18.md） |
| `h-chair-tspine` | 跪姿椅面胸椎伸展 | 背阔肌+竖脊肌 | 垫、椅 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-cobra` | 眼镜蛇式 | 腹直肌（含深层腹横肌） | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-couch-stretch` | 沙发拉伸 | 髋屈肌+股四头肌（left） | 垫、椅 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-crossbody` | 交叉臂肩后侧拉伸 | 面板 deltRear/infraspinatus（right） | — | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-crunch` | 卷腹 | 腹直肌（含深层腹横肌） | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-db-calf-raise` | 双哑铃站姿提踵 | 小腿三头肌 | 哑铃 | 8s/120f@15 | v2 |  | — | 已登记（dumbbell-leg-14） | dumbbell-leg-14：双脚双哑铃站姿提踵；实际鞋底前端支点，负荷变式非新运动模式；低分抽查保留待GPU（docs/dumbbell-leg-14-2026-10-18.md） |
| `h-db-curl` | 哑铃交替弯举 | 肱二头肌 | 哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-floor-press` | 哑铃地板卧推 | 胸大肌+肱三头肌 | 垫、哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-lateral` | 哑铃侧平举 | 三角肌 | 哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-press` | 站姿哑铃推举 | 三角肌+肱三头肌 | 哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-rdl` | 哑铃罗马尼亚硬拉 | 腘绳肌+臀大肌 | 哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-reverse-fly` | 哑铃俯身飞鸟 | 三角肌+斜方肌中下部 · 菱形肌 | 哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-row` | 扶椅单臂哑铃划船 | 背阔肌+斜方肌中下部 · 菱形肌（right） | 椅、哑铃 | 8s/120f@15 | v2 |  | — | PR #5 |  |
| `h-db-split-squat` | 双哑铃原地分腿蹲 | 股四头肌+臀大肌（left） | 哑铃 | 8s/120f@15 | v2 |  | — | 已登记（dumbbell-leg-14） | dumbbell-leg-14：双哑铃原地分腿蹲；前脚全掌、后脚前足固定地面，左侧示范；低分抽查保留待GPU，非普通办公（docs/dumbbell-leg-14-2026-10-18.md） |
| `h-db-supported-calf-raise` | 单手哑铃扶墙双脚提踵 | 小腿三头肌 | 墙、哑铃 | 8s/120f@15 | v2 |  | — | 已登记（supported-calf-15） | supported-calf-15：单手哑铃扶墙双脚提踵；补原计划单手扶墙意图，014双哑铃版保留；条件办公需墙与器械净空；低分抽查保留待GPU（docs/supported-calf-15-2026-10-18.md） |
| `h-dd-shoulder` | 下犬式压肩 | 背阔肌+胸大肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-donkey-kick` | 四足屈膝后踢 | 臀大肌（right） | 垫 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | floor-glute-07：非办公地面；右膝约90°矢状面后踢，短垫承托双掌/左膝；低分抽查通过待GPU（docs/floor-glute-07-2026-10-18.md） |
| `h-forearm-plank` | 前臂平板支撑 | 腹直肌（含深层腹横肌）+腹斜肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-good-morning` | 徒手早安式 | 腘绳肌+竖脊肌 | — | 8s/120f@15 | v2 |  | — | PR #6 | 双手交叉抱胸（手放脑后时手网格贴不到刚性头部后侧），手不做 touch 吸附，掌心离胸约 1–5 mm（docs/home-posterior-chain-2026-10-18.md） |
| `h-hip-gate` | 扶椅站姿开髋门 | 髋屈肌+臀中肌 · 髋外展（right） | 椅 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-incline-pushup` | 扶凳上斜俯卧撑 | 胸大肌+肱三头肌 | 椅 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-inner-thigh` | 侧卧内收抬腿 | 内收肌群（left） | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-kb-swing` | 单臂壶铃摆荡 | 臀大肌+腘绳肌 | 壶铃 | 8s/120f@15 | v2 |  | — | PR #5 | 单臂版：双手握同一提手时两只拳头重叠，改单臂（docs/home-small-equipment-2026-10-18.md） |
| `h-knee-hug-r2` | 仰卧抱膝 | 竖脊肌+臀大肌 | 垫 | 8s/240f@30 | v2 | `h-knee-hug` | HipLab v0.1.0 作 h-knee-hug；HipLab v0.2.0 作 h-knee-hug | 已登记（2026-10-17 HipLab accepted media） |  |
| `h-knee-hug` | 仰卧抱膝 | 竖脊肌+臀大肌 | 垫 | 8s/120f@15 | v2 |  | 原版；v0.1.0 绑定 h-knee-hug-r2；原版；v0.2.0 绑定 h-knee-hug-r2 | PR #111 |  |
| `h-mountain-climber` | 慢速登山跑 | 腹直肌（含深层腹横肌）+髋屈肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-open-book` | 侧卧开书式 | 胸大肌+腹斜肌（right） | 垫 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-pike-pushup` | 派克俯卧撑 | 三角肌+肱三头肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-quad-cars-r2` | 四足髋关节画圈 | 面板 glutes/gluteMed/oblique（right） | 垫 | 8s/120f@15 | v2 | `h-quad-cars` | HipLab v0.1.0 作 h-quad-cars | PR #121 | v0.1.0 高亮仅部分修复（拼面板 glutes+gluteMed+oblique）；soft-v1 下腰侧多一团，v0.2.0 已改用原规格和 soft-v1 发布（docs/soft-highlight-2026-10-18.md）；flickscan 163 坏帧，位于鞋底纹（drill-anim/revisions/hiplab-media-fix-20261017/README.md） |
| `h-quad-cars` | 四足髋关节画圈 | 臀大肌+臀中肌 · 髋外展（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.2.0；原版；v0.1.0 绑定 h-quad-cars-r2 | PR #113 | v0.1.0 绑定 r2；v0.2.0 已用原规格和 soft-v1 发布（docs/soft-highlight-2026-10-18.md）；flickscan 小腿/鞋底纹 169 坏帧，既有问题（drill-anim/revisions/hiplab-media-fix-20261017/README.md） |
| `h-reverse-clam` | 侧卧反向蚌式 | 臀中肌 · 髋外展+臀大肌（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-reverse-crunch` | 反向卷腹 | 腹直肌（含深层腹横肌） | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-reverse-lunge` | 后撤步弓步蹲 | 股四头肌+臀大肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-russian-twist` | 俄罗斯转体 | 腹斜肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-seated-reachback` | 坐姿后撑滑臀 | 胸大肌+三角肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-side-er` | 侧卧肩外旋 | 肩袖肌群（right） | 垫 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-side-leg-raise` | 站姿侧抬腿 | 臀中肌 · 髋外展（right） | — | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-squat` | 徒手深蹲 | 股四头肌+臀大肌 | — | 8s/240f@30 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #111 |  |
| `h-standing-forearm-rotation` | 站姿屈肘前臂旋转 | 前臂 · 腕屈伸肌（right） | — | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | forearm-rotation-23：屈肘约90°，前臂真实骨与网格轴向旋前/旋后±60°；非腕屈伸或肩外旋；办公低负荷控制，低分保留待GPU（docs/forearm-rotation-23-2026-10-18.md） |
| `h-standing-wrist-extensor-stretch` | 站姿主动腕伸肌拉伸 | 前臂 · 腕屈伸肌（right） | — | 8s/120f@15 | v2 |  | — | 已登记（home-wrist-extensor-20） | home-wrist-extensor-20：站姿无承重主动腕屈，拉伸腕伸肌；办公单向基础式，区别018腕伸与跪姿多向摇摆；低分保留待GPU（docs/home-wrist-extensor-20-2026-10-18.md） |
| `h-step-jack` | 低冲击开合跳 | 三角肌+臀中肌 · 髋外展 | — | 8s/120f@15 | v2 |  | — | PR #111 |  |
| `h-suitcase-hold` | 单手哑铃静态提握抗侧屈 | 腹斜肌 | 哑铃 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | rockback-hold-09：单手静态提握抗侧屈；居家小器械，有哑铃/安全空间才适合办公；低分抽查通过待GPU（docs/rockback-hold-09-2026-10-18.md） |
| `h-sumo-pry` | 相扑深蹲肘推膝停留 | 内收肌群+臀大肌 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-superman` | 俯卧超人式 | 竖脊肌+臀大肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #6 |  |
| `h-supine-twist-r2` | 仰卧屈膝扭转 | 腹斜肌+竖脊肌 | 垫 | 8s/240f@30 | v2 | `h-supine-twist` | HipLab v0.1.0 作 h-supine-twist；HipLab v0.2.0 作 h-supine-twist | 已登记（2026-10-17 HipLab accepted media） |  |
| `h-supine-twist` | 仰卧屈膝扭转 | 腹斜肌+竖脊肌 | 垫 | 8s/120f@15 | v2 |  | 原版；v0.1.0 绑定 h-supine-twist-r2；原版；v0.2.0 绑定 h-supine-twist-r2 | PR #111 |  |
| `h-supported-single-leg-calf` | 扶墙单腿提踵 | 小腿三头肌（left） | 墙 | 8s/120f@15 | v2 |  | — | 已登记（supported-calf-15） | supported-calf-15：扶墙单腿提踵；左足承重、右足离地；条件办公需稳墙与基础能力；低分抽查保留待GPU（docs/supported-calf-15-2026-10-18.md） |
| `h-tabletop` | 桌面式后撑抬髋 | 胸大肌+三角肌 | 垫 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-tib-raise` | 靠墙勾脚尖 | 胫骨前肌 | 墙 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-towel-behind` | 背后握毛巾抬臂 | 胸大肌+三角肌 | 弹力带 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-towel-pass` | 毛巾过头转肩 | 胸大肌+三角肌 | 弹力带 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-towel-pulldown` | 站姿毛巾下拉 | 背阔肌+斜方肌中下部 · 菱形肌 | 弹力带 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-wall-angel` | 靠墙天使 | 胸大肌+背阔肌+斜方肌中下部 · 菱形肌 | 墙 | 8s/120f@15 | v2 |  | — | PR #115 |  |
| `h-wall-calf-bent-knee` | 扶墙屈膝小腿拉伸 | 小腿三头肌（right） | 墙 | 8s/120f@15 | v2 |  | — | 已登记（office-lower-body-01） |  |
| `h-wall-calf` | 靠墙小腿拉伸 | 小腿三头肌（right） | 墙 | 8s/120f@15 | v2 |  | — | PR #112 |  |
| `h-wall-pec` | 靠墙单臂胸肌拉伸 | 胸大肌+肱二头肌（right） | 墙 | 8s/120f@15 | v2 |  | — | PR #112 | PR #112 作者 QA 右肘报警（docs/home-drills-51-plan-2026-10-15.md） |
| `h-wall-straddle` | 靠墙仰卧V字分腿 | 内收肌群+腘绳肌 | 垫、墙 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #113 |  |
| `h-wall-wrist-flexor-stretch` | 站姿扶墙腕屈肌拉伸 | 前臂 · 腕屈伸肌（right） | 墙 | 8s/120f@15 | v2 |  | — | 已登记（home-pr-candidates） | home-wrist-stretch-18：站姿墙面单一腕伸，区别于跪姿多向腕摇摆；真实掌面接触分布检查通过，低分保留待GPU（docs/home-wrist-stretch-18-2026-10-18.md） |

## n-* HipLab 开胯 MVP 新增（PR #119）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `n-chair-wiper` | 坐椅雨刷（膝内倒） | 臀中肌 · 髋外展+臀大肌 | 椅 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-half-split` | 半跪半劈叉（扶砖） | 腘绳肌（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-leg-circles` | 仰卧直腿画圈 | 髋屈肌+臀中肌 · 髋外展（right） | 垫 | 12s/180f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 | 求解器提示 29 帧，指标全过（docs/hiplab-phase1-drills-2026-10-16.md） |
| `n-pelvis-circle` | 站姿骨盆画圈 | 髋屈肌+臀大肌+臀中肌 · 髋外展 | — | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-prone-hip-ext` | 俯卧屈膝抬腿 | 臀大肌（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-prone-ir` | 俯卧小腿外摆（髋内旋） | 臀中肌 · 髋外展+臀大肌 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-seated-ir-drop` | 坐姿后撑单膝内倒 | 臀大肌+臀中肌 · 髋外展 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 | 替代未完成的 n-9090-ir-lean（docs/hiplab-phase1-drills-2026-10-16.md） |
| `n-seated-knee-lift` | 坐姿抬膝悬停 | 髋屈肌 | 椅 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-seated-squeeze` | 坐姿夹砖（膝内夹） | 内收肌群 | 椅、垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 | 原计划“夹拳+外推”改为夹砖，外推半部分未做（docs/hiplab-phase1-drills-2026-10-16.md）；2 vCPU/SwiftShader 预览 >75 s 不出第一帧，原因未查（docs/onboarding-audit-2026-10-18.md） |
| `n-slider-lateral` | 滑垫侧向滑 | 内收肌群（right） | 滑垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-squat-shift` | 低位蹲姿左右移重心 | 内收肌群+臀大肌 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-straddle-fold` | 坐姿分腿体前屈 | 内收肌群+腘绳肌 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-thomas-test` | 仰卧单膝抱胸（托马斯测试） | 髋屈肌（right） | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-wide-fold` | 站姿宽距体前屈（扶椅） | 内收肌群+腘绳肌 | 椅 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |
| `n-windshield` | 仰卧雨刷式 | 臀大肌+臀中肌 · 髋外展 | 垫 | 8s/120f@15 | v2 |  | HipLab v0.1.0；HipLab v0.2.0 | PR #119 |  |

## a-* HipLab 自测对比静图（PR #119 + r2）

| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |
|---|---|---|---|---|---|---|---|---|---|
| `a-9090-r2` | 自测·90/90 对比图 | 臀大肌 | 垫 | 10s/150f@15 | v2 | `a-9090` | HipLab 自测静图（替代 a-9090） | PR #121 |  |
| `a-9090` | 自测·90/90 对比图 | 臀大肌 | 垫 | 10s/150f@15 | v2 |  | 原版，App 已换 r2 | PR #119 |  |
| `a-butterfly` | 自测·蝴蝶式膝高 对比图 | 内收肌群 | 垫 | 6s/90f@15 | v2 |  | HipLab 自测静图 | PR #119 |  |
| `a-deep-squat-r2` | 自测·深蹲到底 对比图 | 臀大肌 | 垫 | 6s/90f@15 | v2 | `a-deep-squat` | HipLab 自测静图（替代 a-deep-squat） | PR #121 | glow-B 下几乎无青色高亮（臀肌朝后）（drill-anim/revisions/hiplab-media-fix-20261017/README.md） |
| `a-deep-squat` | 自测·深蹲到底 对比图 | 臀大肌+内收肌群 | 垫 | 6s/90f@15 | v2 |  | 原版，App 已换 r2 | PR #119 |  |
| `a-seated-fold` | 自测·坐姿体前屈 对比图 | 腘绳肌 | 垫 | 6s/90f@15 | v2 |  | HipLab 自测静图 | PR #119 |  |
| `a-supine-cross` | 自测·仰卧单腿横跨 对比图 | 臀中肌 · 髋外展（right） | 垫 | 6s/90f@15 | v2 |  | HipLab 自测静图 | PR #119 |  |
| `a-thomas-r2` | 自测·托马斯测试 对比图 | 髋屈肌（right） | 垫 | 6s/90f@15 | v2 | `a-thomas` | HipLab 自测静图（替代 a-thomas） | PR #121 | glow-B 下 hip-flexors 只亮一个小点（drill-anim/revisions/hiplab-media-fix-20261017/README.md） |
| `a-thomas` | 自测·托马斯测试 对比图 | 髋屈肌（right） | 垫 | 6s/90f@15 | v2 |  | 原版，App 已换 r2 | PR #119 |  |

## 已有 spec 但未被任何 App / 发布版本使用

这些是“可直接拿来出新版本”的存量；动作审核优化优先从这里挑。

- **g**（2）：`g-cable-hip-abduction` `g-cable-hip-extension`
- **t**（11）：`t-flare-side-hold` `t-half-straddle` `t-lsit-open-close` `t-lsit-tuck` `t-lsit-vsit-circles` `t-lsit-wide` `t-seated-straddle-ext` `t-seated-straddle-lifts` `t-straddle-hold` `t-tuck-planche` `t-vsit`
- **o**（16）：`o-chair-knee-extension` `o-seated-calf-raise` `o-seated-catcow` `o-seated-hip-er` `o-seated-sidebend` `o-seated-twist` `o-stand-ham` `o-stand-quad` `o-stand-sidebend` `o-supported-ankle-inversion` `o-supported-ankle-pump` `o-supported-knee-curl` `o-supported-march` `o-supported-mini-squat` `o-supported-single-leg-rdl` `o-wall-hip-hinge-stretch`
- **w**（6）：`w-bird-dog` `w-chair-hip-thrust` `w-dead-bug` `w-fire-hydrant` `w-prone-swimmer` `w-wall-sit`
- **h**（64）：`h-banana` `h-band-pallof` `h-band-pull-apart` `h-band-row` `h-band-standing-abduction` `h-band-standing-adduction` `h-bear-plank` `h-biceps-self` `h-bridge-march` `h-bridge-overhead` `h-bulgarian` `h-calf-raise` `h-catcow-quad` `h-chair-dip` `h-chair-kickback` `h-chair-lat` `h-chair-sit-to-stand` `h-chair-step-up` `h-chair-tspine` `h-cobra` `h-crossbody` `h-crunch` `h-db-calf-raise` `h-db-curl` `h-db-floor-press` `h-db-lateral` `h-db-press` `h-db-rdl` `h-db-reverse-fly` `h-db-row` `h-db-split-squat` `h-db-supported-calf-raise` `h-dd-shoulder` `h-donkey-kick` `h-forearm-plank` `h-good-morning` `h-incline-pushup` `h-inner-thigh` `h-kb-swing` `h-mountain-climber` `h-open-book` `h-pike-pushup` `h-reverse-crunch` `h-reverse-lunge` `h-russian-twist` `h-seated-reachback` `h-side-er` `h-side-leg-raise` `h-standing-forearm-rotation` `h-standing-wrist-extensor-stretch` `h-step-jack` `h-suitcase-hold` `h-superman` `h-supported-single-leg-calf` `h-tabletop` `h-tib-raise` `h-towel-behind` `h-towel-pass` `h-towel-pulldown` `h-wall-angel` `h-wall-calf-bent-knee` `h-wall-calf` `h-wall-pec` `h-wall-wrist-flexor-stretch`

原版已被在用修订取代（9）：`a-9090`→`a-9090-r2` `a-deep-squat`→`a-deep-squat-r2` `a-thomas`→`a-thomas-r2` `h-9090-liftoff`→`h-9090-liftoff-r2` `h-knee-hug`→`h-knee-hug-r2` `h-supine-twist`→`h-supine-twist-r2` `s-9090`→`s-9090-r2` `s-frog`→`s-frog-r2` `s-seated-fold`→`s-seated-fold-r3`

## 文档中提到计划、但没有 spec（待补全候选）

| 候选 | 内容 | 为什么还没有 | 出处 |
|---|---|---|---|
| h-overhead-triceps-stretch | 站姿过头肱三头肌拉伸 | 019两轮修正后辅助左手对右上臂径向穿入指标仍−5.85mm；停止未登记，不计完成；需新接触参考再开 | docs/home-triceps-stretch-19-2026-10-18.md |
| h-dead-bug-heel-tap | 死虫式脚跟点地 | 017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成 | docs/remaining-pose-bases-17-2026-10-18.md |
| h-supine-pelvic-tilt | 仰卧骨盆前后倾 | 017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成 | docs/remaining-pose-bases-17-2026-10-18.md |
| h-supine-active-ham | 仰卧主动腘绳肌拉伸 | 017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成 | docs/remaining-pose-bases-17-2026-10-18.md |
| h-strap-supine-ham | 仰卧带辅助直腿拉伸 | 017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成 | docs/remaining-pose-bases-17-2026-10-18.md |
| s-9090-switch-new | 90/90左右换髋新规格 | 017：真左右换髋关键姿态两轮后端点臀仍悬空且大腿穿地；blocked，不登记，不计完成 | docs/remaining-pose-bases-17-2026-10-18.md |
| g-cable-knee-curl | 绳索站姿腿弯举 | curl-sideplank-16：胫骨扣不同于010脚随动带；两次修正后绳路虽清除，但扣边圆环仍穿胫骨约2.50mm/顶点鞋约2.22mm，停止不登记 | docs/curl-sideplank-16-2026-10-18.md |
| h-short-side-plank | 屈膝短杠杆侧平板 | curl-sideplank-16：前臂与中段侧胫接近地面，但真实膝部50mm邻域仍悬空12.52mm；两次修正后静态门槛失败，头本来悬空不是失败原因，停止不登记 | docs/curl-sideplank-16-2026-10-18.md |
| h-band-seated-hip-er | 坐椅弹力带髋外旋 | band-hip-knee-10：撤回初评；实际臀/工作侧大腿悬空，只有左大腿接近座前缘，未形成可靠坐姿承托；停止未登记。既有o-seated-hip-er同姿势列待复核，不改旧spec | docs/band-hip-knee-10-2026-10-18.md |
| h-band-standing-knee-curl | 扶椅弹力带屈膝 | band-hip-knee-10：身体/扶椅合格但两轮绑带修正后顶点带路仍与右鞋相交，停止未登记，不计完成 | docs/band-hip-knee-10-2026-10-18.md |
| h-quadruped-rockback | 四足中立背后坐 | rockback-hold-09：初稿及两次修正后直臂/可达不能同时满足，停止未登记，不计完成；膝掌接触本身已分别验证 | docs/rockback-hold-09-2026-10-18.md |
| h-side-lying-hip-abduction | 侧卧直腿外展 | floor-hip-knee-08：两轮后托头手穿头6.57mm、短裤穿地20.4mm及可达告警，停止未登记，不计完成 | docs/floor-hip-knee-08-2026-10-18.md |
| h-prone-knee-curl | 俯卧徒手屈膝 | floor-hip-knee-08：两轮后头手穿插33.87–38.84mm、前臂穿地4.5mm且大腿/膝悬空，停止未登记，不计完成 | docs/floor-hip-knee-08-2026-10-18.md |
| o-wall-forearm-plank | 站姿扶墙前臂支撑 | office-support-06：两轮后掌接触近似成立，肘部网格距墙仍5.66mm，停止未登记，不计完成 | docs/office-support-06-2026-10-18.md |
| o-chair-adductor-stretch / o-chair-wide-adductor-stretch | 坐椅宽膝内收肌拉伸（侧移/前倾候选） | office-adductor-back-03：侧移目标机制不充分且手撑座不可达；前倾版两轮座面修正仍有5–7.5mm大腿穿座，撤下未登记；由o-seated-hip-er顺延补位 | docs/office-adductor-back-03-2026-10-18.md |
| o-seated-knee-hug | 坐椅单膝抱近胸 | office-hip-leg-02两轮修正后手腕可达/手贴小腿仍不可信，撤下；由坐椅侧伸替补，不计完成，待接触条件解决 | docs/office-hip-leg-02-2026-10-18.md |
| n-9090-ir-lean | 90/90 向后腿侧倾（被动内旋末端） | 两轮后手掌贴垫/腰弯 ≤45° 做不到，暂以 n-seated-ir-drop 代替；需模型手部/腰部改进 | docs/hiplab-phase1-drills-2026-10-16.md |
| （无 id）坐姿夹砖“外推”半部分 | 坐姿膝外推（弹力带版） | 手掌放膝内侧会陷入大腿，改夹砖；文档建议以后做弹力带版 | docs/hiplab-phase1-drills-2026-10-16.md |
| s-9090-switch | 90/90 左右换髋 | 最终修订只在 drill-anim/revisions/hark-4080-v1/s-9090-switch/，specs/ 下无同名 spec，未进 verify 契约 | docs/drill-anim/hark-4080-v1.md |
| （道具） | 引体杆/泡沫轴/瑞士球/地雷杆/绳索等道具复核 | drill-anim/README 写“未写/未验证”，但 specs 已在用 pullupBar、foamRoller、swissBall、landmine、cableStack —— README 道具一节过时，需逐个复核穿模 | drill-anim/README.md#props |
| h-goblet-squat | 哑铃高脚杯深蹲 | 双掌托哑铃头的握法 2 轮以上仍不可信（手掌张平、和哑铃有缝），本批放弃，由 h-db-reverse-fly 补位；需模型手部改进 | docs/home-small-equipment-2026-10-18.md |
| （h-* 51 项接入） | 居家/肌群补充/开胯/开肩 51 项 | 源码已审，作者成片/QA 未取回，未注册任何 App（被 HipLab v0.1.0 选中的除外） | docs/home-drills-51-plan-2026-10-15.md |

新增候选请同时补到 `drill-anim/tools/catalog.mjs` 的 `PLANNED` 表并重新生成。
