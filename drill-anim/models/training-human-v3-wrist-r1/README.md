# Body v3 手腕渐变候选 r1

此独立候选使用原有 `training-human-v3` 加载人体和 c1r2 手，再注入 `wrist-gradient-r2.js`。长袖时沿手腕局部坐标把袖口色和阴影平滑过渡到肤色；短袖保持原路径。原 v3 loader、原手部数据和冻结文件未覆盖。候选尚未经人工内容审核，不可用于发布。

调用：从本目录的 `loader.mjs` 引入 `boot` / `applyV3`；`applyV3` 与原 v3 入口参数一致，目前只支持 `hands-native-c1r2`。`manifest.json` 登记了源码的 LF 规范化 SHA-256，`verify()` 在加载前检查。此入口是单项候选，尚未包含脚踝或头颈等其他修复。

本机浏览器核查：左右手长袖修复前后图、左手背侧/掌侧/两侧及握拳特写均已查看。左右手短袖在补丁前后的 PNG SHA-256 完全一致；独立入口与手动注入候选的四张左右手长短袖 PNG 完全一致，页面错误为空。截图覆盖有限，不代表全部动作验收。对照图见 [手腕长袖前后对照](../../../docs/body-v3/img/wrist-r2-comparison.jpg)。

可复现复测：启动仓库的 Vite 服务并配置本机 `drill-anim/config.json` 后，运行 `node tools/body-v3/wrist-review-r1.mjs <新的输出目录>`；脚本拍摄左右手长袖、短袖并记录页面错误，不覆盖已有目录。
