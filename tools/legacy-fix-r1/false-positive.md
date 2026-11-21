# 旧动作修复 r1 · 误报记录（不修）

## h-floor-nordic-hand-reset 地面北欧离心及手撑复位（第 1 批 #2，2026-11-21，Hark-QUA）

清单：S1 knee-valgus「负重屈膝腿膝盖比脚尖方向往内偏 180°（右腿，屈膝 90°）」；S2 knee-out-of-toe 180°（左腿）；S2 foot-hover 16 mm（右脚）。

看图（audit.mjs 正/侧/顶/背/裆部特写，f60/f120/f180 = 25/50/75%）：跪姿，大腿竖直、小腿和脚背平贴垫子，脚跟勾在矮凳下，脚尖朝后；
躯干从直立前倾到手撑地再推回，是标准的跪姿北欧挺。腿本身的检查全部正常：thighFace/shinFace ≤0.2°、膝铰链偏离 ≤0.3°、
footVsKnee 不报（脚尖与膝朝向一致）、左右对称差 0.1 cm。

为什么是误报：knee-valgus / knee-out-of-toe 是给「脚踩地、膝负重」的站姿屈膝写的（膝的屈曲方向应与脚尖同向）。
跪姿时负重在膝和小腿上，小腿水平朝后，膝的屈曲方向朝前下、脚尖朝后，两者天然相差 180°——这正是正确的跪姿，不是膝内扣。
analyze.py 用 `pelvisH < 0.35` 排除跪/坐姿，这个动作骨盆在上身直立时高于 0.35 m，所以没被排除。
foot-hover 16 mm：脚跟勾在凳子下（固定物），脚尖略离垫是勾脚的正常状态，且只是 S2。

处理：不修。建议 hark-sk 在 analyze.py 的「负重屈膝膝 vs 脚尖」判定里，把小腿近水平且膝/小腿着地（minY shin < 15 mm）的帧视为跪姿排除，避免同类误报。
对照图：沙箱 `/workspace/work/legacy-fix/b1/h-floor-nordic-hand-reset_cmp.jpg`。

## o-supported-march 扶椅站姿交替抬膝（第 3 批 #1，2026-11-21，Hark-QUA）

清单（REPORT @6ac5b21，P0 文不对题）：S1 text-no-switch「文字/参数要求左右换边，视频里没有左右切换（最接近镜像姿态仍差 15 cm）」；评审备注「看图 25%/75% 都是同一侧抬膝」。

实测（`audit-cf1.mjs --crotchfix on`，原配方 `catalog/production/remaining219-r1/recipes/o-supported-march.json` → `o-supported-march-et1-kn1.js`，stride 10）：
- f20–f110：**右膝**抬起（右膝角 175°→108°，右脚离地最高 113.9 mm，右大腿离竖直 49°），左腿站直（175°、左脚 0.2 mm 贴地）；
- f140–f230：**左膝**抬起（左膝角 108°，左脚离地 113.9 mm，左大腿 49°），右腿站直；两侧高度、时长、缓动逐值镜像。
- spec 本身也写明：`rightLift` 0.3–3.7 s、`leftLift` 4.3–7.7 s 交替，左右脚踝/pole 轨道数值镜像。
- 看图（f60 / f180 正面 + 产品镜头 520 px）：f60 画面左侧那只脚（人的右脚）抬起，f180 靠椅子那只脚（人的左脚）抬起；左手始终扶椅背、右手自然下垂。
  侧视图（从 +X 看）两帧几乎一样，因为近侧腿和远侧腿投影重叠，这大概就是评审「同一侧」的来源。

为什么是误报：text-no-switch 用「最接近镜像姿态」判换边，要求全身镜像距离 <阈值；本动作支撑手（左手扶椅）按文案「一只手扶稳椅背」全程不换，
上身天然不对称，所以腿已完全镜像、全身仍差 15 cm。动作与文案（「两条腿轮流慢慢抬膝」「左膝抬一次、右膝抬一次，合起来记 1 下」「一只手扶稳椅背」）一致。

处理：不修，原配方/spec/文字未动。第 3 批样片卡仍把它按原配方出一条样片，供 hark-sk / 开哥直接看换边。
建议 hark-sk 在 analyze.py 的 text-no-switch 里只比较下肢（或排除标准里写明「支撑手不换」的手臂），避免扶椅/扶墙类同型误报。
（备注，非本条问题：抬膝高度较低——大腿离竖直约 49°、脚离地约 11 cm；文案写「抬到舒服的高度」，不算错。）
对照图：沙箱 `/workspace/work/legacy-fix/b3/o-supported-march_cmp.jpg`。

## 第 5 批分诊误报（2026-11-21，Hark-QUA；逐条理由见 TRIAGE-b5.md，图与 dump 在沙箱 /workspace/work/legacy-fix/b5/）

全部为 FINDINGS-LIVE「P2 明显不准」条目，`audit-cf2.mjs --crotchfix r2` 重测 + 看图后判定，不修。按误报类型：

1. **跪姿后腿 knee-out-of-toe ≈180°**（小腿贴地、脚尖朝后，膝屈曲方向与脚尖天然相反；同 h-floor-nordic）：
   h-kneeling-instep-stretch、n-half-split、s-kneel-hipflex、h-chair-progressive-front-split-native、s-lizard。
2. **弓步/分腿蹲 squat-heel-up**（规则把后腿也当「屈膝负重腿」；逐帧前脚脚跟 0 mm，离地的是本应前脚掌着地的后脚）：
   h-reverse-lunge（后脚 157 mm）、h-db-split-squat（111 mm）、h-forward-lunge（67 mm）。
3. **坐/躺/四足、髋大幅旋转或腿近伸直时的 thighFace / shinFace / kneeAxisDev / footVsKnee**（看正面+裆部特写，膝、小腿外形自然；
   三项数值几乎相同 = 髌骨、胫骨、脚彼此一致，是髋转动被记到膝上，或屈膝角太小屈膝平面不稳）：
   needs-check 15 个中的 14 个 —— h-inner-thigh、h-russian-twist、n-seated-ir-drop、s-butterfly（仅膝；手腕另修 b5a）、h-butterfly-active、h-9090-liftoff、
   h-band-leg-out、n-windshield、h-hip-gate（抬起的不负重腿）、n-straddle-fold、h-quad-cars、h-wall-straddle、s-pigeon、s-lizard（同 1）；
   另有同型未标 NC 的 h-seated-reachback、s-figure4、s-frog、w-fire-hydrant（均压线 1–5°）。h-sumo-pry 的 NC 条目判为真（站姿负重，见分诊表）。
4. **坐椅/半跪前腿的 knee-inside-foot / knee-valgus**（腿不负重或负重很小，正面看膝在脚上方，多为 4–6 cm 压线）：
   o-seated-ham（valgus）、o-seated-catcow、o-seated-calf-raise、o-seated-fig4、forearms-B、h-couch-stretch、h-half-kneeling-quad-stretch、deltoids-C、
   s-kneel-hipflex（前腿）；o-stand-crossreach（扶椅交叉腿站，交叉是动作内容，4 cm 压线）；h-chair-dip knee-out-of-toe 37°（小腿近竖直时水平投影不稳，正/顶视膝对脚尖）。
5. **asymmetry：文案本身就是单侧/分腿/交替**：abs-B（「一条腿往前伸直，两条腿轮流」）、h-db-supported-calf-raise（「一手扶墙一手拿哑铃」）、
   h-doorframe-forearms-pec-native-r3（「前后脚站稳」）、h-bilateral-upper-back-hug（双臂交叉一上一下）。
6. **text-reps-static / text-hold-moving 规则局限**：规则只比较相对骨盆的关节位置——
   整体升降的动作（h-db-calf-raise 骨盆升 86 mm、scapular-B 66 mm、lats-C 75 mm、h-bent-knee-calf-raise 30 mm）、
   只有转动的动作（h-tib-raise 脚 28°、h-standing-forearm-rotation 120°、h-standing-wrist-deviation ±12°、h-standing-wrist-extensor-stretch 40°、
   o-supported-ankle-eversion 20° / inversion 12° / pump 30°、forearms-B 腕 100°）、幅度本就小的（h-wall-palm-lift、h-pike-scapular-elevation、n-seated-squeeze 等长）；
   h-supine-cactus-chest 仰卧时骨盆朝向退化为 0（双手实际相对骨盆移动 248 mm）；forearms-C「倒握壶铃行走」走动就是内容。
   **注意：h-db-shrug、h-db-overhead-shrug 不是误报**——V5 全身位移/转角实测为 0，耸肩确实没显示，列为真问题。
7. **地面取了道具顶面**：h-supine-cactus-chest floor-penetration ×8（除头外全身一致低 16–19 mm = 头下垫块顶面当地面）。
8. **工作腿当支撑腿**：adductors-C foot-hover 24 mm（悬空的是做内收摆动的左腿，支撑右脚 0 mm）。

建议 hark-sk 改 analyze.py：squat-heel-up 只判前脚；text-reps-static 用世界坐标并计入骨骼转角；仰卧时 mirror_pose 骨盆朝向退化处理；
asymmetry 读文案里的单侧支撑/分腿/交替；ROM 三项在屈膝 <30° 或三项同值时降级。
