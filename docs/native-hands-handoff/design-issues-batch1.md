# 新手 batch1 动作设计核对（只记录，不修改动作）

脚本：/workspace/tools-native/batch.mjs；无渲染，基于 spec 描述符解析。膝脚方向用 poleLow 水平角对比 heading，仰卧/卷腹类 heading=90 是躺姿约定，差值多为误报。

- **a-deep-squat-r2.js**: a-* 自测静图集
- **h-crunch.js**: left 膝提示外展 6° vs 脚尖 90°（差 84°，膝脚可能不同向）；right 膝提示外展 6° vs 脚尖 90°（差 84°，膝脚可能不同向）
- **h-goblet-squat-rr1.js** (排除:手用 world 坐标定位（多为扶器械/地面/身体固定点），无法解析确认不接触): left 膝提示外展 23° vs 脚尖 10°（差 13°，膝脚可能不同向）；right 膝提示外展 23° vs 脚尖 10°（差 13°，膝脚可能不同向）
- **h-russian-twist.js** (排除:QA 允许手接触：handL|handR): left 膝提示外展 24° vs 脚尖 6°（差 18°，膝脚可能不同向）；right 膝提示外展 24° vs 脚尖 6°（差 18°，膝脚可能不同向）；节奏：spec 8s 不是 catalog 每次 3.00s 的整数倍（2.67）
- **h-standing-wrist-extensor-stretch.js**: 直臂时手指与前臂夹角最大 40°（>30°，可能折腕，需近景；未自动改手指）
- **h-supine-heel-slide-rr1.js** (排除:手接触/支撑描述): left 膝提示外展 8° vs 脚尖 90°（差 82°，膝脚可能不同向）；right 膝提示外展 8° vs 脚尖 90°（差 82°，膝脚可能不同向）
- **w-dead-bug.js**: 节奏：spec 8s 不是 catalog 每次 3.00s 的整数倍（2.67）

## 无教学语义可对照（不在 catalog 0.3.0）或 catalog 无 rhythm

a-deep-squat-r2.js、abs-A.js、adductors-A.js、glute-max-C.js、h-banana.js、h-bilateral-upper-back-hug-rr3.js、h-bridge-overhead.js、h-chair-lat.js、h-chair-sit-to-stand.js、h-floor-nordic-hand-reset-rr3.js、h-forward-lunge.js、h-goblet-squat-rr1.js、h-kneeling-instep-stretch-rr6.js、h-kneeling-pushup-rr1.js、h-kneeling-thread-needle-rr1.js、h-lateral-step-lunge.js、h-open-book.js、h-quadruped-rockback-rr1.js、h-standing-forearm-rotation.js、h-standing-wrist-deviation.js、h-standing-wrist-extensor-stretch.js、h-step-jack.js、h-supine-bilateral-leg-raise-rr3.js、h-supine-heel-slide-rr1.js、h-supine-twist-r2.js、hamstrings-A.js、hamstrings-C.js、o-chair-knee-extension-rr1.js、o-seated-calf-raise-rr1.js、o-seated-hip-er.js、o-seated-sidebend-rr2.js、o-stand-sidebend.js、quadriceps-C.js、scapular-A.js
