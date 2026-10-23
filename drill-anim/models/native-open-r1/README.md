# native-open-r1：新动作使用手部 r3 / native-grip r1 的正式入口

`hands-native-r3/loader.mjs` 和 `grip-native-r1/loader.mjs` 在固定 SHA 清单里，按动作 ID 白名单只放行已审的 rr7/rr8/单杠 rr7。本入口不改它们，复用其校验函数和同一份固定数据，**任何 ID** 只要显式选择受支持的 profile + 版本即可加载。

## spec 写法

自由手（不接触）：
```js
s.modelProfile='training-human-v2plus-hands-native';
s.nativeHands={version:'1.0.0-r3'};
```
握单杠：
```js
import {nativeGripPose} from '../models/grip-native-r1/pose.mjs';
s.modelProfile='training-human-v2plus-native-grip';
s.nativeGrip={version:'1.0.0-r1'};
// 手位写法照抄 specs/h-fixed-bar-vertical-pull-rr7.js
```

## 预览

```bash
node drill-anim/models/native-open-r1/preview.mjs drill-anim/specs/<id>.js <新输出目录> [帧号,逗号分隔，默认 0,60,120,180,239,240]
```
输出全身帧 + 0/60/120 双手近景 + `review.json`（reviewed=false, releaseEligible=false）。

## 已验证 / 未验证

- 已验证：hands-native r3 自由手（提踵 rr7、单腿臀推 rr8 外观确认）；native-grip r1 固定单杠 32 mm 握杠（单杠 rr7）。
- 未验证（允许加载，但会打印警告）：手掌撑地、握哑铃、双手互握/合掌等其它接触。这类动作必须看双手近景，检查不陷、不悬空、不互穿，并先交样片。

2026-10-24 用新 ID 临时 spec 实测两条路径都能出帧。正式成片仍由主线 4080 出。
