# PR #5 / #6 主线审核与高清母版入库

14 个新增动作已在本机 RTX 4080 Laptop GPU 完成高清绿幕和 exact-alpha 制作，原动作全循环 QA、合成与完整 CPU 解码均通过；主线按开哥明确授权先合入 #5，再合入 #6。机器库存登记见 [inventory JSON](../media/inventory/pr5-pr6-hd-2026-10-18.json)。

## 审核对象与合入顺序

| 项目 | 固定源 head | 实际目标 head | 原 PR baseRefOid | 合入提交 |
| --- | --- | --- | --- | --- |
| [PR #5](https://github.com/mhgd3250905/3D-Pose-Hub/pull/5)，小器械 10 项 | `be80d068985f41ae44121a2d5f0c21e370f6fcca` | `cb38fd5e4125c4dd094670d979273a23918a0717` | `1783dcc232876de88b0de09085027986a1c1d865` | `5c740a6dda09d64edca69da654173dba196a5a81` |
| [PR #6](https://github.com/mhgd3250905/3D-Pose-Hub/pull/6)，徒手后链/腿 4 项 | `3160523050a3e1601036c6085ee4ce4fb258ef90` | #5 合入后的 `5c740a6dda09d64edca69da654173dba196a5a81` | 最初为 #5 head `be80d068985f41ae44121a2d5f0c21e370f6fcca`，随后改为 main | `442832274daece8b614523fdf661bff6a838f3e3` |

使用隔离工作副本先验证 #5，再叠加 #6。合入前分别再次核对源 head 和实际目标 head，均无变化；#5 推送后才把 #6 的目标从贡献分支改为 main。两项现在均由 GitHub 确认为已合并。PR 当时没有 GitHub CI 检查记录；本记录是源码审核与本机验证结论，没有冒称提交过 GitHub approval。

已读 14 项规格、哈希登记、catalog 改动和贡献方 QA/关键帧证据。14 个 LF 规范化 SHA 均与登记一致，全部为 8 秒、`training-human-v2`、`alignClavicles:false`；原生标记 15fps，但函数轨道已按 30fps 采样，兼容 HD 包装。未发现确定的合并阻塞问题，未覆盖规格或新增动作修订。

## 本机制作与实看范围

主题 `themes/glow-soft.json`，PR2，每路 `jobs=1`，最多两路。先生成并实际查看每项预览，再确认出全片。每项为真实 2160×2160 原始 RGBA → 1080×1080 straight-alpha 母帧及 H.264 yuv444p CRF12 绿幕编辑母版，30fps、240 帧、8 秒。

总计 **14 个绿幕 MP4、14 张绿幕封面、3360 张透明母帧**；14 份全循环 QA 均 `pass:true`、求解告警 0、人物裁边 0，视频完整 CPU 解码通过。所有声明的结果输入输出 SHA、字节数，以及每一张透明帧的连续编号、RGBA/1080² 格式均已核验。原始循环帧 3360 张，另有 14 张原始封面帧。

实际查看了 14 项本机预览、完整片的分时抽帧，以及闪烁候选邻帧。逐项帧号保存在库存登记的 `visualReview` 与本机 `visual-review.json`；没有把数值检查或抽样看图称为人工逐帧看完全部视频。重点包括壶铃下摆、Pallof 双手握柄、划船弹力带、椅子上步两侧领步及落脚、超人式指尖构图、臀桥交替踏步与手肘姿态。

复用已冻结的青色时域候选扫描器，对 14 个编码 MP4 再遍历 240 帧并完整解码，输入与报告 SHA 前后绑定一致。`automaticFlickerVerdict` 保持 `null`：候选不是坏帧。椅子上步最高候选为 f113 的 1345 像素，已查看全部八组高分邻帧及循环边界，变化对应下步时大腿运动边缘，抽样未见阻塞性的跳亮或碎块。其余项目查看高分邻帧和首尾，保留原数值，不改阈值。

本地没有可运行的橙色道具 `propscan`，没有冒认重测了贡献方“弹力带 8 坏帧”。本次另看划船 30 张交叉邻帧与编码候选图，所看样本中带子连续，未见明显异常跳变。

## 库存与中断保留

本机统一入口：

```text
E:/AII-3D/pose-hub-media/inventory/pr5-pr6-hd-20261018-4428322/index.html
```

主批次保留 9 项已完成成品；`recovery1/` 保存 Pallof、早安式、超人式、臀桥踏步、椅子上步 5 项，各自使用独立来源清单、GPU 证据和结果 SHA。索引按实际来源链接，未拼接或篡改两批结果。绿幕视频合计 22,203,495 字节，透明帧合计 542,425,748 字节。

首轮后台执行会话消失后，核实 manager/worker PID 均不存活、端口无监听；确切退出原因未确定，未查到对应应用错误或显示驱动 4101 记录。保留 219 张 Pallof 部分原始帧和原始 ledger 的 SHA 快照，当前 ledger 标为 `interrupted_preserved`；完整成品没有重渲。附加扫描首次内存分配失败的日志也保留，GPU 全部结束后串行补扫成功，没有修改扫描器或分数。

`inventory-receipt.json` 绑定来源、规格、全量图片/视频哈希及实看记录。媒体与逐帧证据留在 E 盘，Git 只保存本登记和审核说明；不改既有库存和已发布 `media/manifest.json` / release 记录。本次是本地母版入库，不是 v0.3.0 公开 ZIP 发布。

## 主线验证与协作规则

合入 #6 后，在本机 main `4428322` 重新运行：verify 通过（183 specs、13 个冻结模型源保持）、portability **7/7**、media tests **28/28**、HD 工具 tests **83/83**、catalog `--check` 通过。后续入库登记提交只修改文档与库存 JSON。

`AGENTS.md` 原标题“一个动作一个分支一个 PR”未区分角色；按开哥此前更正，现已明确主线自己的改动在分支验证、经同意后直接合入 main，贡献方仍提 PR。规格哈希、修订不覆盖、模型冻结与用户授权要求保持。

## 库存及备份指纹

以下登记由已核验的本机回执生成。

| Evidence | SHA-256 |
| --- | --- |
| `catalog.json` | `42cb9d67fb4ebd1c23837fe75c1a38cf0e89fd5c7d9857a109c13acbef328ad7` |
| `index.html` | `7431ff16d8cfb24b08e7a940d52bd7d8bce8d0388080a92ef54eb0bf283e4b07` |
| `inventory-receipt.json` | `3a97e6d9db003e3c56ce4fd556b3d04c70493a923298c26a39334bbea06e607c` |
| `visual-review.json` | `d709be61894b2352d8722de08305f082d92d6ec485f390b18dbccdd82ef42f59` |
| `flickscan/final-summary.json` | `c4091945c134550620d25ab2cb799093e5390a0b57e42110fda56dd88a1b0614` |
| `flickscan/manual-review.json` | `c31742702dee44f88d82c12d4a177763e7ad18c25416f7f7b4f2383cd204ed78` |
| `main-validation.json` | `a5bbeadfad421340f0ba57d1d8bea667bf5e4be2151cc5f54aa6b1f7fd2685e4` |

Backup: `E:/AII-3D/pose-hub-media/backups/pr5-pr6-hd-20261018-4428322`; **3765 files / 615444512 bytes**, all source/copy sizes and SHA-256 verified. Same-drive copy (`offsite:false`).

Backup receipt SHA-256: `5bf163047547c29f5237ad859d0961501febb43190c1a664811dd43ccfa37565`.

| id | name | green bytes | green SHA-256 | alpha frames |
| --- | --- | ---: | --- | ---: |
| `h-db-rdl` | 哑铃罗马尼亚硬拉 | 1150601 | `c96eb5136eea43ed803949bb59e52fd3732f65d117c50b11b0d9bb3e8184ff3c` | 240 |
| `h-db-row` | 扶椅单臂哑铃划船 | 2626553 | `475050f4c9527e952ae28002b692d25bb0f479aaea188e0d186e535d3a1fe2e3` | 240 |
| `h-db-press` | 站姿哑铃推举 | 1010622 | `b4fda974d08898a313021fc4ab85a516cb46ceb032e21a491cc3229b653112d6` | 240 |
| `h-db-lateral` | 哑铃侧平举 | 1475517 | `5df05896f07a044173d721f1ff3a37101c11e982aab47768e1ea133d4867e03e` | 240 |
| `h-db-curl` | 哑铃交替弯举 | 988942 | `51faf8f7eae66cbe217084d181cb843c4dc6c34808d1fab1e92490f2de792793` | 240 |
| `h-db-floor-press` | 哑铃地板卧推 | 2314072 | `bc2eef596d5cc2e36dfb4cc9e792638f437ac695fe7e8de63085d593203f51f1` | 240 |
| `h-kb-swing` | 单臂壶铃摆荡 | 2009098 | `19c87e5ff26cd51510a4c06ba409c93e552b8c48d4040c5008e4dd72fac1fa63` | 240 |
| `h-band-row` | 弹力带坐姿划船 | 1961677 | `501e3d45ab03eeb7a72d02c376a2e881d46fd55bea4c0108821b19e38d84615a` | 240 |
| `h-band-pallof` | 弹力带抗旋转推 | 1190861 | `c39bc0be6e23224986bc5ebc1d6fcb05154770b2b794907f0fd83d3c4ab95516` | 240 |
| `h-db-reverse-fly` | 哑铃俯身飞鸟 | 1883388 | `57dbdfd3b4265127199b98635b00e0eb3c400263a8aa4dbd2e447a2b50ac0f0d` | 240 |
| `h-good-morning` | 徒手早安式 | 1171568 | `224a2b165c96a8e25af5b78591609f58e1b26cc07ba4807a2683283fcf161dcf` | 240 |
| `h-superman` | 俯卧超人式 | 1316350 | `1d0dbfded3ec682d8e56e3548cd0b02f127e443377a083889769261e978d1705` | 240 |
| `h-bridge-march` | 臀桥交替踏步 | 1977455 | `69395d479c560d1b6b9c5e589965320f81d6d91f4a58872c84b5b09adabcf048` | 240 |
| `h-chair-step-up` | 椅子上步 | 1126791 | `ea52bef6c5965f24d1b1ac499c5d612b73cd7f4add0ab76c0c73c5c27026359e` | 240 |
