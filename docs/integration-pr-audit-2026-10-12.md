# 网站、动作库及 iOS 整合审核（2026-10-12）

按用户提供的整合顺序，将 PR #94 官网、#95 网页使用站、#96 办公椅、#97–#104 办公室拉伸、ios/main（#107）及 #105 久坐强化依次合入 master，随后合入 #108 五项历史修订归档。来源 PR 原先以 feature/drill-anim 为目标者先改为 master；补修均普通推送来源分支，按最终固定 head 合并。没有 force push、reset、clean 或删除历史分支。原21个用户未跟踪条目保留。

当前手机交付身份仍是 L43 / 1.0.0+1 / v41，本轮是源码与制作成果整合；没有重新安装手机、重新发布网站或上传 Apple 包。App 14语、51项正式视频、当前图标、原网页编辑器与个人数据保留。独立网页站目前是中文深色/静态训练卡实现，其功能差异见 webapp/README.md。

## 固定审核与合并收据

各行的 target 是执行前从 GitHub master ref 取得的实时目标；PR 的 reported baseRefOid 另保存在 output/drill-anim-integration-20261012/pr-N-final.json，不当作实时目标证明。GitHub没有为这些PR提供CI或既有review；本次AI审核不冒称已提交GitHub正式review。

| PR | 最终审核来源 head | 执行前实时 master | 合并保存点 |
|---|---|---|---|
| [#94](https://github.com/mhgd3250905/3D-Body/pull/94) | `a6623597e0c900ebe10d8f1636e53379e514889d` | `1f87cc6180532857c1b53dba4c9898915a9aa49a` | `c522438e1507524047595cf2c5ef422fc12e9c50` |
| [#95](https://github.com/mhgd3250905/3D-Body/pull/95) | `c768e82b8dbcd77b89ef93e42c2e149635e1bceb` | `c522438e1507524047595cf2c5ef422fc12e9c50` | `e3385c69a7c44b53eb3f2748ad95da045f058499` |
| [#96](https://github.com/mhgd3250905/3D-Body/pull/96) | `80c796203f88c02c63e53dfbaca9379c5a935a3b` | `e3385c69a7c44b53eb3f2748ad95da045f058499` | `80298ceccf58c958e557e1b45c44ddaf1ae2c6b6` |
| [#97](https://github.com/mhgd3250905/3D-Body/pull/97) | `a9402ecdb02af39f862569b22678e8898f8fc680` | `3f90ad1302614e9c22aaa770467d58754941c6a2` | `b047213b4c18f250dabb191cca9336ff7a895888` |
| [#98](https://github.com/mhgd3250905/3D-Body/pull/98) | `ad3088e7ebf12549419059b8eefdb25a5151f3db` | `b047213b4c18f250dabb191cca9336ff7a895888` | `d9253dda90e6c2bc1a77e6945f6c596c2479beb5` |
| [#99](https://github.com/mhgd3250905/3D-Body/pull/99) | `2b65436356a6a8d92ddbcada1a30c5763d32bddc` | `d9253dda90e6c2bc1a77e6945f6c596c2479beb5` | `bcec0ff2158788ae25aba36338df2ed5db6fa653` |
| [#100](https://github.com/mhgd3250905/3D-Body/pull/100) | `bff173f302dc9570c6d0af844ba44576e566a8ec` | `bcec0ff2158788ae25aba36338df2ed5db6fa653` | `1a78662e7465a8f4b387be5c4959447af7da05c9` |
| [#101](https://github.com/mhgd3250905/3D-Body/pull/101) | `de5b6cbf7d5b8dcbf2f1c4fc7fbd277ae6812298` | `1a78662e7465a8f4b387be5c4959447af7da05c9` | `02b8b9a60d5870cc8d2c8d9cd164629194fc3b02` |
| [#102](https://github.com/mhgd3250905/3D-Body/pull/102) | `fbb03801c07002d5c4d7dae7d2b2f4146b61f8b5` | `02b8b9a60d5870cc8d2c8d9cd164629194fc3b02` | `ed413cc2ccec891448b1f6e8d60595d10ea4f2ce` |
| [#103](https://github.com/mhgd3250905/3D-Body/pull/103) | `aa6245e6b0d3e6a5b64e1d06819bcd71ae172cf5` | `ed413cc2ccec891448b1f6e8d60595d10ea4f2ce` | `0a009002203da5c96fb5296376b35b518a925a81` |
| [#104](https://github.com/mhgd3250905/3D-Body/pull/104) | `f5448eba323ce8c4194b3155515d053551351bc9` | `0a009002203da5c96fb5296376b35b518a925a81` | `6b704f34fd3bc51784ea52d4e1669f3742bfbe71` |
| [#105](https://github.com/mhgd3250905/3D-Body/pull/105) | `8fb8a6bff8d27b0f77c221d8f9f36af028e56b1f` | `6c85fd249dfa983bb44e79431ed47227ea13961c` | `b6b56efdb40938cef4bdff7d8d16291b8e40a495` |
| [#107](https://github.com/mhgd3250905/3D-Body/pull/107) | `8196ce6d3179053827fad56b91469b3088fce242` | `6b704f34fd3bc51784ea52d4e1669f3742bfbe71` | `685f3ec41e16f6869124de35fbaa2b5c0eeddbec` |
| [#108](https://github.com/mhgd3250905/3D-Body/pull/108) | `f0d53e9260c9b374cf86861c8309a115acb670df` | `b6b56efdb40938cef4bdff7d8d16291b8e40a495` | `0f0698cd9498b02f0d9d160a3266de05b6b23dbe` |

## 实际补修与验证

两个网站修复 Windows 的 Node/Python/UTF8、资源URL和字体构建依赖；当前字体子集与许可入库。官网3D/降级模式实测，网页站桌面及手机主要流程实测，无页面错误或水平溢出。18类损坏备份导入均拒绝并保留原记录，有效App备份导入通过。两站在整合后的当前主目录均真实构建成功。

办公室8项修复手部穿模、超reach、交叉脚碰胫骨、关节局部方向等；256个周期采样及关键复合帧核对通过，未调低QA容差或修改引擎/人物。源完整性验证仍强制保留原59参数，新增候选只允许已审核canonical SHA-256。详见 [办公室审核](office-drill-pr-audit-2026-10-12.md)。这些是制作候选，没有切换App的视频。

iOS解决25项冲突，以L43界面和资产为底座；补修后台/手动暂停/首次后台挂载的恢复、详情模型和同帧恢复、SDK自检、短屏大字号，保留原脚本配置保护。Dart分析、50项针对性测试及14语校验完成；844×390/2倍字号横屏详情仍有40px溢出（原L43为44px），失败断言保留。Mac/Xcode编译、签名、iPhone和Apple重新验包待验。详见 [iOS审核](../app/docs/ios-main-integration-audit-2026-10-12.md)。PR #8 的 ad72f1c 已完整被ios来源覆盖，GitHub在 #107 合入时自动将 #8 标为MERGED。

久坐强化8项只新增制作源/椅子道具。鸟狗及游泳的小幅伸展修复，各240帧几何与手部QA通过；其余6项为关键姿态初筛。两项修复源另已真实重渲为1080²、30fps、240帧/8秒MP4及540²、15fps、120帧/8秒GIF；完整边界、解码及QA通过。详见 [PR105审核](../tools/drill-anim/pr105-audit-2026-10-12.md)。

每一次主线合并后执行用户指定的根目录 npm ci、npm run build、node tools/drill-anim/verify.mjs，均通过；构建仅有原有大chunk提示。日志及逐项摘要保存在 output/drill-anim-integration-20261012/pr-N-* 和 merge-checks.txt。#105合后制作源75项：原59、办公室8、久坐8；App ID仍51。

## 云盘与历史修订

鸟狗/游泳新成片归档：[云盘目录](https://drive.google.com/drive/folders/1fVkqMCuHn5AyurG1UrmOBbo-Vupf9L21)。ZIP为5,316,267字节，SHA-256 `2b221b47ac1d8ee7bd9eb7757047c70c3d963efd3853b1d0ac3e2fd1b585752c`；上传后已完整下载回读核验一致，源码快照8fb8a6b、met/edge、封面/总览、probe及校验清单随包，cloud-receipt.json同目录。旧8项成片仍在来源机器，已请求上传供原版归档，不把本次两项包描述为8项完整旧版备份。

此前60项正式视频与三项脚部/镜头修订已在 [v1.0.0](https://drive.google.com/drive/folders/1nRi_L9WrysQzOt-zT9rZTlTO3Xx6uI4w) 和 [训练工具整合备份](https://drive.google.com/drive/folders/16ErhrmGbJMner-h0g9Tv7XNWJYoC1tXR) 保存并核验。hip-abductors-B、s-frog、rotator-cuff-B的本机候选/成片/QA与冻结v1一致；hip原240帧solver警告如实保留，不把pass布尔等同没有警告。

PR #108 又将这三项及 deltoids-B、s-9090-switch 共五项的参数、主题、MP4/GIF、封面与原始QA纳入独立交付目录；[入口](../tools/drill-anim/revisions/hark-4080-v1/README.md)。来源 f0d53e9260c9b374cf86861c8309a115acb670df 的64文件哈希、5项源/QA/媒体与冻结v1逐字节和语义核对，5MP4/5GIF完整解码通过。确认了原待查三项的实际修订来源，旧source-8a75备份仍是原分支参数，最终五项归档从v1来源保留。hip240帧警告及deltoids约10.31mm肘部间隙等历史限制随包保留；原QA不代表当前主线的新全量渲染。此次归档不提升为默认参数或App新选版。

## 待用户确认与保留项

PR #106 固定3d20434213f4a42d93cfec17e285af382334e36d，仍Draft，12项t-*没有合入默认源或注册App。已按原姿态生成真实低清循环（432²/5fps），11项8秒、画圈9秒，原静帧与审核记录保留在 output/playwright/thomas-pr106-preview-20261012。俄挺/V撑预览只扩大取景留边，源姿态不改。已发现宽L手穿模、团身/V撑穿地、reach与共享QA条件问题；需用户确认动作方向后补修，之后才全量渲染。对方原Drive目录此前返回404；用户随后提供的[新预览目录](https://drive.google.com/drive/folders/11HIEesP7B7sQ-67ED1OlQRdVhOJJLiuQ)已通过当前连接读取清单，包含总览JPG及全部12项对应名称的GIF，无缺项。本次只核对文件清单，没有下载或完成这些云盘媒体的画面审核；本机生成的循环不冒充对方原GIF或最终验收。

design/backup历史分支保留，其中多个仍有独有提交；polish/device-feedback已包含主线。未获得具体删除确认，不清理这些分支或历史资源。
