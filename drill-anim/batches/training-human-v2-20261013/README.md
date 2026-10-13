# training-human-v2 整批重渲固定来源（2026-10-13）

用户已授权本会话用已验收人体重渲全部已制作演示，并保存新素材。固定94变体、781.8秒、30fps共23,454帧；组成60正式＋8办公室＋8久坐＋12托马斯＋5早期示范＋1Flare，App原51项是此批子集。94项成片现已全部另存于 `output/training-human-v2-library-final-20261013`，producer83ready/11review、最终独立audit-final为56ready/38review、failed/pending均0；所选188视频完整解码。此目录只保存冻结参数来源，完整结果见[统一素材库](../../../../docs/training-media-library-2026-10-13.md)，不表示全部动作QA或App安装更新通过。

`job-catalog.json`保存完整批次。原88项映射对象保持；历史五项使用本目录`specs/*.json`，需要显式加载`page/history-demo-adapter.js`并调用`__installHistoricalDemo`。它们调用原createTrainingClip采样与applyOptions，不替换为类似drill。原1半分腿保持停止；第94项纳入正式v41烘焙循环，前93项对象不变。

五项本地最终修订必须使用revisions/hark-4080-v1各自最终spec.js和theme.json。其他55项是冻结成熟集成参数，交接没有证明其为下载原片的精确生成输入；新/旧人体比较必须使用同一动作快照，不宣称原片逐像素复刻。

`source-sha256.json`固定全部参数、主题、Thomas helper、人体版本及历史原采样器/适配来源。sha256RawBytes表示保存时原字节；sha256CanonicalLf仅将文本CRLF归一LF，用于跨Git检出核对，二者不可混写。路径移机时按repositoryRelativePath定位；catalog绝对路径是本机收据。

`historical-source-manifest.json`记录五份JSON快照与原输出字节一致，并验证历史manifest各源SHA是原字节哈希（特别是coach-rig.json）。其中scapPush144帧适配等价核对不扩大为所有5项或全部新成片QA。历史原警告、高亮语义映射和网页UI取景边界随job保存。

正式Flare第94项由`specs/flare-v41-loop.json`和`page/flare-v41-demo-adapter.js`接入：先加载适配器，再调用`__installFlareV41Demo(spec)`，之后沿用E.setupCamera/E.frame。真实原AnimationMixer的22根骨、44轨世界矩阵直接传到成熟人体，含两根非普通local空间的spine helper；不使用descriptor IK、近似姿态或重新烘焙。GLB及原阶段表读取时各自校验SHA，阶段字符串放metrics，params仅保存数值。

原paced周期8.991662288489888秒，GLB float32 duration8.99166202545166秒；30fps编码270帧/9秒，最后采样269/30，时长仅多8.3377115毫秒，动作时间不拉伸。镜头采用`flare-loading-camera-source.json`中实测整个v41周期的正交镜头，方位−30°、仰角28°、span2.705691222578835；仅沿用镜头，不沿用剪影材质或0.25周期起点。frame采用canvas，完整保留80%占比。网站原完整人物WebP作为旧输出留证，其导出镜头源未找到，不宣称相同构图。

`flare-v41-source-manifest.json`记录来源和270帧实际浏览器核对：与独立原GLB及新旧人体22根骨世界矩阵、关节点、每帧37,589个手脚表面顶点差值均0；重采样及原周期首尾差值0。143,650个可见网格顶点的全周期投影（1080）横向108.018–971.985、纵向198.661–881.328，全身完整。两帧合成及单帧qa读取兼容性已验证，不能冒称整个成片物理QA；原v41记录脚最低约−8.66mm，通用drill髋角阈值也不是原动作作者阈值，应记录原限制而不改变动作。采用无静态肌群选择的全动作示范，原阶段/支撑表用于接触记录，不冒充App交互高亮。

最终94项旧/新关节记录的独立整循环比对通过，骨矩阵逐帧最大差0是producer制作记录；身体QA为1项新提示、9项继承提示、84项无身体标记，原QA与警告保持。唯一新增quadriceps-A接触估计6/240帧为4.02mm，超过默认4mm最多0.02mm，保留review，不改姿态/阈值。托马斯2/10只另存整周期恒定构图派生，720＋300帧及2静帧边界检查均0触碰、最低边距58/59px，原raw/动作/运镜和媒体不变；最终选用见生产 `audit-final/manifest.json` 和派生目录 `delivery-manifest.json`。

旧源码、模型、媒体、失败稿和QA均保留。此目录不保存机器config、token、浏览器缓存或新媒体，冻结spec及生产代码不可覆盖。便携目录为 `output/training-human-v2-library-portable-20261013`，播放/追溯范围与实际包身份按打包清单登记；App正式选版/媒体替换另行安排。
