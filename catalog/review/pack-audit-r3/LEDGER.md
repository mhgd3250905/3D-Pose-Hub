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

## 台账（249/249）

| id | 类型 | 剂量 改前 → 改后 | 一下 改前 → 改后 | 难度 v3/ai → 统一 | 文字 | 画面对照 | 极端 |
|---|---|---|---|---|---|---|---|
| abs-A | hold | 3 组×20 秒，休息 45 秒 → 3 组×20 秒，休息 45 秒 | 计时 → 计时 | 1/3 → 2 | 口吻改写 | 一致：仰卧、手臂过头、双腿并拢伸直抬起、腹部高亮、垫子 |  |
| abs-B | hold | 4 组×10 秒，休息 60 秒 → 3 组×10 秒，休息 60 秒 | 计时 → 计时 | 2/3 → 3 | 口吻改写 | 一致：平行杆上团身撑起、腹部高亮 |  |
| abs-C | rep_hold | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：双杠直臂支撑、屈膝抬腿、腹部高亮 |  |
| adductors-A | rep_alternate | 3 组×每侧6 次，休息 45 秒 → 3 组×每侧6 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 4.0 s/侧（一左一右 8.0 s） | 2/3 → 3 | 口吻改写 | 一致：哥萨克侧蹲、一腿伸直、双臂前伸、大腿内侧高亮 |  |
| adductors-B | hold | 3 组×每侧15 秒，休息 45 秒 → 3 组×每侧15 秒，休息 45 秒 | 计时 → 计时 | 2/2 → 2 | 口吻改写 | 基本一致：侧撑、上腿搭凳、大腿内侧高亮；但画面是直臂手撑地，文字写前臂撑地（非极端） |  |
| adductors-C | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：侧对绳索站、脚踝绑带、大腿内侧高亮 |  |
| chest-A | rep_alternate | 3 组×每侧6 次，休息 60 秒 → 3 组×每侧6 次，休息 60 秒 | 4.0 s/侧（一左一右 8.0 s） → 4.0 s/侧（一左一右 8.0 s） | 2/3 → 2 | 口吻改写 | 动作一致：垫上俯卧撑位；胸部高亮在预览帧里看不到（非极端，待看视频） |  |
| chest-B | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：平行杆、俯卧撑、胸部高亮 |  |
| chest-C | rep_updown | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 4.0 s → 3.0 s | 2/2 → 2 | 口吻改写 | 一致：前后脚站、单臂推绳索、胸部高亮 |  |
| deltoids-A | rep_updown | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s → 3.0 s | 1/3 → 2 | 口吻改写 | 动作一致：直臂侧撑、一手叉腰；肩部高亮在预览帧里不明显（非极端） |  |
| deltoids-B | rep_updown | 3 组×每侧3 次，休息 60 秒 → 3 组×每侧3 次，休息 60 秒 | 8.0 s → 14.0 s | 2/3 → 3 | 口吻改写 | 一致：半程土耳其起立到高桥、哑铃举向上、肩部高亮（batch-02 第 1 行） |  |
| deltoids-C | rep_updown | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s → 3.0 s | 2/2 → 2 | 口吻改写 | 一致：半跪地雷杆单臂推、肩部高亮（batch-02 第 2 行） |  |
| erectors-A | rep_hold | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.5 s | 1/2 → 2 | 口吻改写 | 基本一致：手撑地、身体斜成一线、腰背高亮；预览帧难分辨是否面朝上（反向平板），待看视频 |  |
| erectors-B | rep_hold | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/2 → 1 | 口吻改写 | 一致：瑜伽球背伸、双脚抵墙、腰背高亮（batch-02 第 4 行） |  |
| erectors-C | rep_updown | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：45° 罗马椅背伸、腰背高亮（batch-02 第 5 行） |  |
| forearms-A | rep_updown | 2 组×16 次，休息 20 秒 → 2 组×16 次，休息 20 秒 | 2.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 一致：四点跪、手掌撑地、前臂/手腕高亮（batch-02 第 6 行） |  |
| forearms-B | rep_updown | 3 组×每侧15 次，休息 45 秒 → 3 组×每侧15 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：坐凳、前臂搭大腿、哑铃卷腕、前臂高亮（batch-02 第 7 行） |  |
| forearms-C | hold | 3 组×每侧30 秒，休息 45 秒 → 3 组×每侧30 秒，休息 45 秒 | 计时 → 计时 | 2/3 → 2 | 口吻改写 | 一致：站姿、壶铃倒提、前臂高亮（batch-02 第 8 行） |  |
| g-cable-hip-abduction | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿绳索侧抬腿、扶椅、臀外侧高亮（batch-02 第 9 行） |  |
| g-cable-hip-extension | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿绳索后踢、扶椅、臀部高亮（batch-02 第 10 行） |  |
| glute-max-A | rep_hold | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：仰卧单腿臀桥、一腿伸直抬起、臀部高亮 |  |
| glute-max-B | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.2 s | 1/2 → 1 | 口吻改写 | 一致：四点跪、弹力带、直腿后踢、臀部高亮 |  |
| glute-max-C | rep_updown | 3 组×12 次，休息 60 秒 → 3 组×12 次，休息 60 秒 | 4.0 s → 3.0 s | 2/2 → 2 | 口吻改写 | 一致：俯卧反向背伸、双腿后抬、臀部高亮（b3 第 3 行） |  |
| h-9090-liftoff | rep_hold | 2 组×每侧8 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 4.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：地面 90/90 坐姿、髋部高亮（b3 第 4 行） |  |
| h-adductor-rock | rep_hold | 2 组×每侧8 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：四点跪一腿侧伸往后坐、大腿内侧高亮（b3 第 5 行） |  |
| h-banana | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧双臂过头、身体侧弯成香蕉、侧腰高亮（b3 第 6 行） |  |
| h-band-biceps-curl | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿踩带弯举、二头肌高亮（b3 第 7 行） |  |
| h-band-chest-fly | rep_hold | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 8.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿单臂弹力带夹胸、胸部高亮（b3 第 8 行） |  |
| h-band-face-pull | rep_hold | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/2 → 1 | 口吻改写 | 一致：站姿弹力带面拉、肩后侧高亮（b3 第 9 行） |  |
| h-band-hip-extension | rep_hold | 2 组×每侧10 次，休息 45 秒 → 2 组×每侧10 次，休息 45 秒 | 4.0 s → 3.2 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、弹力带绑脚踝后伸、臀部高亮（b3 第 10 行） |  |
| h-band-hip-ir | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：坐椅、弹力带绑小腿、脚往外摆、髋外侧/臀高亮（b4 第 1 行） |  |
| h-band-leg-out | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧手拉弹力带套脚、腿抬起往外落、大腿内侧高亮（b4 第 2 行） |  |
| h-band-pallof | rep_hold | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿侧对柱子、双手握带推出、侧腰高亮（b4 第 3 行） |  |
| h-band-pull-apart | rep_hold | 3 组×15 次，休息 30 秒 → 3 组×15 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿双臂平举拉开弹力带、上背/肩后侧高亮（b4 第 4 行） |  |
| h-band-row | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：坐地腿伸直、弹力带套脚划船、背阔高亮（b4 第 5 行） |  |
| h-band-shoulder-ir | rep_hold | 3 组×每侧8 次，休息 30 秒 → 3 组×每侧8 次，休息 30 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿侧对柱子、肘贴身弹力带往里转、胸/肩前高亮（b4 第 6 行） |  |
| h-band-standing-abduction | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、弹力带绑脚踝侧抬、臀外侧高亮（b4 第 7 行） |  |
| h-band-standing-adduction | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、弹力带从外侧拉、大腿内侧高亮（b4 第 8 行） |  |
| h-band-stepout | rep_hold | 3 组×每侧6 次，休息 45 秒 → 3 组×每侧6 次，休息 45 秒 | 8.0 s → 6.0 s | 2/2 → 2 | 口吻改写 | 一致：站姿侧对柱子、双手握带在胸前、侧腰高亮（b4 第 9 行） |  |
| h-band-straight-leg-raise | rep_hold | 2 组×每侧10 次，休息 45 秒 → 2 组×每侧10 次，休息 45 秒 | 4.0 s → 3.2 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、弹力带绑脚踝、直腿前抬、大腿前侧高亮（b4 第 10 行） |  |
| h-band-triceps-pressdown | rep_hold | 3 组×每侧8 次，休息 30 秒 → 3 组×每侧8 次，休息 30 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿侧对柱子、单臂往下压、三头肌高亮（b5 第 1 行） |  |
| h-bear-plank | hold | 3 组×20 秒，休息 30 秒 → 3 组×20 秒，休息 30 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 动作一致：四点跪膝盖悬空；高亮在大腿前侧，文字说练肚子和肩膀（非极端） |  |
| h-bent-knee-calf-raise | rep_updown | 3 组×15 次，休息 30 秒 → 3 组×15 次，休息 30 秒 | 4.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿屈膝提踵、双手叉腰、小腿高亮（b5 第 3 行） |  |
| h-biceps-self | rep_updown | 3 组×每侧6 次，休息 30 秒 → 3 组×每侧6 次，休息 30 秒 | 8.0 s → 6.0 s | 1/1 → 1 | 口吻改写 | 动作一致：站姿一手压另一手自阻弯举；预览帧看不到上臂高亮（非极端）（b5 第 4 行） |  |
| h-bilateral-farmer-hold-native | hold | 3 组×30 秒，休息 45 秒 → 3 组×30 秒，休息 45 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：站姿双手提哑铃、前臂高亮（b5 第 5 行） |  |
| h-bilateral-upper-back-hug | hold | 2 组×30 秒，休息 10 秒 → 2 组×30 秒，休息 10 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：站姿双臂自抱、上背拱；高亮很淡（b5 第 6 行） |  |
| h-bridge-march | rep_alternate | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 2.0 s/侧（一左一右 4.0 s） → 2.0 s/侧（一左一右 4.0 s） | 2/2 → 2 | 口吻改写 | 一致：仰卧臀桥单腿抬起踏步、臀/大腿后高亮（b5 第 7 行） |  |
| h-bridge-overhead | rep_hold | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：仰卧臀桥、双臂过头、臀部高亮（b5 第 8 行） |  |
| h-bulgarian | rep_updown | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s → 4.0 s | 2/3 → 3 | 口吻改写 | 一致：后脚搭椅保加利亚分腿蹲、大腿前/臀高亮（b5 第 9 行） |  |
| h-butterfly-active | rep_updown | 2 组×10 次，休息 20 秒 → 2 组×10 次，休息 20 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：仰卧蝴蝶式、脚掌相对膝外开、大腿内侧高亮（b5 第 10 行） |  |
| h-calf-raise | rep_hold | 3 组×15 次，休息 30 秒 → 3 组×15 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：扶墙站姿提踵、小腿高亮（b6 第 1 行） |  |
| h-catcow-quad | rep_updown | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：四点跪拱背、上背/腰背高亮（b6 第 1–2 行） |  |
| h-chair-dip | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.5 s | 1/2 → 2 | 口吻改写 | 动作一致：背对椅子手撑椅面臂屈伸；高亮在肩前/胸，大臂后面不明显（非极端） |  |
| h-chair-elbow-triceps-stretch | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：双肘搭椅背俯身下沉；高亮在背阔/侧背和大腿后侧，名称写大臂后面（拉伸本身也拉腋下，非极端） |  |
| h-chair-kickback | rep_updown | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿单腿后踢、臀/大腿后高亮（b6 第 5 行） |  |
| h-chair-lat | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：双手搭椅背俯身直臂下沉、背阔高亮（b6 第 6 行） |  |
| h-chair-progressive-front-split-native | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/4 → 3 | 口吻改写 | 一致：扶椅前后劈叉、大腿后侧/髋前高亮（b6 第 7 行） |  |
| h-chair-single-leg-hip-thrust | rep_hold | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 8.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：上背靠椅单腿臀推、臀部高亮（b6 第 8 行） |  |
| h-chair-sit-to-stand | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 8.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：椅子坐站、双臂前伸、大腿前/臀高亮（b6 第 9 行） |  |
| h-chair-step-up | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 4.0 s/侧（一左一右 8.0 s） | 2/3 → 2 | 口吻改写 | 一致：踏上椅子、大腿前高亮（b6 第 10 行） |  |
| h-chair-tspine | rep_hold | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 4.5 s | 1/1 → 1 | 口吻改写 | 动作一致：跪姿双手搭椅、胸口下沉；高亮在腰背，文字说上背（非极端） |  |
| h-close-stance-forward-fold-native | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：并脚站立膝微弯前屈、大腿后侧淡高亮（b7 第 2 行） |  |
| h-cobra | rep_hold | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：俯卧手撑抬起上身（眼镜蛇）、肚子/胯前淡高亮（b7 第 3 行） |  |
| h-couch-stretch | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/3 → 2 | 口吻改写 | 一致：后膝跪地、后脚搭凳（沙发拉伸）、大腿前面高亮（b7 第 4 行） |  |
| h-crossbody | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：站姿一臂横过胸前另一手压住；预览帧几乎无高亮（b7 第 5 行，非极端） |  |
| h-crunch | rep_updown | 3 组×15 次，休息 30 秒 → 3 组×15 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：仰卧屈膝卷腹、肚子淡高亮（b7 第 6 行） |  |
| h-db-calf-raise | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/2 → 1 | 口吻改写 | 一致：站姿双手提哑铃踮脚、小腿高亮（b7 第 7 行） |  |
| h-db-curl | rep_alternate | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.0 s/侧（一左一右 6.0 s） | 1/1 → 1 | 口吻改写 | 一致：站姿哑铃弯举（单臂在上）、大臂前面高亮（b7 第 8 行） |  |
| h-db-floor-fly | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 4.0 s | 1/2 → 1 | 口吻改写 | 一致：仰卧地面哑铃飞鸟、胸部高亮（b7 第 9 行） |  |
| h-db-floor-press | rep_updown | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：仰卧地面哑铃卧推、胸/大臂后面高亮（b7 第 10 行） |  |
| h-db-front-raise | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿双哑铃前平举到肩高、肩前高亮（b8 第 1 行） |  |
| h-db-hammer-curl | rep_updown | 3 组×12 次，休息 30 秒 → 3 组×12 次，休息 30 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿双哑铃锤式弯举、大臂前/小臂高亮（b8 第 2 行） |  |
| h-db-kickback | rep_hold | 3 组×12 次，休息 30 秒 → 3 组×12 次，休息 30 秒 | 8.0 s → 3.5 s | 1/2 → 1 | 口吻改写 | 一致：俯身哑铃臂屈伸、大臂后面高亮（b8 第 3 行） |  |
| h-db-lateral | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿侧平举、肩膀中间高亮（b8 第 4 行） |  |
| h-db-overhead-shrug | rep_hold | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：双臂过头举哑铃耸肩（背面）、上背/斜方高亮（b8 第 5 行） |  |
| h-db-overhead-triceps-extension | rep_hold | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 8.0 s → 4.0 s | 2/2 → 2 | 口吻改写 | 动作一致：站姿单臂过头哑铃臂屈伸；预览帧几乎看不到高亮（b8 第 6 行，非极端） |  |
| h-db-press | rep_updown | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：站姿双哑铃推举过头、肩膀高亮（b8 第 7 行） |  |
| h-db-rdl | rep_updown | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 4.0 s | 2/2 → 2 | 口吻改写 | 一致：哑铃罗马尼亚硬拉俯身、大腿后面高亮（b8 第 8 行） |  |
| h-db-reverse-curl | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿反握弯举、小臂高亮（b8 第 9 行） |  |
| h-db-reverse-fly | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/2 → 2 | 口吻改写 | 一致：俯身哑铃反向飞鸟、上背/肩后高亮（b8 第 10 行） |  |
| h-db-row | rep_updown | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅单臂哑铃划船、背阔高亮（b9 第 1 行） |  |
| h-db-shrug | rep_hold | 3 组×12 次，休息 30 秒 → 3 组×12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 动作一致：站姿双手提哑铃耸肩；预览帧几乎看不到高亮（b9 第 2 行，非极端） |  |
| h-db-split-squat | rep_updown | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s → 4.0 s | 2/3 → 2 | 口吻改写 | 一致：哑铃分腿蹲、前腿大腿前面高亮（b9 第 3 行） |  |
| h-db-supported-calf-raise | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：扶墙单手提哑铃踮脚、小腿高亮（b9 第 4 行） |  |
| h-db-zottman-curl | rep_hold | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 8.0 s → 4.5 s | 2/2 → 2 | 口吻改写 | 一致：站姿哑铃弯举到肩前、小臂高亮（b9 第 5 行） |  |
| h-dd-shoulder | hold | 2 组×30 秒，休息 20 秒 → 2 组×30 秒，休息 20 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 动作一致：下犬式（手撑地、屁股朝天）；高亮在大腿后/小腿后，名称和文字写肩膀、腋下、胸口（b9 第 6 行，非极端） |  |
| h-donkey-kick | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：跪撑屈膝往上蹬、屁股高亮（b9 第 7 行） |  |
| h-doorframe-forearms-pec-native-r3 | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：门框小臂撑门拉胸；预览帧几乎看不到高亮（b9 第 8 行，非极端） |  |
| h-fixed-bar-vertical-pull | rep_hold | 3 组×5 次，休息 90 秒 → 3 组×5 次，休息 90 秒 | 8.0 s → 5.0 s | 3/3 → 3 | 口吻改写 | 一致：单杠悬挂引体、肩/背阔高亮（b9 第 9 行） |  |
| h-floor-nordic-hand-reset | rep_updown | 3 组×5 次，休息 90 秒 → 3 组×5 次，休息 90 秒 | 8.0 s → 5.5 s | 3/4 → 3 | 口吻改写 | 一致：俯卧脚勾凳下、两手撑地（北欧挺撑回）、大腿后面高亮（b9 第 10 行） |  |
| h-forearm-plank | hold | 3 组×30 秒，休息 30 秒 → 3 组×30 秒，休息 30 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 动作一致：前臂平板支撑；高亮在大腿前面，文字写肚子（b10 第 1 行，非极端） |  |
| h-forward-lunge | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 60 秒 | 5.0 s/侧（一左一右 10.0 s） → 3.5 s/侧（一左一右 7.0 s） | 2/2 → 2 | 口吻改写 | 一致：站姿弓步、无器械、大腿前侧+臀部高亮 |  |
| h-goblet-squat | rep_updown | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 4.0 s | 2/2 → 2 | 口吻改写 | 一致：胸前抱壶铃深蹲、大腿前面高亮（b10 第 3 行） |  |
| h-good-morning | rep_updown | 3 组×12 次，休息 30 秒 → 3 组×12 次，休息 30 秒 | 4.0 s → 4.0 s | 1/2 → 1 | 口吻改写 | 动作一致：俯身早安式、大腿后/屁股高亮；画面两手放脑后，原文写「双手交叉放胸前」，已按画面改（b10 第 4 行，非… |  |
| h-half-kneeling-quad-stretch | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/2 → 2 | 口吻改写 | 一致：半跪后手拉后脚、大腿前面高亮（b10 第 5 行） |  |
| h-hip-gate | rep_cycle | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 4.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站姿、髋前侧/外侧高亮、椅子 |  |
| h-incline-pushup | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：手撑椅面斜板俯卧撑、胸/肩前高亮（b10 第 7 行） |  |
| h-inner-thigh | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：侧卧上腿跨到前面、下腿往上抬、大腿内侧高亮（b10 第 8 行） |  |
| h-kb-swing | rep_updown | 3 组×每侧10 次，休息 60 秒 → 3 组×每侧10 次，休息 60 秒 | 2.7 s → 2.0 s | 2/3 → 3 | 口吻改写 | 一致：站姿单手壶铃前摆到胸高、大腿后面淡高亮（b10 第 9 行） |  |
| h-knee-hug | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧抱膝、屁股高亮（b10 第 10 行） |  |
| h-knee-wall-dorsiflexion-native | rep_hold | 2 组×每侧10 次，休息 20 秒 → 2 组×每侧10 次，休息 20 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：面墙前后脚、前膝往前碰墙、小腿高亮（b11 第 1 行） |  |
| h-kneeling-instep-stretch | hold | 2 组×20 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/2 → 1 | 口吻改写 | 一致：跪坐脚背贴地、上身直立、脚背/小腿前面高亮（b11 第 2 行） |  |
| h-kneeling-pushup | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.0 s | 1/2 → 1 | 口吻改写 | 一致：跪姿俯卧撑、胸/大臂后面高亮（b11 第 3 行） |  |
| h-kneeling-thread-needle | rep_hold | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 8.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：四点跪一手从身下穿过、肩后/上背淡高亮（b11 第 4 行） |  |
| h-lateral-step-lunge | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 5.0 s/侧（一左一右 10.0 s） → 3.5 s/侧（一左一右 7.0 s） | 2/2 → 2 | 口吻改写 | 一致：侧弓步、大腿内侧/前面高亮（b11 第 5 行） |  |
| h-mountain-climber | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 1/2 → 2 | 口吻改写 | 一致：高位撑提膝、胯前/肚子高亮（b11 第 6 行） |  |
| h-open-book | rep_hold | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 8.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：侧卧头垫高、上面手臂往后打开、上背/胸高亮（b11 第 7 行） |  |
| h-overhead-triceps-stretch | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：站姿一臂过头屈肘另一手压；预览帧几乎看不到高亮（b11 第 8 行，非极端） |  |
| h-pike-pushup | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.0 s | 2/3 → 3 | 口吻改写 | 一致：屁股朝天倒 V 俯卧撑、肩/大臂高亮（b11 第 9 行） |  |
| h-pike-scapular-elevation | rep_updown | 2 组×6 次，休息 45 秒 → 2 组×6 次，休息 45 秒 | 4.0 s → 3.0 s | 2/2 → 2 | 口吻改写 | 动作一致：倒 V 撑；预览帧几乎看不到高亮（b11 第 10 行，非极端） |  |
| h-plank-side-step | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 2/2 → 2 | 口吻改写 | 一致：高位撑一脚往旁边点地、胯外侧/肚子高亮（b12 第 1 行） |  |
| h-quad-cars | rep_cycle | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 4.1 s → 5.0 s | 2/2 → 2 | 口吻改写 | 动作一致：四点跪抬膝画圈；预览帧几乎看不到高亮（b12 第 2 行，非极端） |  |
| h-quadruped-open | rep_hold | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 8.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 动作一致：四点跪单臂朝天打开；高亮在腰/侧腰，文字写上背、胸口（b12 第 3 行，非极端） |  |
| h-quadruped-rockback | rep_updown | 2 组×10 次，休息 20 秒 → 2 组×10 次，休息 20 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：四点跪往后坐、腰背/大腿高亮（b12 第 4 行） |  |
| h-reverse-clam | rep_hold | 2 组×每侧12 次，休息 20 秒 → 2 组×每侧12 次，休息 20 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：侧卧撑肘、上面的脚往上抬（反蚌式）、屁股侧面高亮（b12 第 5 行） |  |
| h-reverse-crunch | rep_updown | 3 组×12 次，休息 30 秒 → 3 组×12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/2 → 2 | 口吻改写 | 动作一致：仰卧举腿卷屁股；预览帧高亮很淡（b12 第 6 行，非极端） |  |
| h-reverse-lunge | rep_alternate | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.5 s/侧（一左一右 7.0 s） | 1/2 → 2 | 口吻改写 | 一致：后撤弓步、大腿前/屁股高亮（b12 第 7 行） |  |
| h-russian-twist | rep_alternate | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 2.0 s/侧（一左一右 4.0 s） → 2.0 s/侧（一左一右 4.0 s） | 1/2 → 2 | 口吻改写 | 一致：坐姿后仰转体、脚着地、侧腰高亮（b12 第 8 行） |  |
| h-seated-reachback | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐地两手往后撑、胸/肩前高亮（b12 第 9 行） |  |
| h-short-side-plank | hold | 3 组×每侧20 秒，休息 30 秒 → 3 组×每侧20 秒，休息 30 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：侧卧屈膝侧撑；预览帧几乎看不到高亮（b12 第 10 行，非极端） |  |
| h-side-er | rep_updown | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：侧卧屈肘、小臂往上转、肩膀/大臂淡高亮（b13 第 1 行） |  |
| h-side-leg-raise | rep_updown | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.0 s | 1/2 → 1 | 口吻改写 | 动作一致：站姿两手叉腰一腿往旁边抬；预览帧几乎看不到高亮（b13 第 2 行，非极端） |  |
| h-slider-body-saw | rep_updown | 2 组×6 次，休息 45 秒 → 2 组×6 次，休息 45 秒 | 4.0 s → 4.0 s | 3/3 → 3 | 口吻改写 | 一致：直臂撑、脚踩滑盘、肚子淡高亮（b13 第 3 行） |  |
| h-squat | rep_updown | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：两手前伸深蹲、大腿前/屁股高亮（b13 第 4 行） |  |
| h-standing-arm-extension-stretch | rep_hold | 2 组×5 次，休息 15 秒 → 2 组×5 次，休息 15 秒 | 8.0 s → 6.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿两臂往后伸、胸/肩前高亮（b13 第 5 行） |  |
| h-standing-forearm-rotation | rep_updown | 2 组×每侧10 次，休息 20 秒 → 2 组×每侧10 次，休息 20 秒 | 4.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿屈肘转小臂、小臂高亮（b13 第 6 行） |  |
| h-standing-wrist-deviation | rep_updown | 2 组×每侧10 次，休息 20 秒 → 2 组×每侧10 次，休息 20 秒 | 4.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿屈肘、手腕往两边摆、小臂高亮（b13 第 7 行） |  |
| h-standing-wrist-extensor-stretch | rep_hold | 2 组×每侧5 次，休息 15 秒 → 2 组×每侧5 次，休息 15 秒 | 8.0 s → 6.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿一臂前伸、手腕往下弯、小臂高亮（b13 第 8 行） |  |
| h-step-jack | rep_alternate | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.0 s/侧（一左一右 4.0 s） | 1/1 → 1 | 口吻改写 | 一致：站姿开合步、两手举过头、肩/大臂外侧高亮（b13 第 9 行） |  |
| h-straight-arm-hang-native | hold | 3 组×20 秒，休息 60 秒 → 3 组×20 秒，休息 60 秒 | 计时 → 计时 | 2/2 → 2 | 口吻改写 | 一致：单杠直臂悬挂、小臂/大臂高亮（b13 第 10 行） |  |
| h-suitcase-hold | hold | 3 组×每侧30 秒，休息 30 秒 → 3 组×每侧30 秒，休息 30 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：站姿单手提哑铃、侧腰高亮（b14 第 1 行） |  |
| h-suitcase-march | rep_alternate | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 2/2 → 2 | 口吻改写 | 一致：单手提哑铃原地踏步、侧腰高亮（b14 第 2 行） |  |
| h-sumo-pry | rep_hold | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 5.5 s | 1/2 → 2 | 口吻改写 | 动作一致：宽站相扑深蹲、两手合十肘推膝；预览帧几乎看不到高亮（b14 第 3 行，非极端） |  |
| h-superman | rep_hold | 3 组×10 次，休息 30 秒 → 3 组×10 次，休息 30 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：俯卧手腿一起抬、腰背高亮（b14 第 4 行） |  |
| h-supine-bilateral-leg-raise | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 8.0 s → 4.0 s | 2/3 → 3 | 口吻改写 | 一致：仰卧两腿一起抬起、肚子下/胯前淡高亮（b14 第 5 行） |  |
| h-supine-cactus-chest | rep_hold | 2 组×5 次，休息 15 秒 → 2 组×5 次，休息 15 秒 | 8.0 s → 6.0 s | 1/1 → 1 | 口吻改写 | 一致：仰卧屈膝、手臂仙人掌摆地、胸口高亮（b14 第 6 行） |  |
| h-supine-heel-slide | rep_updown | 2 组×每侧10 次，休息 20 秒 → 2 组×每侧10 次，休息 20 秒 | 8.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：仰卧屈膝滑脚跟、膝盖/大腿前淡高亮（b14 第 7 行） |  |
| h-supine-twist | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧屈膝倒向一侧、手臂打开、侧腰/胸高亮（b14 第 8 行） |  |
| h-supported-single-leg-calf | rep_updown | 3 组×每侧10 次，休息 30 秒 → 3 组×每侧10 次，休息 30 秒 | 4.0 s → 3.0 s | 2/2 → 2 | 口吻改写 | 一致：扶墙单腿踮脚、小腿高亮（b14 第 9 行） |  |
| h-tabletop | rep_hold | 3 组×10 次，休息 30 秒 → 3 组×10 次，休息 30 秒 | 4.0 s → 3.5 s | 1/2 → 2 | 口吻改写 | 一致：反向桌式（面朝上手撑地、屁股抬平）、胸/肩前高亮（b14 第 10 行） |  |
| h-tib-raise | rep_updown | 3 组×15 次，休息 30 秒 → 3 组×15 次，休息 30 秒 | 4.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 一致：背靠墙勾脚尖、小腿前面高亮（b15 第 1 行） |  |
| h-towel-behind | rep_hold | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿背后握毛巾抬臂、肩前/胸高亮（b15 第 2 行） |  |
| h-towel-isometric-curl | hold | 3 组×15 秒，休息 30 秒 → 3 组×15 秒，休息 30 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：站姿脚踩毛巾两手往上拉、大臂前高亮；预览帧手臂接近伸直（可能是起始帧），文字写手肘直角（b15 第 3 行… |  |
| h-towel-pass | rep_updown | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 8.0 s → 4.5 s | 1/2 → 1 | 口吻改写 | 一致：两手握毛巾举过头、肩/胸高亮（b15 第 4 行） |  |
| h-towel-pulldown | rep_updown | 3 组×10 次，休息 30 秒 → 3 组×10 次，休息 30 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：两手举毛巾往下拉到头后（背面）、背阔高亮（b15 第 5 行） |  |
| h-unsupported-star-reach-native | rep_updown | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 2.7 s → 2.5 s | 2/3 → 2 | 口吻改写 | 一致：单腿站、另一脚往外点地、大腿/屁股淡高亮（b15 第 6 行） |  |
| h-wall-angel | rep_updown | 2 组×8 次，休息 30 秒 → 2 组×8 次，休息 30 秒 | 4.0 s → 3.5 s | 1/2 → 2 | 口吻改写 | 动作一致：背靠墙两臂举起；高亮在胸口/侧身，文字写上背和肩膀（b15 第 7 行，非极端） |  |
| h-wall-calf | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：扶墙后腿伸直拉小腿、小腿高亮（b15 第 8 行） |  |
| h-wall-calf-bent-knee | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：扶墙屈膝拉小腿、小腿高亮（b15 第 9 行） |  |
| h-wall-palm-lift | rep_hold | 1 组×每侧5 次，休息 15 秒 → 1 组×每侧5 次，休息 15 秒 | 8.0 s → 6.0 s | 1/1 → 1 | 口吻改写 | 一致：面对墙一手指尖贴墙抬掌根、小臂淡高亮（b15 第 10 行） |  |
| h-wall-pec | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：侧对墙一臂往后贴墙与肩同高；预览帧几乎看不到高亮（b16 第 1 行，非极端） |  |
| h-wall-straddle | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧两腿贴墙分开成 V、大腿内侧淡高亮（b16 第 2 行） |  |
| h-wall-wrist-flexor-stretch | hold | 2 组×每侧20 秒，休息 15 秒 → 2 组×每侧20 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：侧对墙手掌贴墙手指朝上、小臂高亮（b16 第 3 行） |  |
| hamstrings-A | rep_updown | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s → 4.0 s | 1/3 → 2 | 口吻改写 | 一致：单腿罗马尼亚硬拉、后腿抬起、大腿后面高亮（b16 第 4 行） |  |
| hamstrings-B | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 4.0 s | 2/3 → 3 | 口吻改写 | 一致：仰卧屈膝抬屁股、脚跟踩滑盘、大腿后淡高亮（b16 第 5 行） |  |
| hamstrings-C | rep_updown | 3 组×4 次，休息 90 秒 → 3 组×4 次，休息 90 秒 | 8.0 s → 6.0 s | 3/4 → 3 | 口吻改写 | 一致：GHD 上脚勾住往前倒、大腿后高亮（b16 第 6 行） |  |
| hip-abductors-A | rep_updown | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 4.0 s → 3.0 s | 2/3 → 3 | 口吻改写 | 动作一致：侧撑、上腿抬起、屁股侧面高亮；画面是直臂手撑地，文字写小臂撑（b16 第 7 行，非极端） |  |
| hip-abductors-B | rep_hold | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 4.5 s | 1/2 → 1 | 口吻改写 | 基本一致：仰卧两腿举起分开、弹力带在两脚之间；高亮不明显（b16 第 8 行，非极端） |  |
| hip-abductors-C | rep_hold | 3 组×12 次，休息 60 秒 → 3 组×12 次，休息 60 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 动作一致：坐姿器械两腿往外推；高亮很淡（b16 第 9 行，非极端） |  |
| hip-flexors-A | rep_hold | 3 组×8 次，休息 45 秒 → 3 组×8 次，休息 45 秒 | 4.0 s → 4.0 s | 2/3 → 3 | 口吻改写 | 动作一致：坐地腿伸直、上身前倾、两手撑在腿旁、胯前高亮（b16 第 10 行） |  |
| hip-flexors-B | rep_hold | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 4.0 s → 4.0 s | 1/2 → 1 | 口吻改写 | 一致：扶墙站姿、弹力带绑脚抬膝、胯前淡高亮（b17 第 1 行） |  |
| hip-flexors-C | rep_updown | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：站姿绳索绑脚踝直腿前抬、胯前高亮（b17 第 2 行） |  |
| lats-A | rep_hold | 3 组×8 次，休息 45 秒 → 3 组×8 次，休息 45 秒 | 4.0 s → 4.0 s | 2/2 → 2 | 口吻改写 | 一致：坐地腿伸直、两手撑身旁把屁股撑起、背阔高亮（b17 第 3 行） |  |
| lats-B | rep_hold | 3 组×12 次，休息 45 秒 → 3 组×12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：站姿弹力带直臂下拉、背阔高亮（b17 第 4 行） |  |
| lats-C | rep_hold | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/3 → 3 | 口吻改写 | 一致：双杠直臂撑（背面）、背阔高亮（b17 第 5 行） |  |
| n-chair-wiper | rep_alternate | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 1/1 → 1 | 口吻改写 | 动作一致：坐椅、一膝往里倒；高亮很淡（b17 第 6 行，非极端） |  |
| n-half-split | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 一致：半跪前腿伸直、两手扶砖、大腿后高亮（b17 第 7 行） |  |
| n-leg-circles | rep_cycle | 2 组×每侧4 次，休息 30 秒 → 2 组×每侧4 次，休息 30 秒 | 8.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：仰卧单腿抬起画圈、胯前高亮（b17 第 8 行） |  |
| n-pelvis-circle | rep_cycle | 2 组×8 次，休息 20 秒 → 2 组×8 次，休息 20 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿叉腰胯画圈、胯/屁股高亮（b17 第 9 行） |  |
| n-prone-hip-ext | rep_hold | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：俯卧屈膝往上抬腿、屁股高亮（b17 第 10 行） |  |
| n-prone-ir | rep_hold | 2 组×8 次，休息 30 秒 → 2 组×8 次，休息 30 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：俯卧两小腿往两边倒、屁股高亮（b18 第 1 行） |  |
| n-seated-ir-drop | rep_alternate | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.0 s/侧（一左一右 6.0 s） | 1/1 → 1 | 口吻改写 | 一致：坐地后撑、一膝往里倒、胯外侧淡高亮（b18 第 2 行） |  |
| n-seated-knee-lift | rep_alternate | 2 组×每侧8 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.0 s/侧（一左一右 6.0 s） | 1/1 → 1 | 口吻改写 | 一致：坐椅抬膝、大腿前/胯前高亮（b18 第 3 行） |  |
| n-seated-squeeze | rep_hold | 2 组×10 次，休息 30 秒 → 2 组×10 次，休息 30 秒 | 4.0 s → 7.0 s | 1/1 → 1 | 口吻改写 | 一致：坐椅两膝夹砖、大腿内侧高亮（b18 第 4 行） |  |
| n-slider-lateral | rep_updown | 2 组×每侧8 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 动作一致：站姿一脚踩滑盘往旁边滑；预览帧几乎看不到高亮（b18 第 5 行，非极端） |  |
| n-squat-shift | rep_alternate | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 4.0 s/侧（一左一右 8.0 s） | 2/2 → 2 | 口吻改写 | 一致：宽蹲往一边移、大腿内侧淡高亮（b18 第 6 行） |  |
| n-straddle-fold | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 动作一致：坐地分腿前屈、两手扶砖；预览帧几乎看不到高亮（b18 第 7 行，非极端） |  |
| n-thomas-test | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧抱一膝、另一腿平放、胯前高亮（b18 第 8 行） |  |
| n-wide-fold | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：宽站俯身、两手扶椅、大腿内侧/后侧高亮（b18 第 9 行） |  |
| n-windshield | rep_alternate | 2 组×每侧6 次，休息 20 秒 → 2 组×每侧6 次，休息 20 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.0 s/侧（一左一右 6.0 s） | 1/1 → 1 | 口吻改写 | 一致：仰卧屈膝两膝左右倒（雨刷）、屁股/胯高亮（b18 第 10 行） |  |
| o-chair-knee-extension | rep_hold | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 8.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：坐椅一腿伸直、大腿前面高亮（b19 第 1 行） |  |
| o-seated-calf-raise | rep_updown | 2 组×15 次，休息 30 秒 → 2 组×15 次，休息 30 秒 | 4.0 s → 2.5 s | 1/1 → 1 | 口吻改写 | 动作一致：坐椅踮脚跟；高亮看着在小腿前面，动作练小腿后面（b19 第 2 行，非极端） |  |
| o-seated-catcow | rep_cycle | 2 组×6 次，休息 20 秒 → 2 组×6 次，休息 20 秒 | 8.0 s → 5.0 s | 1/1 → 1 | 口吻改写 | 一致：坐办公椅拱背、腰背高亮（b19 第 3 行） |  |
| o-seated-fig4 | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 动作一致：坐椅翘腿前倾；预览帧几乎看不到高亮（b19 第 4 行，非极端） |  |
| o-seated-ham | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐椅前沿一腿伸直前倾、大腿后淡高亮（b19 第 5 行） |  |
| o-seated-hip-er | rep_hold | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 动作一致：坐椅一脚往里摆；预览帧几乎看不到高亮（b19 第 6 行，非极端） |  |
| o-seated-sidebend | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐椅一臂举过头侧弯、侧腰高亮（b19 第 7 行） |  |
| o-seated-twist | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐椅转身扶椅背、侧腰高亮（b19 第 8 行） |  |
| o-stand-crossreach | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：站姿扶椅一臂过头侧弯、后腿交叉、胯外侧高亮（b19 第 9 行） |  |
| o-stand-ham | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：扶椅前脚伸直勾脚、俯身、大腿后/小腿高亮（b19 第 10 行） |  |
| o-stand-lunge | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：扶椅前后分腿、胯前高亮（b20 第 1 行） |  |
| o-stand-quad | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：扶椅手拉脚、大腿前面高亮（b20 第 2 行） |  |
| o-stand-sidebend | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：站姿一臂过头侧弯、侧腰高亮（b20 第 3 行） |  |
| o-supported-ankle-eversion | rep_hold | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 8.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 动作一致：扶椅单脚悬空翻脚；预览帧几乎看不到高亮（b20 第 4 行，非极端） |  |
| o-supported-ankle-inversion | rep_hold | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 8.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：扶椅单脚悬空翻脚、小腿前/外侧高亮（b20 第 5 行） |  |
| o-supported-ankle-pump | rep_cycle | 2 组×每侧8 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 8.0 s → 2.4 s | 1/1 → 1 | 口吻改写 | 一致：扶椅一脚悬空勾绷脚、小腿高亮（b20 第 6 行） |  |
| o-supported-hip-airplane | rep_hold | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 8.0 s → 5.0 s | 2/2 → 2 | 口吻改写 | 一致：扶椅单腿前倾、后腿伸直、屁股/胯高亮（b20 第 7 行） |  |
| o-supported-hip-hitch | rep_hold | 1 组×每侧4 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 8.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅单腿站、另一边胯提起、屁股侧面高亮（b20 第 8 行） |  |
| o-supported-hip-ir | rep_hold | 1 组×每侧6 次，休息 30 秒 → 2 组×每侧8 次，休息 30 秒 | 8.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：扶椅单腿站、抬起的腿小腿往外摆、屁股侧面高亮（b20 第 9 行） |  |
| o-supported-knee-curl | rep_updown | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 8.0 s → 3.0 s | 1/1 → 1 | 口吻改写 | 一致：扶椅站、小腿往后弯、大腿后面高亮（b20 第 10 行） |  |
| o-supported-march | rep_alternate | 2 组×每侧10 次，休息 30 秒 → 2 组×每侧10 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 1/1 → 1 | 口吻改写 | 一致：扶椅抬膝、胯前/大腿高亮（b21 第 1 行） |  |
| o-supported-mini-squat | rep_updown | 2 组×10 次，休息 30 秒 → 2 组×10 次，休息 30 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 一致：扶椅浅蹲、大腿前面高亮（b21 第 2 行） |  |
| o-supported-single-leg-rdl | rep_updown | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 4.0 s → 4.0 s | 1/2 → 1 | 口吻改写 | 一致：扶椅单腿前倾、后腿抬起、大腿后面高亮（b21 第 3 行） |  |
| o-supported-star-reach | rep_updown | 2 组×每侧6 次，休息 30 秒 → 2 组×每侧6 次，休息 30 秒 | 2.7 s → 2.5 s | 2/2 → 1 | 口吻改写 | 一致：扶椅单腿微蹲、另一脚往外点地、大腿前/内侧高亮（b21 第 4 行） |  |
| o-wall-hip-hinge-stretch | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：两手推墙、屁股往后、上身放平、背/腋下高亮（b21 第 5 行） |  |
| obliques-A | rep_alternate | 3 组×每侧6 次，休息 45 秒 → 3 组×每侧6 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 2.5 s/侧（一左一右 5.0 s） | 2/3 → 3 | 口吻改写 | 一致：熊爬一腿穿到身下、一手朝天、侧腰高亮（b21 第 6 行） |  |
| obliques-B | rep_hold | 3 组×每侧10 次，休息 45 秒 → 3 组×每侧10 次，休息 45 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿侧对柱子、两手握把推出、侧腰高亮（b21 第 7 行） |  |
| obliques-C | rep_updown | 3 组×每侧8 次，休息 60 秒 → 3 组×每侧8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 一致：站姿绳索高位往下斜拉（伐木）、侧腰高亮（b21 第 8 行） |  |
| quadriceps-A | rep_updown | 3 组×6 次，休息 60 秒 → 3 组×6 次，休息 60 秒 | 4.0 s → 4.0 s | 2/3 → 3 | 口吻改写 | 一致：跪姿上身往后倒、大腿前面高亮（b21 第 9 行） |  |
| quadriceps-B | rep_hold | 3 组×每侧15 次，休息 45 秒 → 3 组×每侧15 次，休息 45 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：站姿弹力带套膝后伸膝、大腿前面高亮（b21 第 10 行） |  |
| quadriceps-C | rep_hold | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 8.0 s → 5.0 s | 1/2 → 1 | 口吻改写 | 一致：器械坐姿伸腿、大腿前面高亮（b22 第 1 行） |  |
| rotator-cuff-A | rep_alternate | 3 组×每侧8 次，休息 45 秒 → 3 组×每侧8 次，休息 45 秒 | 2.0 s/侧（一左一右 4.0 s） → 2.0 s/侧（一左一右 4.0 s） | 1/2 → 2 | 口吻改写 | 动作一致：高位平板（俯视）、肩膀高亮（b22 第 2 行） |  |
| rotator-cuff-B | rep_hold | 3 组×每侧12 次，休息 45 秒 → 3 组×每侧12 次，休息 45 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 动作一致：站姿侧对柱子、手肘贴身弹力带往外转；高亮很淡（b22 第 3 行，非极端） |  |
| rotator-cuff-C | rep_updown | 3 组×每侧10 次，休息 60 秒 → 3 组×每侧10 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 动作一致：站姿绳索、大臂抬平小臂朝上；预览帧几乎看不到高亮（b22 第 4 行，非极端） |  |
| s-9090 | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 一致：地面 90/90 坐、上身前倾、屁股/胯高亮（b22 第 5 行） |  |
| s-butterfly | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐地蝴蝶式两脚掌相对、大腿内侧高亮（b22 第 6 行） |  |
| s-figure4 | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：仰卧四字、屁股高亮（b22 第 7 行） |  |
| s-frog | hold | 2 组×45 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 3/3 → 3 | 口吻改写 | 一致：青蛙趴、两膝分开小臂撑地、大腿内侧淡高亮（b22 第 8 行） |  |
| s-kneel-hipflex | hold | 2 组×每侧30 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：半跪弓步、两手叉腰、胯前高亮（b22 第 9 行） |  |
| s-lizard | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/2 → 2 | 口吻改写 | 一致：蜥蜴式低弓步两手撑在前脚内侧、胯前/大腿内侧淡高亮（b22 第 10 行） |  |
| s-pigeon | hold | 2 组×每侧45 秒，休息 15 秒 → 2 组×每侧30 秒，休息 15 秒 | 计时 → 计时 | 2/3 → 2 | 口吻改写 | 一致：鸽子式、双手扶两块瑜伽砖、前侧胯下有垫；高亮只在前腿臀部（purpose 还写后腿大腿根前面），非极端 |  |
| s-seated-fold | hold | 2 组×30 秒，休息 15 秒 → 2 组×30 秒，休息 15 秒 | 计时 → 计时 | 1/1 → 1 | 口吻改写 | 一致：坐地两腿伸直往前折、大腿后淡高亮（batch-23 第 2 行） |  |
| scapular-A | rep_updown | 2 组×9 次，休息 45 秒 → 2 组×9 次，休息 45 秒 | 2.7 s → 2.5 s | 1/2 → 1 | 口吻改写 | 一致：俯卧手臂抬起、上背高亮（batch-23 第 3 行） |  |
| scapular-B | rep_hold | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 3.5 s | 2/3 → 2 | 口吻改写 | 一致：单杠悬挂（背面）、上背/斜方高亮（batch-23 第 4 行） |  |
| serratus-A | rep_updown | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 2.5 s | 1/2 → 2 | 口吻改写 | 一致：高位平板、侧肋淡高亮（batch-23 第 5 行） |  |
| serratus-B | rep_hold | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 4.0 s | 1/1 → 1 | 口吻改写 | 一致：面墙、小臂贴泡沫轴往上滑、侧肋淡高亮（batch-23 第 6 行） |  |
| serratus-C | rep_updown | 3 组×6 次，休息 90 秒 → 3 组×6 次，休息 90 秒 | 4.0 s → 4.5 s | 3/4 → 3 | 口吻改写 | 动作一致：吊环低位俯卧撑；预览帧看不到高亮（batch-23 第 7 行，非极端） |  |
| t-flare-side-hold | hold | 3 组×每侧10 秒，休息 60 秒 → 3 组×每侧10 秒，休息 60 秒 | 计时 → 计时 | 3/4 → 3 | 口吻改写 | 一致：单手单脚侧撑、上腿抬起上手朝天、侧腰/胯高亮（batch-23 第 8 行） |  |
| t-lsit-open-close | rep_updown | 3 组×6 次，休息 60 秒 → 3 组×6 次，休息 60 秒 | 4.0 s → 2.5 s | 3/4 → 3 | 口吻改写 | 一致：手撑地两腿分开离地、大腿内侧/胯前高亮（batch-23 第 9 行） |  |
| t-lsit-tuck | rep_updown | 3 组×6 次，休息 60 秒 → 3 组×6 次，休息 60 秒 | 4.0 s → 2.5 s | 3/4 → 3 | 口吻改写 | 一致：坐地手撑、腿伸直（L 撑）、肚子高亮（batch-23 第 10 行） |  |
| t-lsit-vsit-circles | rep_cycle | 3 组×4 次，休息 60 秒 → 3 组×4 次，休息 60 秒 | 5.0 s → 5.0 s | 3/5 → 3 | 口吻改写 | 一致：坐地手撑、两腿离地（V 撑画圈）、肚子高亮（batch-24 第 1 行） |  |
| t-lsit-wide | hold | 3 组×10 秒，休息 60 秒 → 3 组×10 秒，休息 60 秒 | 计时 → 计时 | 3/4 → 3 | 口吻改写 | 基本一致：手撑 L 撑、两腿抬起、肚子/胯前高亮；侧面这帧看不出两腿分多宽（batch-24 第 2 行，非极端） |  |
| t-seated-straddle-ext | rep_updown | 3 组×8 次，休息 45 秒 → 3 组×8 次，休息 45 秒 | 2.0 s → 2.5 s | 2/3 → 3 | 口吻改写 | 一致：分腿坐、两手撑身前、肚子高亮（batch-24 第 3 行） |  |
| t-seated-straddle-lift-1leg | rep_alternate | 3 组×每侧4 次，休息 45 秒 → 3 组×每侧4 次，休息 45 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.5 s/侧（一左一右 7.0 s） | 2/2 → 2 | 口吻改写 | 一致：分腿坐、指尖在一条腿两边、胯前高亮（batch-24 第 4 行） |  |
| t-seated-straddle-lifts | rep_updown | 3 组×8 次，休息 45 秒 → 3 组×8 次，休息 45 秒 | 2.0 s → 2.5 s | 2/3 → 3 | 口吻改写 | 一致：分腿坐两手撑中间、胯前淡高亮（batch-24 第 5 行） |  |
| t-straddle-hold | hold | 3 组×10 秒，休息 60 秒 → 3 组×10 秒，休息 60 秒 | 计时 → 计时 | 3/4 → 3 | 口吻改写 | 一致：分腿撑起、肚子/胯前高亮（batch-24 第 6 行） |  |
| t-tuck-planche | hold | 3 组×8 秒，休息 90 秒 → 3 组×8 秒，休息 90 秒 | 计时 → 计时 | 3/4 → 3 | 口吻改写 | 一致：团身手撑前倾、胸/肩高亮（batch-24 第 7 行） |  |
| t-vsit | hold | 3 组×8 秒，休息 60 秒 → 3 组×8 秒，休息 60 秒 | 计时 → 计时 | 3/5 → 3 | 口吻改写 | 一致：V 撑两腿高抬、肚子高亮（batch-24 第 8 行） |  |
| triceps-A | rep_updown | 3 组×8 次，休息 60 秒 → 3 组×8 次，休息 60 秒 | 4.0 s → 4.3 s | 1/3 → 3 | 口吻改写 | 一致：窄距俯卧撑、大臂后淡高亮（batch-24 第 9 行） |  |
| triceps-B | hold | 4 组×15 秒，休息 60 秒 → 3 组×15 秒，休息 60 秒 | 计时 → 计时 | 2/3 → 3 | 口吻改写 | 动作一致：平行杆直臂撑团身；预览帧看不到高亮（batch-24 第 10 行，非极端） |  |
| triceps-C | rep_updown | 3 组×5 次，休息 90 秒 → 3 组×5 次，休息 90 秒 | 4.0 s → 4.0 s | 3/4 → 3 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-bird-dog | rep_hold | 3 组×每侧8 次，休息 30 秒 → 3 组×每侧8 次，休息 30 秒 | 4.0 s → 4.5 s | 1/2 → 1 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-chair-hip-thrust | rep_hold | 3 组×10 次，休息 60 秒 → 3 组×10 次，休息 60 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-clamshell | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-dead-bug | rep_alternate | 3 组×每侧6 次，休息 30 秒 → 3 组×每侧6 次，休息 30 秒 | 4.0 s/侧（一左一右 8.0 s） → 3.5 s/侧（一左一右 7.0 s） | 1/2 → 1 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-feet-on-chair-bridge | rep_hold | 3 组×10 次，休息 45 秒 → 3 组×10 次，休息 45 秒 | 4.0 s → 3.5 s | 1/2 → 2 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-fire-hydrant | rep_hold | 3 组×每侧12 次，休息 30 秒 → 3 组×每侧12 次，休息 30 秒 | 4.0 s → 3.5 s | 1/1 → 1 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-prone-swimmer | rep_updown | 3 组×8 次，休息 45 秒 → 3 组×8 次，休息 45 秒 | 4.0 s → 3.5 s | 2/2 → 2 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |
| w-wall-sit | hold | 3 组×30 秒，休息 45 秒 → 3 组×30 秒，休息 45 秒 | 计时 → 计时 | 1/2 → 2 | 口吻改写 | 待 V4 补看（batch-25 预览未出） |  |

## 极端错误（画面与文字牛头不对马嘴）

- 暂无

## 渲染侧复核清单（高亮部位与文字不符，只报告，不改模型）

（开哥 2026-11-14 按推荐：文字按真实动作写，高亮不符只在这里汇总，交渲染侧复核；不改模型/动画/渲染。）

| id | 画面高亮 | 文字/名称练的部位 | 预览帧 |
|---|---|---|---|
| adductors-B | 动作是直臂手撑地侧撑（文字写前臂撑地），大腿内侧高亮 | 前臂侧撑、大腿内侧 | b1 第 5 行 |
| h-bear-plank | 大腿前侧 | 肚子、肩膀 | b5 第 2 行 |
| h-chair-elbow-triceps-stretch | 背阔/侧背、大腿后侧 | 大臂后面 | b6 第 4 行 |
| h-chair-tspine | 腰背 | 上背 | b7 第 1 行 |
| h-dd-shoulder | 大腿后/小腿后 | 肩膀、腋下、胸口 | b9 第 6 行 |
| h-forearm-plank | 大腿前面 | 肚子 | b10 第 1 行 |
| h-quadruped-open | 腰/侧腰 | 上背、胸口 | b12 第 3 行 |
| h-wall-angel | 胸口、侧身 | 上背、肩膀 | b15 第 7 行 |
| hip-abductors-A | 动作是直臂手撑地侧撑（文字写小臂撑），屁股侧面高亮 | 小臂侧撑、屁股侧面 | b16 第 7 行 |
| o-seated-calf-raise | 小腿前面 | 小腿后面（坐姿提踵） | b19 第 2 行 |
