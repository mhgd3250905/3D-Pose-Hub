# GitHub远端接手：弱云服务器串行制作219动作模板

这是本轮远端agent的执行入口。用户已明确远端只有配置有限的云服务器，可以浏览器串行、简单低分辨率关键帧验证。该限制替代[经验手册](remaining219-template-handoff-20261029-r1.md)中面向本机的路径、RTX4080预览命令、完整低清循环和双lane建议；动作与质量标准仍沿用经验手册。

## 可直接转给agent的任务

> 从 `https://github.com/mhgd3250905/3D-Pose-Hub` 最新main检出，读本文件及AGENTS.md，建立自己的 `codex/remaining219-templates` 分支。按固定219项队列逐个检查原动作，用当前人体/手型及已经验证的关节组件，修复明显问题，保存今后可复用的动作脚本和生产配方。你只做浏览器串行、256px优先、每动作3–6张关键帧初检；正常者直接过，疑似问题定位后做最小修正。不要跑全库视频、全30Hz姿态采集或最终高清。每3–6项记录进度与证据，完成后交回可复核的源码/配方/索引和关键帧包，留下本机完整循环复核队列。不要把关键帧通过标成用户验收或最终完成。

远端属于贡献方，main合并、审核与素材发布仍由主线维护方完成。按照派发时的推送/PR授权提交分支和PR；若派发未授权远端写入，先准备本地提交及可审阅diff，再确认最后一步，不因此停止制作。不会由本文自动授予发布、清理或覆盖既有成果的权限。

## 1. 克隆与源码准备：不依赖原制作机

```bash
git clone https://github.com/mhgd3250905/3D-Pose-Hub.git
cd 3D-Pose-Hub
git status --short
git switch -c codex/remaining219-templates
python3 tools/action-completion-v3-r2/remote-source-preflight-r1.py
python3 tools/action-completion-v3-r2/remote-source-preflight-r1.py --restore-missing
```

已有检出先核对remote、工作树和分支，从最新 `origin/main` 新建自己的分支，禁止reset/clean覆盖WIP。上述命令只用于全新检出；分支已存在就核对后复用。完整克隆用于旧规格基线校验；浅克隆需先 `git fetch --unshallow`，不能把浅克隆缺对象当作动作缺失。

固定清单是 [remaining219-source-queue](../catalog/production/remaining219-source-queue-20261029-r1.json)：251动态减首批32，精确219稳定ID，不包括静图、停止项或仅名称规划。**不按最大rN选源**。

本次在真正GitHub克隆中发现 `d550cd…` 不可读，原历史Git生成器因而不能直接用于远端起步。现已随main提供 [源码恢复包](../catalog/production/remaining219-source-pack-r1/README.md)：308个固定源码/依赖文件及历史参考catalog，约0.8MB。新preflight不依赖该历史提交；校验SHA/blob后只创建缺失文件。基线预期缺50个（45选定入口+5依赖），已有同LF内容不动，冲突先报告。不需要下载原机F盘归档，也不需要访问 `127.0.0.1:8845`——那是原机本地服务。

首次恢复可能令原来未出现在main的规格重新进入扫描。按仓库规则登记原源/修订哈希、更新目录并运行verify；不能通过删规格、降低原QA或修改冻结旧源来消除校验失败。新适配使用新revision和独立 `catalog/production/remaining219-r1/` 配方。不要改冻结的32配方或旧快照。

## 2. 最新模型与有限环境

本批显式选择 `training-human-v3-armfix / 0.1.0-r2`，参考 `catalog/production/remaining32-r4/groups/`。旧START-HERE的全局v2plus制作入口不适用于本次迁移。模型与手型已在Git内；不复用原机浏览器路径、runtime哈希或绝对盘符。

先准备无浏览器的工作：队列来源校验、阅读动作、配方与镜头设计、CPU检查。浏览器只在关键帧阶段使用，每次一个进程、一个动作、一个attempt。默认256×256、4张；疑似肘/腕/踝或手型问题可用320×320、明确峰值时刻，最多6张。第一轮选2–3种不同体位/握持的代表动作跑通，再扩展队列。不要启动多个agent同时争用浏览器。

Node须满足项目Vite的引擎要求（`^20.19` 或 `>=22.12`），Python3用于来源检查。关键帧入口不编码视频，无需ffmpeg、Pillow、SciPy或完整生产工具链：

```bash
npm ci
npm install --no-save --package-lock=false playwright@1.48.2
npx playwright install chromium
# Linux系统库缺失时按实际权限安装系统依赖：
# npx playwright install-deps chromium
```

Playwright版本来自仓库配置示例，实际浏览器与renderer会另写远端报告，不继承原GPU身份。没有系统安装权限时如实报告缺库，继续源和模板工作；不要反复重启失败浏览器或伪造渲染成功。

在远端创建gitignored `drill-anim/config.json`。不存在才创建，已有配置先检查，不用脚本直接覆盖。以下是Linux示例，路径按远端实际环境设置：

```json
{
  "app_url": "http://127.0.0.1:8830",
  "work_dir": "/tmp/posehub-remote-work",
  "playwright_module": "../node_modules/playwright/index.mjs",
  "chromium_args": ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
}
```

使用非root浏览器进程。缺系统共享库、不可用WebGL或内存不足时停止该渲染步骤，记录具体报错；不要改冻结模型或禁用验证来绕过。新入口启动空闲内存至少1.25GiB、每张前至少0.5GiB；低于门槛可继续无浏览器整理，留给本机补图。软件渲染允许，必须如实标注。

## 3. 串行关键帧入口

新入口是 [remote-keyframes-r1.mjs](../tools/action-completion-v3-r2/remote-keyframes-r1.mjs)，[完整用法](../tools/action-completion-v3-r2/remote-keyframes-r1.README.md)。原R8锁定RTX4080，不在云端运行，也不要修改它的冻结约束。

仓库根另开一个终端启动Vite，限制本机访问：

```bash
npm run dev -- --port 8830 --strictPort
```

先用已知正常配方验证新环境，再替换为自己的新配方和新输出目录：

```bash
node tools/action-completion-v3-r2/remote-keyframes-r1.mjs \
  --recipe catalog/production/remaining32-r4/groups/home/h-bear-plank.json \
  --out /tmp/posehub-remote-work/bear-attempt01 --size 256 --count 4
```

按动作实际duration/峰值选择 `--times 0,1,3,8` 等3–6个递增秒数；不能机械套用8秒。默认起点、1/3、2/3、终点可能漏掉最大弯曲，必须先读动作再选点。需要另一视角时另建诊断配方/attempt，每次仍串行，正式镜头始终固定。

新入口复用当前armfix、关节修正、native/固定握持安装链，记录实际来源、浏览器、renderer、PNG哈希和采样诊断；不支持的组件/组合明确拒绝，禁止静默换旧人体或少装修正。针对新revision的专属手型/corrective若未在白名单中，需要新版本适配和测试，不得为运行而撤掉所需组件。

输出目录必须新建，失败保留 `failure.json`。存在渲染锁时先核对进程，不能删未知锁硬跑。不要把“输出目录已存在”当成功，也不要复用旧图片冒充新配方。

## 4. 每个动作检查什么、做到哪一步

按[经验手册的标准与案例](remaining219-template-handoff-20261029-r1.md#3-最新人体手型和修正组件)逐项处理，重点：

- 固定相机、能看清动作要领、人体与必要道具完整；无独立地影，保留人体明暗。保存全周期固定内容范围策略，关键帧不能证明完整循环不裁切。
- 手腕/脚腕方向、支撑关系和明显扭结，肘部突然变细，大臂/袖口凹陷及接缝；先对照已有正常动作复用成熟修正，不重做整个人体。
- 支撑掌、自然放松、辅助、握持分别选姿态；手掌/指尖与皮肤/器材表面是否悬空或穿透，不能只看骨点。旧动作正常且适配后关键帧正常就过，避免追求不必要的极小细节。
- 记录关键帧没覆盖的部分：连续旋转180/360度问题、循环跳变、中间穿模、全周期内容并集、连续求解可达性都留给本机完整采样。静态端点相同不能排除360度扭转。
- 高亮颜色/透明观感/微光仍为参数，用户最终材质选择未定。毛巾过头转肩只有肩部细节放宽，不扩大豁免到其他动作或腕部问题。

每项可到 `remote-keyframe-reviewed`，并明确 `sampledOnly:true`、`fullCycleValidated:false`、`userAccepted:false`、`releaseEligible:false`。关键帧runner的 `complete:true` 只表示所选几张成功产生，绝不是整段动作验证。原32的status/seal工具绑定本机路径和32ID，不用于219远端封存。

## 5. 分批返回与主线接力

每3–6项提交一份工作索引，记稳定ID、原源/新spec、recipe路径及LF哈希、改动理由、采样秒数、实际看图的PNG哈希、已知限制、CPU检查结果、待本机复核项。动作状态区分未做、处理中、关键帧待看、关键帧初查通过、待修、环境阻塞；不要一列pass盖住尚未执行的检查。

源码/spec/recipe/说明进Git；视频和帧PNG仍不进Git。关键帧整理为每批小型产物包，含 `capture.json`、来源清单、recipe快照、PNG和SHA清单，通过任务平台的可下载附件或已有授权产物渠道交回；若只有GitHub代码通道，就提交重放清单供本机重放，不制造他人不可访问的 `/tmp/...` 证据链接。不创建GitHub Release或擅自公开上传媒体。PR中明确图片是否实际可交付以及本机需要补哪些验证。

本机接手后在GPU环境按新配方补完整低清循环、实际30Hz旋转/接触/原QA复核、全周期固定内容范围及人工看样，再逐项交用户确认。确认后才保存正式可投产模板；最终高清、压缩和素材发布统一放在最后。

批内能复用的检查就复用，只重看受影响动作；浏览器失败先诊断，不大量重试。若继承当前账户额度限制且能查询，周剩余≤10%停止并保存；不同远端账户按其实际预算执行，不把原会话额度数字照搬。

## 验证记录与范围

本轮在Windows上从GitHub独立克隆验证源码包，未共享原仓库对象：缺历史catalog提交时仍校验308源，安全恢复50缺项，再检查缺项0；冲突拒绝已测。关键帧入口3项CPU测试通过，含32份配方的安装分支校验；熊式支撑256px、4帧在Intel UHD核显/Chrome 130.0.6723.31上成功，浏览器错误为空。Linux软件WebGL及固定握持浏览器执行尚未实测，不能据此称远端环境通过。远端先运行一个已知配方建立自己的环境回执，失败保留日志并继续不依赖浏览器的工作。
