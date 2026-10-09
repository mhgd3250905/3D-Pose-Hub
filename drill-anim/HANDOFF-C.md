# 同事 2 · C 档（健身房）9 个动作

> ⚠️ **分支、PR、Drive 存放、进度表的规则一律以 `COLLAB.md` 为准**：一个动作一个 `drill/<id>` 分支、一个 PR，base 是 `feature/drill-anim`；Drive 按 `<档位>/<id>/<id>_vN.*` 存放。本文中与 COLLAB.md 冲突的旧说法作废。

通用的环境搭建、流程、硬规则、输出规格和验收标准，**全部按 `HANDOFF.md` 执行**（第 4–10 节）。本页只说明你的分工。注意：HANDOFF.md 正文的写法是给 B 档同事的，遇到“B 档”时换成你这 9 个动作即可。

## 你的动作
| id | 名称 | 器械 | 难度 |
|---|---|---|---|
| chest-C | 绳索单臂站姿推胸 | 绳索 · 单柄 | ★★ 建议第一个做，用来把绳索器械跑通 |
| rotator-cuff-C | 绳索 90/90 外旋 | 绳索 · 单柄 | ★★ |
| obliques-C | 绳索高位伐木 | 绳索 · 单柄或绳 | ★★★ 躯干旋转加转髋 |
| hip-flexors-C | 绳索站姿直腿前抬 | 绳索 · 脚踝扣 | ★★ 单腿站立 |
| adductors-C | 绳索站姿髋内收 | 绳索 · 脚踝扣 | ★★ 单腿站立 |
| deltoids-C | 地雷杆半跪单臂推举 | 地雷杆 + 杠铃杆 | ★★ 半跪姿 |
| hip-abductors-C | 器械髋外展 | 髋外展机 | ★★ 坐姿，器械建模 |
| quadriceps-C | 器械腿屈伸（顶端锁直） | 腿屈伸机 | ★★ 坐姿，器械建模 |
| forearms-C | 壶铃倒握行走 | 轻壶铃 | ★★★ 行走循环。壶铃复用同事 1 做的，还没做好的话先放占位 |

建议顺序：先做 chest-C，再做其余 4 个绳索动作，然后 deltoids-C、两个器械动作，最后 forearms-C。

## 你负责的道具（写在 `page/props.js`，每个道具一个独立函数）
- **绳索器械**：立柱、可调滑轮、钢绳、单柄、绳索把手、脚踝扣。钢绳必须始终是从滑轮到把手的一条直线，长度随动作变化，不能穿过身体。
- **地雷杆**：底座、杠铃杆、可选小片。
- **髋外展机、腿屈伸机**：做简化但比例可信的造型；坐垫、靠背、垫枕要和身体贴合，不能穿模。

## 分支与归档
- 分支：从 `feature/drill-anim` 拉出 `feature/drill-anim-C2`，阶段性 PR 回 `feature/drill-anim`。不要合并 master。
- Drive：成品放进 Drive「Flare drill-anim / C-tier」，每个动作上传 mp4、sheet、metrics，同名重传时旧版挪进 `_old-versions`。
- 做完 9 个后，生成 `C2-sheet.png`（9 行，每行一张参考图加一张关键帧）放进 Drive，然后发 PR。

## 拿代码
- 有 GitHub 写权限：`git clone https://github.com/mhgd3250905/3D-Body && git checkout feature/drill-anim`
- 暂时没有：用压缩包里 `2_代码` 下的 bundle，`git clone 3D-Body-feature-drill-anim.bundle 3D-Body -b feature/drill-anim`；之后有了权限，执行 `git remote set-url origin https://github.com/mhgd3250905/3D-Body`。
