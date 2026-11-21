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
