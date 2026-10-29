# 弱云服务器串行关键帧检查 r1

本入口用于克隆仓库后的动作模板初查。显式读取 remaining32-r4 配方，使用 training-human-v3-armfix/0.1.0-r2，支持当前25项native与7项固定握持的完整安装链。不会回退到旧默认v2plus，不要求RTX4080，不伪造本机runtime。未知动作corrective/旧关节修正/不完整固定组合立即拒绝。

需要 Node ^20.19 或 >=22.12、根目录 npm ci、Playwright及其Chromium系统依赖。仅本工具不需要Python/Pillow/ffmpeg。Playwright未列在根依赖中，可按已提交配置示例安装 playwright@1.48.2；安装器命令为 npm install --no-save --package-lock=false playwright@1.48.2，再 npx playwright install --with-deps chromium。浏览器实际版本与renderer会写入报告，软件渲染允许但不代表与生产GPU等价。

在远端新建gitignored drill-anim/config.json（不要复制Windows机器配置）：

```json
{
  "app_url": "http://127.0.0.1:8830",
  "work_dir": "/tmp/posehub-remote-work",
  "playwright_module": "../node_modules/playwright/index.mjs",
  "chromium_args": ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
}
```

浏览器若不支持这些软件后端参数，应根据实际环境调整并记录；不要伪造GPU信息。使用非root用户。app_url/work_dir/playwright_module/chromium_args均可通过同名大写环境变量覆盖，但键必须存在config中。可选chromium_channel/playwright_browsers_path亦需显式键。若用自备Linux共享库，自己设置LD_LIBRARY_PATH；JS启动器不会替你导出它。

仓库根启动Vite（另一个终端保持运行）：

```bash
npm run dev -- --port 8830 --strictPort
node tools/action-completion-v3-r2/remote-keyframes-r1.mjs --recipe catalog/production/remaining32-r4/groups/home/h-bear-plank.json --out /data/posehub/bear-keyframes-01 --size 256 --count 4
```

只允许256/320px与3–6张，默认4张（起点、1/3、2/3、终点）。也可用 --times 0,1,3,8 明确3–6个递增秒数，必须在当前动作duration范围。没有批处理/视频编码；每次一动作、串行，再决定下一步。输出目录必须不存在。已有目录或任何render锁会停止；不要删除未知锁。失败保留failure.json并释放本进程自己的锁。可用物理内存启动至少1.25GiB、每张之前至少0.5GiB；不足或浏览器错误即停止。

冻结共享模型、spec、已捕获配方均不改。静态大臂r3、脚踝r5、选中的肘DQS和native动作专属指姿按R8安装顺序应用；固定握持依旧走完整组合器，保留拓扑/异常恢复检查。输出recipe与effective-spec快照、完整来源指纹、runner哈希、真实浏览器/GPU信息、关键帧PNG和采样诊断。源在运行末尾重新校验。

限制：sampledOnly=true、userAccepted=false、releaseEligible=false；不检查全部30Hz姿态、不证明循环/关节旋转连续性或皮肤接触、不计算最终全周期内容矩形。现有setupCamera为固定取景仍有少量CPU时间线采样；稀疏求解的warm start也可能与连续制作结果不同。不能将此capture替代R8完整预览、视觉验收或版本封存。下一位agent应在这些关键帧发现明显问题后修新spec，再移交有资源的机器完整复核。

CPU检查：node --test tools/action-completion-v3-r2/remote-keyframes-r1.test.mjs。

## 本次验证范围

2026-10-29：3项CPU测试通过，实际prepareRecipe覆盖32份当前配方（25 native、7固定）；这不是32项浏览器验收。Windows单动作h-bear-plank实际256px、4张成功，Chrome 130.0.6723.31，实际renderer为Intel UHD Graphics/ANGLE Direct3D11（非RTX4080），pageErrors为空。已实际查看keyframe-01.png，正常显示当前人体与熊式支撑。证据目录为本机F:/PoseHub-v2-production/template-finalization-20261029/remote-keyframes-smoke-r1-attempt02；目录不随Git分发。首次因Vite未启动失败，原failure保留。Linux/software与固定握持的浏览器执行尚未实测，下一agent不能将本次Windows冒烟写成Linux验收。
