# 交接方案：本机全量生产 249 个动作包（给本机 agent）

> 你是本机执行 agent。**严格按本文件一步一步做**，不要自作主张改代码、改文案、改配置。
> 遇到本文没写到的情况：**停下来，把报错原文和你执行到第几步，报告给用户**。

---

## 0. 你的任务一句话

在 Windows 本机（RTX 4080）上，用仓库 `3D-Pose-Hub` 分支 `codex/remaining219-templates`，
运行 `produce.py` 生产全部 249 个动作包，结果按第 2 节的规范保存到 `F:\PoseHub-v3\`，
跑完用 `check_run.py` 检查，把检查报告交给用户。

## 1. 绝对不要做的事（红线）

1. **不要**合并 PR、不要推送到 `main`、不要打 tag、不要发 Release。
2. **不要**修改 `catalog/production/v3-text/` 下任何文案 JSON，也不要改 `tools/` 下任何代码和 `profiles/`、`skins/`。
3. **不要**删除 `F:\PoseHub-v3\runs\` 下任何已经生成的东西。需要"清掉"一个失败动作时，只能**移动**到 `_quarantine`（见第 6 节）。
4. **不要**手动改 `package.json`、`action.json` 里的 `userAccepted` / `releaseEligible` 等状态，它们必须保持 `false`，等用户人工验收。
5. **不要**加 `--heavy` 参数（那是云端沙箱专用的，本机没有 `/workspace/bin/heavy`）。
6. **不要**加 `--verify-size` / `--verify-frames`（那是小样模式，会把结果标成 sampled，不是正式产物）。
7. **不要**同时开两个 `produce.py`。永远只跑一个。

## 2. F 盘目录规范（必须照做）

```
F:\PoseHub-v3\
├─ README-目录规范.txt                 ← 把本节内容抄一份进去（第一次建目录时）
├─ runs\                                ← 每次正式生产一个子目录
│  └─ 2026-11-02_v3r2_<commit7位>\      ← 本次运行目录 = produce.py 的 --root
│     ├─ masters\        （produce 自动生成：1080 逐帧透明母版，最大，不要动）
│     ├─ packages\       （produce 自动生成：每个动作一个文件夹 = 交付物）
│     ├─ voice\          （produce 自动生成：通用语音 common）
│     ├─ index.json      （produce 自动生成：全部动作索引）
│     ├─ production-log.jsonl （produce 自动生成：每个动作一行结果）
│     ├─ _run\           （你自己建：运行记录）
│     │  ├─ RUN-INFO.json         ← 第 4.3 步写
│     │  ├─ STATUS.txt            ← 一个词：running / stopped / finished / checked
│     │  ├─ console-01.log        ← 每次启动 produce 的控制台输出，依次 02、03…
│     │  ├─ check-report.md       ← check_run.py 自动生成
│     │  └─ check-report.json     ← check_run.py 自动生成
│     └─ _quarantine\    （你自己建：被移走的失败半成品，按 <动作id>_<时间> 命名）
└─ trial\                               ← 第 5 步的 3 个试跑动作单独放这里
   └─ 2026-11-02_v3r2_<commit7位>\
```

命名规则：
- 运行目录名 = `日期_v3r2_提交号前7位`，例如 `2026-11-02_v3r2_d8a4805`。日期用开始当天。
- 同一天如果要从头重跑一整次（一般不需要），后面加 `_b`、`_c`，**不要覆盖旧目录**。
- 中断后续跑：**用同一个目录**，不要新建。

## 3. 开始前检查（每项都要确认，写进 RUN-INFO.json）

在仓库根目录（下文记作 `<repo>`）打开 PowerShell：

```powershell
cd <repo>
git fetch origin
git checkout codex/remaining219-templates
git pull
git log -1 --format=%H        # 记下完整提交号，前 7 位用于目录名
git status                    # 必须是 "nothing to commit, working tree clean"
```

- `git status` 不干净 → 停，报告用户。
- 提交号应当是 `d8a4805…` 或更新（用户可能后来又推了）。以实际 `git log -1` 为准。

依赖检查（每条都要能出版本号）：

```powershell
node -v          # 需要 18 或更高
python --version # 需要 3.10 或更高
ffmpeg -version  # 必须在 PATH 里
python -c "import numpy, PIL, edge_tts; print('py deps ok')"
```

缺什么装什么：
```powershell
npm install
pip install numpy pillow edge-tts
```
如果后面报浏览器（Chromium）找不到：`npx playwright install chromium`。

网络：语音用微软 Edge TTS，**必须联网**。

磁盘：
```powershell
Get-PSDrive F     # 看 Free 一列
```
记下剩余空间。第 5 步试跑完会估算总量。

显卡：打开 `<repo>\drill-anim\config.json`，看 `chromium_args`。
**只有用户明确同意时**才改成硬件 GL（见同文件 `_gpu_doc`）；不改也能跑，只是慢。
改了的话把改动写进 RUN-INFO.json，并且**不要提交这个改动**。

## 4. 启动 dev server（必须先手动启动）

另开一个 PowerShell 窗口，一直开着：

```powershell
cd <repo>
npm run dev -- --host 127.0.0.1 --port 8830 --strictPort
```

看到类似 `Local: http://127.0.0.1:8830/` 才算好。这个窗口在整个生产期间**不要关**。
（Windows 上一定要手动启动，脚本自动启动在 Windows 下不可靠。）

### 4.3 写 RUN-INFO.json

在运行目录的 `_run\` 下写（内容按实际填）：

```json
{
  "repo": "3D-Pose-Hub",
  "branch": "codex/remaining219-templates",
  "commit": "<完整提交号>",
  "profile": "default",
  "root": "F:/PoseHub-v3/runs/2026-11-02_v3r2_xxxxxxx",
  "machine": "本机 RTX 4080",
  "chromium_args_changed": false,
  "freeSpaceBeforeGB": 0,
  "startedAt": "2026-11-02 10:00 CST",
  "operator": "本机 agent",
  "notes": ""
}
```

`STATUS.txt` 写 `running`。

## 5. 试跑 3 个动作（必须先做，通过了才能跑全量）

```powershell
cd <repo>
python tools/action-package-v3/produce.py --root F:/PoseHub-v3/trial/2026-11-02_v3r2_xxxxxxx --ids s-pigeon,w-dead-bug,h-bear-plank *>&1 | Tee-Object F:/PoseHub-v3/trial/2026-11-02_v3r2_xxxxxxx/console-trial.log
python tools/action-package-v3/check_run.py --root F:/PoseHub-v3/trial/2026-11-02_v3r2_xxxxxxx
```

通过标准（全部满足）：
1. 控制台最后一行 `summary` 里是 `"complete": 3`，没有 `failed`。
2. `check-report.md` 里这 3 个动作**不在问题表里**（其他 246 个显示 missing 是正常的）。
3. 打开 `packages\s-pigeon\realistic\dark\loop.720.mp4`（文件名里的数字可能不同）能正常播放，人物完整没被裁。

估算空间：看 trial 目录总大小 ÷ 3 × 249 × 1.2，就是全量大概需要的空间。
**如果 F 盘剩余不够，停，报告用户**，不要开始全量。

把每个动作耗时（production-log.jsonl 里的 `seconds`）平均一下 × 249，告诉用户预计总时长。

试跑任何一条不通过 → 停，把 `console-trial.log` 最后 50 行和 `check-report.md` 发给用户。

## 6. 全量生产

```powershell
cd <repo>
python tools/action-package-v3/produce.py --root F:/PoseHub-v3/runs/2026-11-02_v3r2_xxxxxxx *>&1 | Tee-Object F:/PoseHub-v3/runs/2026-11-02_v3r2_xxxxxxx/_run/console-01.log
```

- 它是**严格串行**的，一个动作做完才做下一个，每个动作完成会打印一行 JSON。
- 单个动作失败**不会**停止整批，它会记日志后继续下一个。
- 看进度（另开窗口，随时可以跑，不影响生产）：
  ```powershell
  python tools/action-package-v3/produce.py --root F:/PoseHub-v3/runs/2026-11-02_v3r2_xxxxxxx --dry-run
  ```
  最后一行 `summary` 里 `todo` 是还没做的数量。

### 中断了怎么办（断电、关机、报错退出）

1. `STATUS.txt` 改成 `stopped`。
2. 确认 dev server 还在（第 4 步），不在就重新启动。
3. 用**完全相同的命令**再跑一次，日志文件编号加 1（`console-02.log`）。已完成的会自动跳过。
4. `STATUS.txt` 改回 `running`。

### 某个动作报 `incomplete masters for <id>`

说明那个动作上次渲染到一半断了。处理：
1. 建 `_quarantine\<id>_<yyyyMMdd-HHmm>\`。
2. 把 `masters\<id>\` 整个**移动**进去（如果 `packages\<id>\` 也存在，也一起移进去）。
3. 只重跑这一个：`produce.py --root <同一目录> --ids <id>`。
4. 再失败 → 不要第三次重试，记下来交给用户。

### 某个动作 state 是 `failed`（不是上面那种）

不要反复重试。全量跑完后统一处理：每个失败的动作**最多重跑 1 次**（`--ids` 逗号分隔一起跑）。还失败就留给用户。

### 某个动作 state 是 `voice-audit-failed`

不要重跑，不要改文案。原样记录交给用户（是文案/语音时长问题，需要在云端改）。

### 某个动作 state 是 `needs-text`

不应该出现。出现了就记录交给用户。

## 7. 跑完之后

1. 最后一行 `summary` 出现后，`STATUS.txt` 改成 `finished`。
2. 运行检查：
   ```powershell
   python tools/action-package-v3/check_run.py --root F:/PoseHub-v3/runs/2026-11-02_v3r2_xxxxxxx
   ```
   会生成 `_run\check-report.md` 和 `_run\check-report.json`。
3. 按第 6 节规则处理失败项（最多重跑 1 次），然后**再跑一次 check_run.py**。
4. `STATUS.txt` 改成 `checked`。RUN-INFO.json 补上 `finishedAt`、`freeSpaceAfterGB`、
   `summary`（check-report 里那一行）。
5. **交给用户的东西**（只要这些小文件，不要上传 masters/packages 大文件）：
   - `_run\check-report.md`
   - `_run\check-report.json`
   - `production-log.jsonl`
   - `index.json`
   - `_run\RUN-INFO.json`
   打成一个 zip：`F:\PoseHub-v3\runs\<目录名>\_run\report-<目录名>.zip`，告诉用户路径。

## 8. 给用户的汇报格式（每次汇报都用这个）

```
【完成/未完成】PoseHub v3 全量生产
- 运行目录：F:\PoseHub-v3\runs\<目录名>
- 提交：<7位提交号>
- 进度：complete X / 249，failed Y，voice-audit-failed Z
- 耗时：已用 N 小时，预计还要 M 小时
- 空间：F 盘剩余 G GB
- 需要用户处理：<没有就写"无"；有就列动作 id + 一句原因>
```

汇报时机：试跑完成、全量开始、每完成约 50 个、出现需要用户处理的问题、全部完成。

## 9. 常见报错速查

| 报错里有 | 原因 | 做法 |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:8830` | dev server 没开或关了 | 重新做第 4 步，然后续跑 |
| `ffmpeg failed` / `ffmpeg 不是内部或外部命令` | ffmpeg 不在 PATH | 装好 ffmpeg 并加 PATH，开新窗口续跑 |
| `No module named edge_tts` / `numpy` / `PIL` | 缺 Python 包 | `pip install numpy pillow edge-tts`，续跑 |
| `TimeoutError` 且在语音阶段 | 网络/Edge TTS 暂时不通 | 等 5 分钟后续跑（同一命令） |
| `Executable doesn't exist` / chromium | 缺浏览器 | `npx playwright install chromium`，续跑 |
| `rig signature` / `refuse` / `incompatible` | 模型对不上 | 不要改任何东西，停，报告用户 |
| `exists` / `refusing to overwrite` | 输出不可覆盖 | 按"incomplete masters"那节移到 _quarantine 后只重跑该动作 |
| 磁盘满 `No space left` / `ENOSPC` | F 盘满了 | 停，`STATUS.txt` 写 stopped，报告用户 |

其他任何报错：停，报告用户，附控制台最后 50 行。
