# 动作包核对 r3 · 总台账

（本文件由 `LEDGER.head.md` + 各动作 JSON 的 `review.r3.audit` 生成；进度见 `PROGRESS.md`。）

## 黑名单词全量扫描（2026-11-13，249 个 v3-text 文件，扫 name/purpose/cues/commonErrors/cautions/phases/voiceGuide 中文）

| 词 | 出现次数 | 文件数 | 处理 |
|---|---|---|---|
| 弹震、代偿、激活、中立位、离心、向心、等长、髋铰链、募集、稳定性、核心收紧、收紧核心、姿态、下肢、上肢 | 0 | 0 | r2 已清掉；列入报错黑名单防回潮 |
| 脊柱 | 1 | 1（o-seated-catcow） | 报错（r3 改过的动作） |
| 躯干 | 1 | 1（h-forearm-plank） | 报错（r3 改过的动作） |
| 幅度 | 84 | 79 | 警告：多数可换「能到哪儿到哪儿」「转大一点/小一点」 |
| 髋部 | 61 | 48 | 警告：换「胯」「屁股」 |
| 骨盆 | 52 | 28 | 警告：换「胯骨」「两边胯一样高」 |
| 控制 | 49 | 44 | 警告：换「慢慢」「别甩」 |
| 稳定 | 12 | 12 | 警告：换「站稳」「别晃」 |
| 均匀 | 8 | 8 | 警告：换「正常喘气」 |
| 核心 | 5 | 5 | 警告：换「肚子绷住」 |
| 感受 | 1 | 1 | 警告 |

英文：glute 76、control 50、squeeze 47、pelvis 12、core 8、tension 7、stabil 3、brace 2、spine 1、posture 1；maintain/engage/ensure/neutral/activate 为 0。glute、squeeze 属健身房常用口语，不拦；control/core/stabil 警告。

`text.py`：报错词对 `ai-reviewed-r3-needs-user-review` 的动作生效（未改的旧稿只警告，避免整库校验在批次之间失败）；警告词计数在输出 `weakWords`，`--weak` 列出明细。

## 去套话（r3 第二遍，2026-11-14）

开哥最在意：文字不能一听就是 AI 写的、千篇一律。扫描全部 249 个 `v3-text/*.json` 的自写句子（purpose、cues、commonErrors、cautions、phases、voiceGuide 的 set/reminders/steps，中英文分开），去标点后完全相同，或只差一两个字（中文 ≥6 字时差 1 字、≥10 字时差 2 字；英文 ≥4 词时差 1 词、≥7 词时差 2 词）算同一句，统计出现在几个动作里。工具：`python3 tools/action-package-v3/text.py --dupes [--dupes-min 4]`（只报告不拦截）。

### 前后统计（出现在 ≥4 个动作的句子）

| | 改前 | 改后 |
|---|---|---|
| 句子组数（中 + 英） | 95（中 51 + 英 44） | 0 |
| 涉及动作数 | 205 | 0 |
| 短口令组数（中文 ≤4 字 / 英文 ≤3 词，单列不计入） | 104 | 90 |

### 短口令为什么不硬改

「停一下」「慢慢放」「稳住」「别憋气」「耸肩」「Hold」「Lower slowly」这类 2–4 字的相位口令和错误标签，是教练在任何动作里都这么喊的现场用语，跟「开始」「休息」一样；为了不同而硬换说法反而别扭，而且相位口令受相位秒数限制（§6）。所以按「中文 ≤4 字、英文 ≤3 词」单列为口令，只报告、不算套话。唯一例外：拉伸的相位口令「停住，呼气 / 呼气再松」（44 / 34 个动作）是这批套话的标志，本轮已按动作改写（如「手掌贴墙 / 再转开点」「肩膀贴地 / 膝盖再沉」）。

### 改法

共改 205 个动作、643 处文字（其中 voiceGuide 146 句、相位口令 94 条），中英文同步。

逐个动作按真实的身体动作和最容易犯的错重写，像教练当面指着说：扭转 →「转到有感觉就停，别用手硬掰椅背」；拉小腿 →「后脚尖正冲着墙，别往外撇」「后脚跟一直踩实」；侧弯 →「两边屁股都坐实椅面」。安全提醒保留意思，但说具体部位和具体退法（「一只手撑全身，手腕疼或发麻就放下来」「腰发紧就倒到一半就起来」）。voiceGuide 引用的句子同步改，`from` 指向新出处。每个改过的动作在 `<id>.md` 末尾有「r3 第二遍」小节（改前 → 改后），JSON `review.r3.changes` 记一句。

### 改前清单（95 组，按动作数排序）

| 语言 | 句子（含近似写法） | 动作数 | 涉及 id |
|---|---|---|---|
| zh | 呼气，再松一点 / 呼气，再沉一点 / 呼气，再垂一点 | 40 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-close-stance-forward-fold-native, h-couch-stretch, h-crossbody, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec, h-wall-straddle, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| en | Breathe out, let go | 38 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-progressive-front-split-native, h-couch-stretch, h-crossbody, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec, h-wall-straddle, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| zh | 憋气或一下一下往下压 / 憋着气，或一下一下往下颠 | 24 | h-wall-straddle, h-wall-wrist-flexor-stretch, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-pigeon, s-seated-fold |
| en | Holding your breath or bouncing. | 24 | h-wall-straddle, h-wall-wrist-flexor-stretch, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-pigeon, s-seated-fold |
| zh | 就停在这儿，慢慢喘气，每次呼气再松一点。 | 23 | h-wall-straddle, h-wall-wrist-flexor-stretch, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| en | Stay right there, breathe slowly, let go a little more each breath out. | 23 | h-wall-straddle, h-wall-wrist-flexor-stretch, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| zh | 别一下一下往下压，有拉的感觉就够，别拉到疼。 | 22 | h-wall-straddle, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| zh | 两边各做一次算 1 下。 / 两边各转一次算 1 下。 / 两边各蹲一次算 1 下。 … | 22 | adductors-A, chest-A, h-bridge-march, h-chair-step-up, h-db-curl, h-forward-lunge, h-lateral-step-lunge, h-mountain-climber, h-plank-side-step, h-reverse-lunge, h-russian-twist, h-step-jack, n-chair-wiper, n-seated-ir-drop, n-seated-knee-lift, n-squat-shift, n-windshield, o-supported-march, obliques-A, rotator-cuff-A, t-seated-straddle-lift-1leg, w-dead-bug |
| en | Don't bounce. A clear stretch is enough, never pain. | 22 | h-wall-straddle, n-half-split, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, o-seated-ham, o-seated-sidebend, o-seated-twist, o-stand-crossreach, o-stand-ham, o-stand-lunge, o-stand-quad, o-stand-sidebend, o-wall-hip-hinge-stretch, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-lizard, s-seated-fold |
| en | One on each side counts as one. / One turn each way counts as one. / One lift on each side counts as one. … | 22 | adductors-A, chest-A, h-bridge-march, h-chair-step-up, h-db-curl, h-forward-lunge, h-lateral-step-lunge, h-mountain-climber, h-plank-side-step, h-reverse-lunge, h-russian-twist, h-step-jack, n-chair-wiper, n-seated-ir-drop, n-seated-knee-lift, n-squat-shift, n-windshield, o-supported-march, obliques-A, rotator-cuff-A, t-seated-straddle-lift-1leg, w-dead-bug |
| zh | 就停在这儿，慢慢喘气。 | 19 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-close-stance-forward-fold-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| zh | 一下一下往下压 | 19 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-close-stance-forward-fold-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| en | Stay right there and breathe slowly. | 19 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-close-stance-forward-fold-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| en | Bouncing to go deeper. | 19 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-close-stance-forward-fold-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| zh | 每次呼气再松一点，别一下一下往下压。 | 18 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| en | Each breath out, let go a little more. Don't bounce. | 18 | h-banana, h-band-leg-out, h-chair-elbow-triceps-stretch, h-chair-lat, h-chair-progressive-front-split-native, h-couch-stretch, h-crossbody, h-dd-shoulder, h-doorframe-forearms-pec-native-r3, h-half-kneeling-quad-stretch, h-knee-hug, h-kneeling-instep-stretch, h-overhead-triceps-stretch, h-seated-reachback, h-supine-twist, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec |
| en | Pause at the top, then lower slowly. / Pause a second at the top, then lower slowly. / Pause briefly at the top, then lower slowly. … | 15 | erectors-B, glute-max-B, glute-max-C, h-9090-liftoff, h-db-overhead-shrug, h-db-supported-calf-raise, h-reverse-clam, h-side-er, h-side-leg-raise, h-superman, h-supported-single-leg-calf, hip-flexors-C, o-seated-calf-raise, o-supported-knee-curl, w-feet-on-chair-bridge |
| en | If your lower back feels off, don't lift as high. Stop if it still hurts. / If your lower back feels off, don't bend as far. Stop if it still hurts. / If your hip feels off, don't lift as high. Stop if it still hurts. … | 15 | erectors-B, erectors-C, glute-max-A, glute-max-B, glute-max-C, h-chair-kickback, h-db-rdl, h-db-reverse-fly, h-donkey-kick, h-good-morning, h-reverse-clam, h-russian-twist, h-side-leg-raise, h-superman, n-prone-hip-ext |
| zh | 手腕刺疼或发麻就停，开始前先转转手腕 | 13 | h-dd-shoulder, h-donkey-kick, h-incline-pushup, h-kneeling-pushup, h-kneeling-thread-needle, h-mountain-climber, h-pike-pushup, h-plank-side-step, h-quad-cars, h-quadruped-open, h-quadruped-rockback, h-seated-reachback, h-tabletop |
| zh | 拉到舒服就行，疼就松一点 / 拉到舒服就行，疼就松开 | 13 | h-bilateral-upper-back-hug, h-chair-lat, h-chair-progressive-front-split-native, h-chair-tspine, h-doorframe-forearms-pec-native-r3, h-knee-hug, h-kneeling-instep-stretch, h-kneeling-thread-needle, h-overhead-triceps-stretch, h-quadruped-open, h-seated-reachback, h-standing-wrist-extensor-stretch, h-supine-twist |
| en | Stop if your wrists get sharp pain or go numb. Roll them out before you start. | 13 | h-dd-shoulder, h-donkey-kick, h-incline-pushup, h-kneeling-pushup, h-kneeling-thread-needle, h-mountain-climber, h-pike-pushup, h-plank-side-step, h-quad-cars, h-quadruped-open, h-quadruped-rockback, h-seated-reachback, h-tabletop |
| zh | 先用轻哑铃，哪儿疼就停 / 先用轻壶铃，哪儿疼就停 | 12 | h-db-calf-raise, h-db-floor-fly, h-db-floor-press, h-db-lateral, h-db-overhead-triceps-extension, h-db-press, h-db-rdl, h-db-reverse-fly, h-db-row, h-db-split-squat, h-db-supported-calf-raise, h-goblet-squat |
| zh | 顶上停一下，再慢慢放下。 / 顶上停一下，再慢慢放下来。 / 顶上停一秒，再慢慢放下来。 … | 12 | erectors-B, glute-max-B, glute-max-C, h-9090-liftoff, h-db-overhead-shrug, h-db-supported-calf-raise, h-reverse-clam, h-side-er, h-side-leg-raise, h-superman, h-supported-single-leg-calf, w-feet-on-chair-bridge |
| en | Stretch only to a comfortable point. Ease off if anything hurts. | 12 | h-chair-lat, h-chair-progressive-front-split-native, h-chair-tspine, h-doorframe-forearms-pec-native-r3, h-knee-hug, h-kneeling-instep-stretch, h-kneeling-thread-needle, h-overhead-triceps-stretch, h-quadruped-open, h-seated-reachback, h-standing-wrist-extensor-stretch, h-supine-twist |
| en | Start with light dumbbells. Stop if anything hurts. / Start with a light kettlebell. Stop if anything hurts. | 12 | h-db-calf-raise, h-db-floor-fly, h-db-floor-press, h-db-lateral, h-db-overhead-triceps-extension, h-db-press, h-db-rdl, h-db-reverse-fly, h-db-row, h-db-split-squat, h-db-supported-calf-raise, h-goblet-squat |
| zh | 腰不舒服就抬低点，还疼就停 / 胯不舒服就抬低点，还疼就停 / 腰不舒服就弯浅点，还疼就停 … | 11 | erectors-B, erectors-C, glute-max-A, glute-max-B, glute-max-C, h-chair-kickback, h-donkey-kick, h-reverse-clam, h-russian-twist, h-side-leg-raise, h-superman |
| zh | 身子别往后仰 / 身子往后仰 / 身子别往后翻 | 11 | h-band-face-pull, h-band-row, h-biceps-self, h-db-front-raise, h-inner-thigh, h-side-er, h-towel-isometric-curl, hip-flexors-B, n-seated-knee-lift, o-chair-knee-extension, t-seated-straddle-ext |
| zh | 肩膀疼就抬低点，还疼就停 / 肩膀疼就拉轻点，还疼就停 / 肩膀疼就滑少点，还疼就停 … | 10 | h-crossbody, h-supine-cactus-chest, h-towel-behind, h-towel-pass, h-towel-pulldown, h-wall-pec, n-prone-hip-ext, o-wall-hip-hinge-stretch, scapular-A, w-fire-hydrant |
| zh | 膝盖往里倒 | 9 | h-chair-sit-to-stand, h-goblet-squat, h-knee-wall-dorsiflexion-native, h-lateral-step-lunge, h-squat, n-squat-shift, n-straddle-fold, o-supported-mini-squat, w-chair-hip-thrust |
| zh | 用结实、不带轮子的椅子 / 用稳当、不带轮子的椅子 | 9 | h-bulgarian, h-chair-dip, h-chair-elbow-triceps-stretch, h-chair-kickback, h-chair-lat, h-chair-progressive-front-split-native, h-chair-single-leg-hip-thrust, h-chair-tspine, h-db-row |
| en | Arching your lower back. | 9 | h-band-pull-apart, h-db-overhead-triceps-extension, h-overhead-triceps-stretch, h-standing-arm-extension-stretch, h-towel-pass, h-towel-pulldown, o-stand-lunge, o-stand-quad, serratus-B |
| en | Use a sturdy chair without wheels. | 9 | h-bulgarian, h-chair-dip, h-chair-elbow-triceps-stretch, h-chair-kickback, h-chair-lat, h-chair-progressive-front-split-native, h-chair-single-leg-hip-thrust, h-chair-tspine, h-db-row |
| en | Use a sturdy chair without wheels. Stop if it hurts or you feel wobbly. | 9 | o-supported-ankle-eversion, o-supported-ankle-inversion, o-supported-ankle-pump, o-supported-hip-airplane, o-supported-knee-curl, o-supported-march, o-supported-mini-squat, o-supported-single-leg-rdl, o-supported-star-reach |
| en | Roll out your wrists first. Stop right away if they get sharp pain or go numb. / Roll out your wrists first. Stop if they get sharp pain or go numb. | 9 | lats-A, obliques-A, rotator-cuff-A, serratus-A, t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, triceps-A, triceps-B |
| en | Front knee caving in. / Standing knee caving in. / Knee caving in. | 9 | h-bulgarian, h-db-split-squat, h-forward-lunge, h-lateral-step-lunge, h-reverse-lunge, h-unsupported-star-reach-native, n-slider-lateral, o-supported-hip-airplane, o-supported-star-reach |
| zh | 用不带轮子的结实椅子，疼或站不稳就停 | 8 | o-supported-ankle-inversion, o-supported-ankle-pump, o-supported-hip-airplane, o-supported-knee-curl, o-supported-march, o-supported-mini-squat, o-supported-single-leg-rdl, o-supported-star-reach |
| zh | 开始前先转转手腕，刺疼或发麻马上停 | 8 | obliques-A, rotator-cuff-A, serratus-A, t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, triceps-A, triceps-B |
| zh | 膝盖对着脚尖 / 膝盖对着脚趾 | 8 | h-chair-sit-to-stand, h-goblet-squat, h-knee-wall-dorsiflexion-native, h-lateral-step-lunge, h-squat, n-slider-lateral, o-supported-mini-squat, o-supported-star-reach |
| en | Bring it back slowly / Bring it back | 8 | g-cable-hip-abduction, g-cable-hip-extension, h-band-hip-extension, h-band-hip-ir, h-band-standing-abduction, h-quadruped-open, n-leg-circles, w-dead-bug |
| en | Arching your lower back instead of using your butt. / Arching your back instead of using your butt. / Arching your lower back instead of squeezing your butt. | 8 | g-cable-hip-extension, glute-max-A, h-band-hip-extension, h-bridge-march, h-couch-stretch, n-prone-hip-ext, s-kneel-hipflex, w-chair-hip-thrust |
| en | If the front of your shoulder pinches, don't lift as high. Stop if it still hurts. / If the front of your shoulder pinches, don't go as high. Stop if it still hurts. / If the front of your shoulder pinches, don't lower as far. Stop if it still hurts. … | 8 | h-db-lateral, h-db-overhead-triceps-extension, h-db-press, h-open-book, h-side-er, h-standing-arm-extension-stretch, h-tabletop, n-seated-knee-lift |
| en | If it hurts, don't turn as far. Stop if it still hurts. / If it hurts, don't tilt as far. Stop if it still hurts. / If it hurts, don't slide as far. Stop if it still hurts. … | 8 | h-standing-forearm-rotation, h-standing-wrist-deviation, h-supine-heel-slide, h-tib-raise, h-wall-calf, h-wall-calf-bent-knee, h-wall-pec, o-seated-twist |
| zh | 一边做完，绑带换到另一只脚，转过身再做。 | 7 | adductors-C, g-cable-hip-abduction, g-cable-hip-extension, h-band-hip-extension, h-band-standing-abduction, h-band-standing-adduction, h-band-straight-leg-raise |
| zh | 带子拴不牢先别开始 | 7 | h-band-chest-fly, h-band-face-pull, h-band-hip-ir, h-band-pallof, h-band-shoulder-ir, h-band-stepout, h-band-triceps-pressdown |
| zh | 膝盖不舒服就蹲浅点，还疼就停 / 膝盖不舒服就蹲浅一点，还疼就停 | 7 | adductors-A, h-db-split-squat, h-forward-lunge, h-goblet-squat, h-lateral-step-lunge, h-squat, h-sumo-pry |
| zh | 手肘贴住身体 / 手肘贴着身体 / 手肘贴住身子 | 7 | h-band-row, h-band-shoulder-ir, h-biceps-self, h-db-curl, h-db-reverse-curl, h-db-zottman-curl, rotator-cuff-B |
| zh | 膝盖或胯疼就倒小点，还疼就停 / 膝盖或胯疼就蹲浅点，还疼就停 / 膝盖或胯疼就抱松点，还疼就停 … | 7 | n-chair-wiper, n-prone-ir, n-seated-ir-drop, n-squat-shift, n-thomas-test, n-windshield, o-seated-hip-er |
| en | When one side is done, move the strap to the other ankle and turn around. | 7 | adductors-C, g-cable-hip-abduction, g-cable-hip-extension, h-band-hip-extension, h-band-standing-abduction, h-band-standing-adduction, h-band-straight-leg-raise |
| en | Don't start until the band is anchored securely. | 7 | h-band-chest-fly, h-band-face-pull, h-band-hip-ir, h-band-pallof, h-band-shoulder-ir, h-band-stepout, h-band-triceps-pressdown |
| en | Don't arch your back / Don't sag your back | 7 | g-cable-hip-extension, h-band-hip-extension, h-chair-kickback, h-db-overhead-triceps-extension, h-donkey-kick, h-half-kneeling-quad-stretch, h-overhead-triceps-stretch |
| en | If your shoulders hurt, don't lift as high. Stop if it still hurts. / If your shoulders hurt, don't slide as far. Stop if it still hurts. / If your shoulders hurt, don't go as far. Stop if it still hurts. … | 7 | h-supine-cactus-chest, h-towel-behind, h-towel-pass, h-towel-pulldown, o-wall-hip-hinge-stretch, scapular-A, w-fire-hydrant |
| zh | 背挺平，别弓 | 6 | erectors-C, h-adductor-rock, h-db-kickback, h-db-rdl, h-good-morning, h-quadruped-rockback |
| zh | 背挺直，别弓 | 6 | o-seated-fig4, o-seated-ham, o-stand-ham, s-9090, s-butterfly, s-seated-fold |
| en | If your knees feel off, don't go as low. Stop if it still hurts. / If your knee feels off, don't go as low. Stop if it still hurts. / If your knees hurt, don't go as low. Stop if it still hurts. | 6 | h-db-split-squat, h-goblet-squat, h-lateral-step-lunge, h-squat, h-sumo-pry, o-supported-mini-squat |
| en | Squeeze at the top / Pause at the top. / Reach at the top | 6 | erectors-A, h-chair-single-leg-hip-thrust, h-db-shrug, h-reverse-clam, serratus-B, w-chair-hip-thrust |
| en | Shoulders away from your ears / Shoulders away from ears / Shoulders down, away from your ears. | 6 | h-cobra, h-db-lateral, h-dd-shoulder, h-fixed-bar-vertical-pull, lats-A, triceps-B |
| en | Rounding your back to reach your foot. / Rounding your back to reach the floor. / Rounding your back to reach down. … | 6 | n-half-split, n-straddle-fold, o-seated-ham, o-stand-ham, s-butterfly, s-seated-fold |
| zh | 慢慢放回来 | 5 | deltoids-C, g-cable-hip-abduction, g-cable-hip-extension, h-band-hip-extension, h-band-standing-abduction |
| zh | 腰别往后仰 | 5 | g-cable-hip-extension, h-chair-kickback, h-db-overhead-triceps-extension, h-half-kneeling-quad-stretch, h-overhead-triceps-stretch |
| zh | 开始前先转转手腕 | 5 | t-flare-side-hold, t-lsit-wide, t-straddle-hold, t-tuck-planche, t-vsit |
| zh | 肩膀往下压 | 5 | t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, t-lsit-wide, t-straddle-hold |
| zh | 两边胯一样高 / 两边胯骨一样高 | 5 | adductors-C, glute-max-A, h-band-standing-adduction, h-bridge-march, h-chair-single-leg-hip-thrust |
| zh | 练屁股，让腿往后抬更有劲 / 练屁股，让腿往后蹬更有劲 / 练屁股，让腿往后推更有劲 | 5 | g-cable-hip-extension, glute-max-B, h-band-hip-extension, h-chair-kickback, h-donkey-kick |
| zh | 肩膀前面夹着疼就抬低点，还疼就停 / 肩膀前面夹着疼就推低点，还疼就停 / 肩膀前面夹着疼就转小点，还疼就停 | 5 | h-db-lateral, h-db-press, h-side-er, h-standing-arm-extension-stretch, h-tabletop |
| zh | 手肘离开身子 / 手肘离开身体 | 5 | h-band-shoulder-ir, h-biceps-self, h-side-er, h-standing-forearm-rotation, rotator-cuff-B |
| en | Roll out your wrists before you start. | 5 | t-flare-side-hold, t-lsit-wide, t-straddle-hold, t-tuck-planche, t-vsit |
| en | Hips shifting to one side. / Hips rolling to one side. / Hips dropping to one side. … | 5 | h-band-leg-out, h-chair-single-leg-hip-thrust, h-kneeling-thread-needle, h-plank-side-step, h-quadruped-open |
| en | Back on the wall / Back on the floor / Forearms on the wall … | 5 | h-wall-angel, h-wall-calf-bent-knee, h-wall-straddle, hip-abductors-B, w-wall-sit |
| zh | 手腕疼或发麻就停，做之前先转转手腕 | 4 | abs-B, chest-A, deltoids-A, erectors-A |
| zh | 慢慢放下来 | 4 | erectors-B, glute-max-A, glute-max-C, h-bridge-overhead |
| zh | 前膝往里倒 | 4 | h-bulgarian, h-db-split-squat, h-forward-lunge, h-reverse-lunge |
| zh | 脚踝往外翻 | 4 | h-calf-raise, h-db-calf-raise, h-db-supported-calf-raise, h-supported-single-leg-calf |
| zh | 慢慢沉下去 | 4 | h-chair-elbow-triceps-stretch, h-chair-lat, h-wall-calf-bent-knee, lats-C |
| zh | 肩膀离耳朵远点 | 4 | h-dd-shoulder, h-fixed-bar-vertical-pull, lats-A, triceps-B |
| zh | 背拉长，别弓 | 4 | h-dd-shoulder, n-half-split, n-straddle-fold, n-wide-fold |
| zh | 脚后跟踩实 | 4 | h-goblet-squat, h-lateral-step-lunge, h-squat, h-sumo-pry |
| zh | 腰别往前挺 | 4 | h-towel-pulldown, o-stand-lunge, o-stand-quad, serratus-B |
| zh | 站着那条腿膝盖往里倒 | 4 | h-unsupported-star-reach-native, n-slider-lateral, o-supported-hip-airplane, o-supported-star-reach |
| zh | 肩膀往下压，手臂伸直。 | 4 | t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, t-lsit-wide |
| zh | 手肘往两边张开 / 手肘往两边张 | 4 | h-chair-dip, h-incline-pushup, h-kneeling-pushup, h-pike-pushup |
| zh | 脚踝别往外翻 / 脚踝别外翻 | 4 | h-calf-raise, h-db-calf-raise, h-db-supported-calf-raise, h-supported-single-leg-calf |
| zh | 身子前后晃借劲 / 身子前后摆借劲 | 4 | h-db-reverse-curl, h-db-zottman-curl, hip-abductors-C, lats-B |
| zh | 手肘疼就换根轻点的带子 / 肩膀疼就换根轻点的带子 | 4 | h-band-biceps-curl, h-band-face-pull, h-band-pull-apart, h-band-triceps-pressdown |
| zh | 膝盖疼就伸少点，还疼就停 / 膝盖疼就少弯点，还疼就停 / 膝盖疼就蹲浅点，还疼就停 … | 4 | o-chair-knee-extension, o-stand-quad, o-supported-mini-squat, s-figure4 |
| en | Stop if your wrists hurt or go numb. Loosen them up first. | 4 | abs-B, chest-A, deltoids-A, erectors-A |
| en | Swinging your legs for momentum. | 4 | abs-C, glute-max-C, h-reverse-crunch, triceps-C |
| en | Press your shoulders down, arms straight. | 4 | t-lsit-open-close, t-lsit-tuck, t-lsit-vsit-circles, t-lsit-wide |
| en | Elbow at your side / Elbow leaving your side. / Elbow stays at your side | 4 | h-band-shoulder-ir, h-biceps-self, h-side-er, rotator-cuff-B |
| en | Lower back lifting off the floor. / Lower back lifting off the mat. | 4 | h-crunch, h-wall-straddle, hip-abductors-B, n-leg-circles |
| en | If your elbows hurt, use a lighter band. / If your shoulders hurt, use a lighter band. | 4 | h-band-biceps-curl, h-band-face-pull, h-band-pull-apart, h-band-triceps-pressdown |
| en | Flat back, no rounding / Flat back, no twisting / Long back, no rounding | 4 | h-db-rdl, h-db-row, h-dd-shoulder, h-good-morning |
| en | Sink a bit more / Lean a bit more / Turn a bit more | 4 | h-wall-calf-bent-knee, n-straddle-fold, o-seated-twist, s-lizard |
| en | Leaning back to lift your legs. / Leaning back to lift your leg. | 4 | hip-flexors-A, n-seated-knee-lift, t-seated-straddle-lift-1leg, t-seated-straddle-lifts |
| en | If your knee or hip hurts, don't tip as far. Stop if it still hurts. / If your knee or hip hurts, don't drop as far. Stop if it still hurts. / If your knee or hip hurts, don't hug as tight. Stop if it still hurts. … | 4 | n-chair-wiper, n-seated-ir-drop, n-thomas-test, o-seated-hip-er |
| en | If your knee hurts, don't straighten as far. Stop if it still hurts. / If your back hurts, don't move as far. Stop if it still hurts. / If your knee hurts, don't bend it as far. Stop if it still hurts. … | 4 | o-chair-knee-extension, o-seated-catcow, o-stand-quad, w-clamshell |

## 待办（r3 第二遍后仍开着的）

- **activeMuscles 词表缺部位**（开哥 2026-11-14 同意推荐：本 PR 不动）：`tags.activeMuscles` 词表没有「胯/髋周深层」「小腿前侧」这类部位，个别动作只能填大致区域（如 h-band-hip-ir、o-supported-ankle-eversion、o-supported-hip-ir 的 r2/r3 flag）。下一步：先在 ai-tags 词表里补部位，再逐个回填，单独开 PR。
- **batch-25 V4 预览未出**：`qa/v4-render-1112` 分支 2026-11-14 01:09 检查仍只有 batch-01…24（progress.log 最后一条 00:25 triceps-B done）。triceps-C、w-bird-dog、w-chair-hip-thrust、w-clamshell、w-dead-bug、w-feet-on-chair-bridge、w-fire-hydrant、w-prone-swimmer、w-wall-sit 共 9 个的画面对照待补看。
- 短口令（≤4 字）跨动作重复属正常教练用语，单列报告（见上节），如开哥觉得某几条也太顺口，再点名改。

## 规则

`catalog/production/v3-text/STYLE.md` §5–§9（r3：真实节奏 §6、换边准备 §6、难度同步 §5b、voiceGuide §8、教练口吻 §9）。单个记录见同目录 `<id>.md`；JSON 内 `review.r3`。校验：`python3 tools/action-package-v3/text.py`、`python3 tools/ai-tags/validate.py`。
