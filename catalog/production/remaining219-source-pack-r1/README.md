# 剩余219动作的固定源码恢复包 r1

用于通过GitHub干净克隆接手，避免依赖只在原制作机存在的历史Git对象。不是素材发布ZIP，不含视频、帧图、机器配置或凭据。

`sources.zip` 固定308个相对模块闭包文件和1份历史参考catalog，共309条；`manifest.json`记录路径、原始字节SHA、LF SHA、Git blob及原提交。档案SHA256：`6bd440751de3c817541dd5f1ce1cdea80135c6ddb1943ea6ed0c4e4d069be82c`，802205字节。队列与原来源逐项一致；7项引用的 `d550cd…` 在此次GitHub干净克隆中不可读，包内已保留实际核验的源字节。

从仓库根先只读检查，再在贡献分支恢复缺失源码：

```bash
python3 tools/action-completion-v3-r2/remote-source-preflight-r1.py
python3 tools/action-completion-v3-r2/remote-source-preflight-r1.py --restore-missing
```

使用Python标准库，不需要GPU、浏览器、npm或历史Git提交。先校验整个包、固定队列和全部已有文件，再只独占创建缺失路径；已有LF内容相同的文件不写，任何冲突先停止。路径限制在仓库内，不直接调用ZIP批量extract。历史catalog仅作证据，不恢复成现役catalog。中断后可重跑；已创建且相同的文件保留。新适配仍另存revision并登记哈希，恢复原源本身不代表新版模板完成。

2026-10-29实际验证：独立GitHub完整克隆，无本机Git alternates；旧catalog提交缺失时仍能校验308文件，报告50缺项，恢复50后再次检查缺项0；修改一个已有源后拒绝恢复。此包及其manifest冻结，未来新增来源另建r2。

接手入口见 [弱云服务器任务说明](../../../docs/remaining219-remote-agent-20261029-r1.md)。
