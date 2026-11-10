# render-ab-r1：shoulder-axilla-r1 产品外观 A/B 一条命令出图

给本机渲染 Agent：**只执行下面的命令，不做任何判断、不改任何文件、不加参数。**

```powershell
cd <repo>
git checkout codex/joint-shoulder-axilla-r1
git pull
git status            # 必须没有被修改的已跟踪文件
node tools/joint-opt-r1/render-ab-r1.mjs --out F:\PoseHub-v3\trial\shoulder-axilla-ab-<日期>
```

- `--out` 必须是**不存在的新目录**；已存在就报错退出，不覆盖。
- 最后一行是一行 JSON 摘要：`{"ok":true,"images":N,"sheets":6,"failed":[],"pageErrors":0,...}`。
  `ok:false` 或退出码非 0：把整个控制台输出和 `<out>\ab-log.json` 原样交给用户，不要重试、不要改东西。

## 做了什么（全部写死在 render-ab-r1.plan.json）
- 条目：h-banana t=3.00 右、t=6.00 左；h-db-press t=2.00 右+左；h-fixed-bar-vertical-pull t=0.00 右+左；
  abs-A t=0.50 右；o-stand-crossreach t=3.83 右；scapular-B t=0.33 左。
- 每个 t：生产机位全身 1 组；每侧肩部特写 1 组（瞄准 shoulder-axilla-r1 该侧腋窝区域顶点的质心；
  试点沿用生产机位方向（同阶段 B 小图），对照用躯干前外侧朝腋窝的方向；近裁剪面去掉挡在前面的手臂/头）。
- 同一姿态先 OFF 后 ON，各一张 720 宽 PNG（`png/`）。外观 = 产品管线：先做与 `preview-current-model.mjs`
  相同的已确认外观校验、与 `preview-current-skins.mjs` 相同的当前皮肤指针校验，校验不过直接报错退出；
  渲染走皮肤指针的 install（包含已确认外观 previewEntry 的全部层：pkg 层、pump 高光、body polish、head smooth、
  eye-socket soften，以及 skin coverage），realistic 皮肤，body-highlight 层，深色主题底 #101013。
  特写额外出一张高光关闭（body 层，文件名带 `_hl-off`），便于看清被肌肉高光盖住的褶皱。
- 每个动作一张 OFF|ON 并排 JPG（`sheets/`），每行标注动作、t、侧、机位、抬臂角、渐入系数。
- `ab-log.json`：每张图的抬臂角、渐入系数、写入顶点数、页面报错数、两个指针 id 与 sha、HEAD、特写相机参数。

## 本机前置条件（生产机已具备的就不用动）
1. Node ≥ 18；仓库根目录做过 `npm install`（提供 vite）。
2. Playwright 1.48.2 + Chromium 1140：生产时已按 `drill-anim/config.example.json` 的说明装在本机仓库
   `node_modules/playwright`（`--no-save`，切分支不会丢）。若缺：`npm i --no-save playwright@1.48.2` 然后
   `npx playwright install chromium`。
3. `drill-anim/config.json`：沿用生产用的那份（GPU 的 `chromium_args` 不要改）。
4. 开发服务器：脚本先探测 `config.json` 的 `app_url`（默认 http://127.0.0.1:8830）；已在运行就直接用，
   没在运行就自己用仓库里的 vite 启动、结束时按 PID 关掉（日志 `<out>\vite.log`）。端口被别的程序占用会报错。
5. 不需要 Python、ffmpeg。不要与 produce.py / render-masters 同时运行（共用渲染锁 `work_dir\package-v3-render.lock`）。

## 仅供沙箱测试的隐藏参数（本机不要用）
`--width <px>`（低分辨率）和 `--only <动作,动作>`（只跑部分动作）；用了会在 ab-log.json 里标 `testMode:true`。
