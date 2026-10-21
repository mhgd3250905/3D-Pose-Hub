# 五皮肤颈部漏色修复

用户在首轮六动作试片中指出颈部残留灰色原肤色。首轮技术检查与缩略图看样没有发现这处材质错误；首轮样片保留作历史对照，不能作为本次修复验收结果。

## 根因与修正

原模型具有颈部皮肤着色与轮廓规则；缺陷来自分层适配器 `drill-anim/tools/v2/browser-layers.js`。native collar 恢复材质 hook 时，颈材质可能暂时失去 regions 着色补丁，原生 regions 模块用 `onBeforeCompile !== __v2prHook` 检测并重新修补。

旧适配器只要发现 `__v2prHook` 存在，就把它无条件改为自己的新 hook，误把缺失 regions 的颈材质标成已处理，导致白金、蓝、绿和全息保留灰色颈块。

现仅在本次确实包在有效 regions hook 外时同步身份：

```js
if (m.__v2prHook === prev) m.__v2prHook = hook;
```

如果 native collar 恢复了 stale hook，保留原 marker 的不匹配状态，由原生模块重新修补；正常 hook 包装继续保持幂等。没有改网格、骨骼、动作规格、固定模型文件或原配色；模型版本继续为 `training-human-v2plus / 1.0.0-rc2`，这次属于渲染适配器修订。

## 已验证

- 新增 stale collar 回归先复现失败，应用修正后全部 5 项 renderer 测试通过。
- 正式启动流程的椅子动作五皮肤预览已实际看过，0/66/239/240 帧记录；白金、蓝、绿、全息颈部接上本皮肤，原配色保持。
- 现场材质审计检查 frame0/66 共 10 组 Mesh001 shader：regions uniforms 与 paint 路径存在，marker 匹配；原配色 Ron/Sk=0/0，其他四套 1/1；shaderErrors=0。
- 五皮肤几何 SHA 仍为 `aa0aa8dcfa8645375ac39890a58b8773e0e14ecc886fac6f2fda6e459d222152`，新冻结 renderer 配方 SHA 为 `ab8605f91409f601c5c8b8bf96c02051f0da6f260bcffdbe0e81014266e0fda9`。

修复对照在 `F:/PoseHub-v2-pilot/neck-fix-r2/previews/chair-neck-before-after.png`，现场审计在该修订的 `qa/neck-live-materials.json`。只看先 native pose 再注入适配器的截图会提前修复 hook，不能复现本缺陷；采用正式分层启动顺序和首轮真实母版作为基线。

## 修订与存储

修正版单独放在 `F:/PoseHub-v2-pilot/neck-fix-r2/`，结构沿用 masters/derivatives/voice/qa/manifests/previews。首轮母版、成片与来源记录不覆盖。112 条语音字节完全复用且逐条核 SHA，不重新合成声音；修正不改变动作名、主要点、运动时间线或高亮定义。

六动作五皮肤已全部重制：10,080 张生产 RGBA 母帧、42 张独立接缝检查帧、60 份 H.264 视频、60 封面、60 缩略图、180 关键帧、30 透明封面及 60 高亮关对照图。112 条语音逐 SHA/字节复用，记录 `qa/voice-byte-reuse.json`。

完整性检查核对 10,194 个唯一引用文件，issues=[]；图层像素 numericIssues=0；连续序列空帧、越界与面积异常均 0；六动作姿态 warnings=0，冻结源 changedFiles=[]。实际目检六动作五皮肤颈近景、325 个时序采样单元及 120 格深浅/高亮开关拼图；看图哈希与最终重生成的时序图一致。检查范围不代表人工逐帧或穷尽碰撞检测。原有暗部/白金对比、臀肌遮挡与蛙式取景特征继续披露，已随本轮样片获接受。

六包已升级为 `2.0.0-draft.2`，重新接合 r2 媒体、来源和 QA SHA，并从 catalog 重建 AI 详情与完整度。源、母版、派生技术层各 6/6 通过，严格发布门禁仍为 0/6；编辑、语音内容与人工试听、发布前综合审核继续待审。开哥已确认本轮样片并授权合入，见[试制确认](pilot-approval-20261021.md)。

新审片页为 `F:/PoseHub-v2-pilot/neck-fix-r2/index.html`，制作机入口 `http://127.0.0.1:8876/neck-fix-r2/`。浏览器已验证五皮肤×深浅色的 60 个 720²/8 秒视频和 120 张对照图加载，无错误。内容已按开哥同意合入 main；未发布新素材版本，未全库铺开。
