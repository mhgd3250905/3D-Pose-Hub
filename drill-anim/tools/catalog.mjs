// Read-only drill catalog: summarise every specs/*.js with its App usage, SHA registration and known issues.
//
//   node drill-anim/tools/catalog.mjs                 # writes docs/drill-catalog.md
//   node drill-anim/tools/catalog.mjs --out -         # print to stdout instead
//   node drill-anim/tools/catalog.mjs --json out.json # also dump the rows as JSON
//   node drill-anim/tools/catalog.mjs --check         # check Markdown and any --json output; write nothing
//
// Sources (all read-only): specs/*.js (imported, never rendered), data/drills.json (FlareLab App 51),
// data/home-pr-candidates.json and verify.mjs (registered SHA-256), media/manifest.json and
// media/releases/*.sources.json (published HipLab media and revision bindings),
// batches/training-human-v2-20261013/job-catalog.json (2026-10-13 library + recorded limitations),
// plus the curated KNOWN / PLANNED tables below, each line citing the doc it was taken from.
// It never renders, never edits specs, and only writes the --out / --json files.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL, fileURLToPath} from 'node:url';

const tool = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tool, '..');          // drill-anim/
const repo = path.resolve(root, '..');           // repo root
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : (process.argv[i + 1] ?? ''); };
const outArg = arg('--out');
const out = outArg === '-' ? '-' : path.resolve(outArg ?? path.join(repo, 'docs/drill-catalog.md'));
const jsonOut = arg('--json');
const checkOnly = process.argv.includes('--check');

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const textSha = p => createHash('sha256').update(fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')).digest('hex');

// ---------- sources ----------
const drills = readJson(path.join(root, 'data/drills.json'));
const groupLabel = Object.fromEntries(Object.entries(drills.groups).map(([k, v]) => [k, v.label]));
Object.assign(groupLabel, {biceps: '肱二头肌', calves: '小腿三头肌', tibialis: '胫骨前肌'});
const flare = new Map();                      // FlareLab App 51 (17 groups x A/B/C)
for (const tiers of Object.values(drills.drills)) for (const d of Object.values(tiers)) flare.set(d.id, d);

const candidates = readJson(path.join(root, 'data/home-pr-candidates.json')).specs;
const verifySrc = fs.readFileSync(path.join(root, 'verify.mjs'), 'utf8');
const inlineReg = new Map([...verifySrc.matchAll(/'([\w.-]+\.js)':\s*\{pr:(\d+),\s*sha256:'([0-9a-f]{64})'/g)].map(m => [m[1], {pr: +m[2], sha256: m[3]}]));
const baseCommit = (verifySrc.match(/const source = '([0-9a-f]{40})'/) || [])[1];
let baseline = null;                          // the original 59 specs, pinned by git object (needs full history)
if (baseCommit) {
  const ls = spawnSync('git', ['ls-tree', '--name-only', baseCommit, 'drill-anim/specs/'], {cwd: repo, encoding: 'utf8', windowsHide: true});
  if (ls.status === 0) baseline = new Set(ls.stdout.trim().split(/\r?\n/).map(f => path.basename(f)));
}

const manifest = readJson(path.join(repo, 'media/manifest.json'));
const releases = {};                          // version -> { status, ids: Map(id -> Set(spec paths)), theme }
for (const [ver, rel] of Object.entries(manifest.releases || {})) {
  const ids = new Map(); const themes = new Set();
  for (const it of rel.items || []) {
    if (!ids.has(it.id)) ids.set(it.id, new Set());
    if (it.spec?.path) ids.get(it.id).add(it.spec.path);
    if (it.theme?.path) themes.add(it.theme.path);
  }
  releases[ver] = {status: rel.status, ids, themes: [...themes]};
}
const relDir = path.join(repo, 'media/releases');
for (const f of fs.existsSync(relDir) ? fs.readdirSync(relDir) : []) {
  const m = f.match(/^(.+)\.sources\.json$/); if (!m || !releases[m[1]]) continue;
  const src = readJson(path.join(relDir, f));
  for (const [id, o] of Object.entries(src.specOverrides || {})) {
    const p = typeof o === 'string' ? o : (o.path || o.spec?.path || o.specPath);
    if (p && releases[m[1]].ids.has(id)) releases[m[1]].ids.get(id).add(p);
  }
}
// spec file -> [{ver, id, status}] : which published/draft media item binds this exact spec file
const boundBy = new Map();
for (const [ver, r] of Object.entries(releases)) for (const [id, paths] of r.ids) for (const p of paths) {
  const file = path.basename(p);
  if (!boundBy.has(file)) boundBy.set(file, []);
  boundBy.get(file).push({ver, id, status: r.status});
}

const jobCatalogPath = path.join(root, 'batches/training-human-v2-20261013/job-catalog.json');
const lib1013 = new Map();
if (fs.existsSync(jobCatalogPath)) for (const j of readJson(jobCatalogPath).jobs) lib1013.set(j.id, j);
const BOILER = [/^Frozen mature spec is available/, /^No local previous complete movie/, /^Calls the real original/, /^Original runtime source/];
const libNote = j => {
  if (!j) return [];
  const notes = [];
  for (const l of j.knownLimitations || []) {
    if (BOILER.some(r => r.test(l))) continue;
    const w = l.match(/^Historical preview warnings: (\{.*\})$/);
    if (w) { try { const o = JSON.parse(w[1]); if (o.solver_warning_frames) notes.push(`10-13库：历史预览求解警告 ${o.solver_warning_frames} 帧（已视觉认可）`); } catch { /* keep going */ } continue; }
    notes.push(`10-13库：${l.length > 110 ? l.slice(0, 107) + '…' : l}`);
  }
  return notes;
};

// ---------- curated, doc-sourced tables ----------
// HipLab self-assessment stills (not in a media ZIP; the App ships webp stills). docs/hiplab-phase1-drills-2026-10-16.md §3,
// drill-anim/revisions/hiplab-media-fix-20261017/README.md (r2 replaced 9090 / deep squat / thomas).
const HIPLAB_STILLS = {
  'a-butterfly': 'HipLab 自测静图', 'a-seated-fold': 'HipLab 自测静图', 'a-supine-cross': 'HipLab 自测静图',
  'a-9090-r2': 'HipLab 自测静图（替代 a-9090）', 'a-deep-squat-r2': 'HipLab 自测静图（替代 a-deep-squat）', 'a-thomas-r2': 'HipLab 自测静图（替代 a-thomas）',
  'a-9090': '原版，App 已换 r2', 'a-deep-squat': '原版，App 已换 r2', 'a-thomas': '原版，App 已换 r2',
};
const D = {
  p1: 'docs/hiplab-phase1-drills-2026-10-16.md', fix: 'drill-anim/revisions/hiplab-media-fix-20261017/README.md',
  soft: 'docs/soft-highlight-2026-10-18.md', rel: 'media/releases/0.1.0.md', h51: 'docs/home-drills-51-plan-2026-10-15.md',
  lib: 'docs/training-media-library-2026-10-13.md', h4080: 'docs/drill-anim/hark-4080-v1.md', erb: 'docs/erectors-B-footfix-2026-10-13.md',
  t3: 'docs/thomas-app-model-v3-2026-10-12.md', pr105: 'drill-anim/pr105-audit-2026-10-12.md',
  hse: 'docs/home-small-equipment-2026-10-18.md', hpc: 'docs/home-posterior-chain-2026-10-18.md',
};
const KNOWN = {
  'h-overhead-triceps-stretch-rr1': ['096：085第一修复轮第2次，肘角与真实掌面接触修复；站姿轻柔过头肱三头拉伸，稀疏QA待GPU。历史085失败不覆盖。docs/096-repair-r1-overhead-triceps-stretch-2026-10-22.md'],
  'h-band-straight-leg-raise': ['band-straight-leg-raise-34：居家后置弹力带长杠杆髋屈，膝基本固定；区别屈膝高抬膝与健身房绳索，低分保留待GPU（docs/band-straight-leg-raise-34-2026-10-19.md）'],
  'h-band-chest-fly': ['band-chest-fly-28：轻屈肘固定的单臂弹力带水平内收；独立握持/带路/足底接触检查，低分保留待GPU，需稳固胸高锚点', 'docs/band-chest-fly-28-2026-10-19.md'],
  'h-db-shrug': ['dumbbell-shrug-29：双哑铃肩带上提35mm；上斜方肌目标无独立高亮，实际足底/握持/肩部网格检查，低分保留待GPU', 'docs/dumbbell-shrug-29-2026-10-19.md'],
  'h-db-front-raise': ['dumbbell-front-raise-30：双哑铃固定软肘肩屈曲前举；区别侧平举/过头推举/耸肩，实际足底握持器械避让检查，低分保留待GPU', 'docs/dumbbell-front-raise-30-2026-10-19.md'],
  'h-standing-wrist-deviation': ['wrist-deviation-31：固定前臂掌面内腕侧偏；区别屈伸和旋前旋后，实际手骨皮肤轨迹与足底分布检查，低分保留待GPU', 'docs/wrist-deviation-31-2026-10-19.md'],
  'h-band-triceps-pressdown': ['band-triceps-pressdown-27：单臂高位弹力带伸肘；实际握柄/D环/足底分布独立检查；低分保留待GPU，需稳固锚点', 'docs/band-triceps-pressdown-27-2026-10-19.md'],
  'h-db-split-squat': ['dumbbell-leg-14：双哑铃原地分腿蹲；前脚全掌、后脚前足固定地面，左侧示范；低分抽查保留待GPU，非普通办公（docs/dumbbell-leg-14-2026-10-18.md）'],
  'h-db-calf-raise': ['dumbbell-leg-14：双脚双哑铃站姿提踵；实际鞋底前端支点，负荷变式非新运动模式；低分抽查保留待GPU（docs/dumbbell-leg-14-2026-10-18.md）'],
  'h-wall-wrist-flexor-stretch': ['home-wrist-stretch-18：站姿墙面单一腕伸，区别于跪姿多向腕摇摆；真实掌面接触分布检查通过，低分保留待GPU（docs/home-wrist-stretch-18-2026-10-18.md）'],
  'h-standing-forearm-rotation': ['forearm-rotation-23：屈肘约90°，前臂真实骨与网格轴向旋前/旋后±60°；非腕屈伸或肩外旋；办公低负荷控制，低分保留待GPU（docs/forearm-rotation-23-2026-10-18.md）'],
  'o-supported-knee-curl': ['supported-knee-curl-22：扶椅站姿徒手屈膝，髋固定、膝15–80°低负荷控制；区别髋后踢和踝泵；低分保留待GPU（docs/supported-knee-curl-22-2026-10-18.md）'],
  'h-band-shoulder-ir': ['band-shoulder-ir-26：外侧锚点弹力带肩内旋，区别既有卸载内旋回程及前臂旋转；低分保留待GPU（docs/band-shoulder-ir-26-2026-10-19.md）'],
  'o-supported-ankle-eversion': ['supported-ankle-eversion-25：扶椅悬空足外翻12°再回中立；腓骨长短肌低负荷控制，固定模型无独立高亮故不误标胫前肌；低分保留待GPU（docs/supported-ankle-eversion-25-2026-10-19.md）'],
  'o-supported-ankle-inversion': ['supported-ankle-inversion-24：扶椅悬空足内翻12°后回中立；真实足骨/鞋网格转动而胫骨不转，非踝泵屈伸；低分保留待GPU（docs/supported-ankle-inversion-24-2026-10-18.md）'],
  'h-plank-side-step': ['plank-side-step-54：固定双掌的交替侧点地，骨盆朝地；120时点接触与稀疏QA；刚性鞋尖窄接触，待GPU（docs/plank-side-step-54-2026-10-20.md）'],
  'o-supported-star-reach': ['supported-star-reach-53：固定单脚下浅屈膝，另一脚前/侧/后轻点地；120时点真实接触与13帧稀疏QA；待GPU（docs/supported-star-reach-53-2026-10-20.md）'],
  'o-supported-hip-hitch': ['supported-hip-hitch-45：单腿承重额状面骨盆提拉6度，胸廓直立；轻扶椅背、真实足底分布及120时点核验；待GPU（docs/supported-hip-hitch-45-2026-10-19.md）'],
  'o-supported-hip-ir': ['supported-hip-ir-36：站姿轻扶椅背，固定大腿与膝中心主动髋内旋；股骨/胫骨/足整体旋转，非踝内外翻；办公低负荷控制，待GPU全片（docs/supported-hip-ir-36-2026-10-19.md）'],
  'o-supported-ankle-pump': ['supported-ankle-pump-21：扶椅轻触平衡、固定髋膝的悬空踝屈伸；低负荷主动活动控制，区别于承重提踵/靠墙勾脚；低分保留待GPU（docs/supported-ankle-pump-21-2026-10-18.md）'],
  'h-standing-wrist-extensor-stretch': ['home-wrist-extensor-20：站姿无承重主动腕屈，拉伸腕伸肌；办公单向基础式，区别018腕伸与跪姿多向摇摆；低分保留待GPU（docs/home-wrist-extensor-20-2026-10-18.md）'],
  'h-supported-single-leg-calf': ['supported-calf-15：扶墙单腿提踵；左足承重、右足离地；条件办公需稳墙与基础能力；低分抽查保留待GPU（docs/supported-calf-15-2026-10-18.md）'],
  'h-db-overhead-triceps-extension-rr1': ['094：082第一修复轮第1次，保持原目标和轨迹；握位轴修正，稀疏QA待GPU。历史082失败不覆盖。docs/094-repair-r1-overhead-triceps-2026-10-22.md'],
  'h-lateral-step-lunge': ['078：短步侧跨落地后转移负重再蹬回，非直腿侧弓/内收肌长位拉伸；两次实现后保留稀疏QA待GPU（docs/078-v2plus-lateral-step-lunge-2026-10-21.md）'],
  'h-db-supported-calf-raise': ['supported-calf-15：单手哑铃扶墙双脚提踵；补原计划单手扶墙意图，014双哑铃版保留；条件办公需墙与器械净空；低分抽查保留待GPU（docs/supported-calf-15-2026-10-18.md）'],
  'h-band-standing-abduction': ['band-hip-sides-13：扶椅弹力带站姿外展；独立可靠固定低位锚点，胫骨踝扣，约5–24°外展；低分抽查通过待GPU，非普通办公（docs/band-hip-sides-13-2026-10-18.md）'],
  'h-band-standing-adduction': ['band-hip-sides-13：家用弹力带站姿内收；右腿前方通过中线，约25°屈髋避开支撑鞋；低分抽查通过待GPU，椅子不是锚点（docs/band-hip-sides-13-2026-10-18.md）'],
  'g-cable-hip-extension': ['cable-hip-12：低位绳索髋后伸；踝扣绑定胫骨，右髋8–20°后伸，左脚/左掌轻扶支撑；低分抽查通过待GPU全片，非普通办公（docs/cable-hip-12-2026-10-18.md）'],
  'g-cable-hip-abduction': ['cable-hip-12：低位绳索髋外展；滑轮左前方，右髋5–24°外展并轻度屈髋避开支撑腿；低分抽查通过待GPU，非普通办公（docs/cable-hip-12-2026-10-18.md）'],
  'h-quad-cars': [`v0.1.0 绑定 r2；v0.2.0 已用原规格和 soft-v1 发布（${D.soft}）`, `flickscan 小腿/鞋底纹 169 坏帧，既有问题（${D.fix}）`],
  'h-quad-cars-r2': [`v0.1.0 高亮仅部分修复（拼面板 glutes+gluteMed+oblique）；soft-v1 下腰侧多一团，v0.2.0 已改用原规格和 soft-v1 发布（${D.soft}）`, `flickscan 163 坏帧，位于鞋底纹（${D.fix}）`],
  's-seated-fold-r3': [`63 条历史腕部可达范围警告保留（${D.rel}）`],
  's-seated-fold': [`v2 原片 f154→155 手跳约 30 mm（${D.lib}）`],
  'a-deep-squat-r2': [`glow-B 下几乎无青色高亮（臀肌朝后）（${D.fix}）`],
  'a-thomas-r2': [`glow-B 下 hip-flexors 只亮一个小点（${D.fix}）`],
  'glute-max-A': [`glow-B 下几乎看不到高亮，v0.2.0 已用 soft-v1 发布并改善（${D.soft}）`],
  'hip-flexors-A': [`glow-B 下几乎看不到高亮，v0.2.0 已用 soft-v1 发布并改善（${D.soft}）`],
  'n-leg-circles': [`求解器提示 29 帧，指标全过（${D.p1}）`],
  'n-seated-squeeze': [`原计划“夹拳+外推”改为夹砖，外推半部分未做（${D.p1}）`, `2 vCPU/SwiftShader 预览 >75 s 不出第一帧，原因未查（docs/onboarding-audit-2026-10-18.md）`],
  'n-seated-ir-drop': [`替代未完成的 n-9090-ir-lean（${D.p1}）`],
  'h-wall-pec': [`PR #112 作者 QA 右肘报警（${D.h51}）`],
  'h-kb-swing': [`单臂版：双手握同一提手时两只拳头重叠，改单臂（${D.hse}）`],
  'h-band-row': [`propscan 8 坏帧是两根弹力带互相扫过，不是 z-fighting（${D.hse}）`],
  'h-band-pallof': [`obliques-B 的 training-human-v2 重做，推到顶 z 0.4356→0.431（${D.hse}）`],
  'h-good-morning': [`双手交叉抱胸（手放脑后时手网格贴不到刚性头部后侧），手不做 touch 吸附，掌心离胸约 1–5 mm（${D.hpc}）`],
  'h-bridge-march': [`第 0 帧即保持中的臀桥（只教踏步，不教起桥）；右掌比左掌靠脚 5 mm，让右肘 ≥170°（qa 肘向判据按站姿 +Z）（${D.hpc}）`],
  'h-chair-step-up': [`用无靠背椅（back: 0）；构图按站上椅面的最高姿态放置（stillAt 2.2），所以 still.png 不是起始站姿（${D.hpc}）`],
  'erectors-B': [`用户认可的鞋向修正在 revisions/erectors-B-footfix-20261013，本 spec 单独不是完整配方（${D.erb}）`],
  'hip-abductors-B': [`hark-4080-v1 修订 240 帧求解警告保留（${D.h4080}）`],
  'deltoids-B': [`只到高桥的半程土耳其起立；支撑肘与垫约 10.31 mm 间隙（${D.h4080}）`],
  's-9090': [`hark-4080-v1 文档称本 spec 偏前屈拉伸，真正左右换髋的 s-9090-switch 只在 revisions/hark-4080-v1（${D.h4080}）`],
  't-half-straddle': [`用户已停止制作，保留历史，不恢复渲染（${D.t3}）`],
  't-tuck-planche': [`原构图手机成片裁边，另存恒定构图派生（${D.lib}）`],
  't-lsit-vsit-circles': [`原构图手机成片裁边，另存恒定构图派生（${D.lib}）`],
  'o-seated-calf-raise': ['office-calf-squat-05：屈膝坐位低负荷提踵；实际前足网格锚点另查，双股座面近接触0.7–4.12mm，待GPU全片（docs/office-calf-squat-05-2026-10-18.md）'],
  'h-suitcase-hold': ['rockback-hold-09：单手静态提握抗侧屈；居家小器械，有哑铃/安全空间才适合办公；低分抽查通过待GPU（docs/rockback-hold-09-2026-10-18.md）'],
  'h-donkey-kick': ['floor-glute-07：非办公地面；右膝约90°矢状面后踢，短垫承托双掌/左膝；低分抽查通过待GPU（docs/floor-glute-07-2026-10-18.md）'],
  'o-supported-single-leg-rdl': ['office-support-06：右掌扶稳椅背、左腿支撑髋铰链；近接触1.57mm，待GPU全片（docs/office-support-06-2026-10-18.md）'],
  'o-supported-mini-squat': ['office-calf-squat-05：双掌扶60cm宽稳椅高背、浅幅动态蹲；双掌网格与背板间隙1.62mm，待GPU全片（docs/office-calf-squat-05-2026-10-18.md）'],
  'o-seated-catcow': [`人体无独立颈屈，头随上躯干刚性（${D.lib}）`],
};
// Planned in docs but no spec under specs/: the pool of "待补全" candidates.
const PLANNED = [
  {"id": "h-kneeling-instep-stretch-v2plus", "name": "跪姿脚背支撑拉伸", "why": "086两次用尽：足背承托未成立，最终仅脚尖缘近地且双胫穿地15.43mm；FAILED待接手，不登记不第三次", "src": "docs/086-v2plus-instep-stretch-FAILED-diagnostic-2026-10-21.md"},
  {"id": "h-overhead-triceps-stretch-v2plus", "name": "站姿过头肱三头肌拉伸（新版尝试）", "why": "085两次用尽：左腕限位已消除但工作肘26–28度折叠过深、辅助手接触过冲未解决；FAILED交接，不注册不第三次，不恢复旧019", "src": "docs/085-v2plus-triceps-stretch-FAILED-diagnostic-2026-10-21.md"},
  {"id": "h-sleeper-stretch", "name": "侧卧睡姿肩内旋拉伸", "why": "084两次用尽，头垫间隙8.24mm、替代垫与躯干重叠58.08mm及辅助手接触过冲；FAILED交接不注册不第三次", "src": "docs/084-v2plus-sleeper-stretch-FAILED-diagnostic-2026-10-21.md"},
  {"id": "h-db-floor-fly", "name": "哑铃地板飞鸟", "why": "083两次用尽，后脑仍离垫29.46mm、真实手杆穿入约3.68mm；FAILED留接手，不登记不第三次", "src": "docs/083-v2plus-floor-fly-FAILED-diagnostic-2026-10-21.md"},
  {id:"h-db-overhead-triceps-extension",name:"单臂哑铃过头臂屈伸",why:"082：两次实现后肘60.90→153.48度、肘点漂移1.40mm、无警告；杆仍有5个真实手顶点穿入超过2mm，最深2.15845mm，FAILED留接手不第三次",src:"docs/082-v2plus-overhead-triceps-FAILED-diagnostic-2026-10-21.md"},
  {id:"h-towel-isometric-curl",name:"毛巾脚锚等长弯举（带状道具示意）",why:"081：两次实现用尽；最终双肘100.43度无警告但手与6mm半径示意带末端仍2.759mm间隙，8mm内0接触顶点；FAILED交接不登记不第三次",src:"docs/081-v2plus-towel-isometric-curl-FAILED-diagnostic-2026-10-21.md"},
  {id:"h-short-side-plank",name:"屈膝短杠杆前臂侧平板（新版尝试）",why:"080：针对新limbs网格重评旧016；两次后膝50mm区域最低2.663mm，2mm内0点、3mm仅4点9.59×9.06mm，仍为边缘近接触；FAILED-diagnostic交接不登记不第三次",src:"docs/080-v2plus-short-side-plank-FAILED-diagnostic-2026-10-21.md"},
  {id:"h-band-face-pull",name:"站姿弹力带面拉",why:"079：v2plus两次实现用尽，最终姿态警报已消除但带中心线每侧每帧穿手部真实三角面2–6处；FAILED-diagnostic留接手团队，不登记不第三次",src:"docs/079-v2plus-band-face-pull-FAILED-diagnostic-2026-10-21.md"},
  {id:"h-kneeling-pushup",name:"跪姿俯卧撑",why:"077：v2plus两次实现用尽；第二版髋线改善但真实膝区穿地9.26mm、全局10.39mm，FAILED-diagnostic留接手团队，不登记不第三次",src:"docs/077-v2plus-kneeling-pushup-FAILED-diagnostic-2026-10-21.md"},
  {id: "h-goblet-squat-r2", name: "高脚杯深蹲新版托握", why: "075：v2plus两次实现后掌部仍穿入哑铃轴14.29mm及上端头18.23mm；FAILED-diagnostic停止未登记，留接手团队处理，不作第三次", src: "docs/075-v2plus-goblet-FAILED-diagnostic-2026-10-21.md"},
  {"id": "h-overhead-triceps-stretch", "name": "站姿过头肱三头肌拉伸", "why": "019两轮修正后辅助左手对右上臂径向穿入指标仍−5.85mm；停止未登记，不计完成；需新接触参考再开", "src": "docs/home-triceps-stretch-19-2026-10-18.md"},
  {"id": "h-dead-bug-heel-tap", "name": "死虫式脚跟点地", "why": "017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成", "src": "docs/remaining-pose-bases-17-2026-10-18.md"},
  {"id": "h-supine-pelvic-tilt", "name": "仰卧骨盆前后倾", "why": "017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成", "src": "docs/remaining-pose-bases-17-2026-10-18.md"},
  {"id": "h-supine-active-ham", "name": "仰卧主动腘绳肌拉伸", "why": "017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成", "src": "docs/remaining-pose-bases-17-2026-10-18.md"},
  {"id": "h-strap-supine-ham", "name": "仰卧带辅助直腿拉伸", "why": "017：共享仰卧底座两轮后头/背/臀承托与前臂穿地未同时解决；blocked，整组停止，不计完成", "src": "docs/remaining-pose-bases-17-2026-10-18.md"},
  {"id": "s-9090-switch-new", "name": "90/90左右换髋新规格", "why": "017：真左右换髋关键姿态两轮后端点臀仍悬空且大腿穿地；blocked，不登记，不计完成", "src": "docs/remaining-pose-bases-17-2026-10-18.md"},
  {id:'g-cable-knee-curl',name:'绳索站姿腿弯举',why:'curl-sideplank-16：胫骨扣不同于010脚随动带；两次修正后绳路虽清除，但扣边圆环仍穿胫骨约2.50mm/顶点鞋约2.22mm，停止不登记',src:'docs/curl-sideplank-16-2026-10-18.md'},
  {id:'h-short-side-plank',name:'屈膝短杠杆侧平板',why:'curl-sideplank-16：前臂与中段侧胫接近地面，但真实膝部50mm邻域仍悬空12.52mm；两次修正后静态门槛失败，头本来悬空不是失败原因，停止不登记',src:'docs/curl-sideplank-16-2026-10-18.md'},
  {id:'h-band-seated-hip-er',name:'坐椅弹力带髋外旋',why:'band-hip-knee-10：撤回初评；实际臀/工作侧大腿悬空，只有左大腿接近座前缘，未形成可靠坐姿承托；停止未登记。既有o-seated-hip-er同姿势列待复核，不改旧spec',src:'docs/band-hip-knee-10-2026-10-18.md'},
  {id:'h-band-standing-knee-curl',name:'扶椅弹力带屈膝',why:'band-hip-knee-10：身体/扶椅合格但两轮绑带修正后顶点带路仍与右鞋相交，停止未登记，不计完成',src:'docs/band-hip-knee-10-2026-10-18.md'},
  {id:'h-quadruped-rockback',name:'四足中立背后坐',why:'rockback-hold-09：初稿及两次修正后直臂/可达不能同时满足，停止未登记，不计完成；膝掌接触本身已分别验证',src:'docs/rockback-hold-09-2026-10-18.md'},
  {id:'h-side-lying-hip-abduction',name:'侧卧直腿外展',why:'floor-hip-knee-08：两轮后托头手穿头6.57mm、短裤穿地20.4mm及可达告警，停止未登记，不计完成',src:'docs/floor-hip-knee-08-2026-10-18.md'},
  {id:'h-prone-knee-curl',name:'俯卧徒手屈膝',why:'floor-hip-knee-08：两轮后头手穿插33.87–38.84mm、前臂穿地4.5mm且大腿/膝悬空，停止未登记，不计完成',src:'docs/floor-hip-knee-08-2026-10-18.md'},
  {id:'o-wall-forearm-plank',name:'站姿扶墙前臂支撑',why:'office-support-06：两轮后掌接触近似成立，肘部网格距墙仍5.66mm，停止未登记，不计完成',src:'docs/office-support-06-2026-10-18.md'},
  {id: 'o-chair-adductor-stretch / o-chair-wide-adductor-stretch', name: '坐椅宽膝内收肌拉伸（侧移/前倾候选）', why: 'office-adductor-back-03：侧移目标机制不充分且手撑座不可达；前倾版两轮座面修正仍有5–7.5mm大腿穿座，撤下未登记；由o-seated-hip-er顺延补位', src: 'docs/office-adductor-back-03-2026-10-18.md'},
  {id: 'o-seated-knee-hug', name: '坐椅单膝抱近胸', why: 'office-hip-leg-02两轮修正后手腕可达/手贴小腿仍不可信，撤下；由坐椅侧伸替补，不计完成，待接触条件解决', src: 'docs/office-hip-leg-02-2026-10-18.md'},
  {id: 'n-9090-ir-lean', name: '90/90 向后腿侧倾（被动内旋末端）', why: '两轮后手掌贴垫/腰弯 ≤45° 做不到，暂以 n-seated-ir-drop 代替；需模型手部/腰部改进', src: D.p1},
  {id: '（无 id）坐姿夹砖“外推”半部分', name: '坐姿膝外推（弹力带版）', why: '手掌放膝内侧会陷入大腿，改夹砖；文档建议以后做弹力带版', src: D.p1},
  {id: 's-9090-switch', name: '90/90 左右换髋', why: '最终修订只在 drill-anim/revisions/hark-4080-v1/s-9090-switch/，specs/ 下无同名 spec，未进 verify 契约', src: D.h4080},
  {id: '（道具）', name: '引体杆/泡沫轴/瑞士球/地雷杆/绳索等道具复核', why: 'drill-anim/README 写“未写/未验证”，但 specs 已在用 pullupBar、foamRoller、swissBall、landmine、cableStack —— README 道具一节过时，需逐个复核穿模', src: 'drill-anim/README.md#props'},
  {id: 'h-goblet-squat', name: '哑铃高脚杯深蹲', why: '双掌托哑铃头的握法 2 轮以上仍不可信（手掌张平、和哑铃有缝），本批放弃，由 h-db-reverse-fly 补位；需模型手部改进', src: D.hse},
  {id: '（h-* 51 项接入）', name: '居家/肌群补充/开胯/开肩 51 项', why: '源码已审，作者成片/QA 未取回，未注册任何 App（被 HipLab v0.1.0 选中的除外）', src: D.h51},
];

// ---------- categories ----------
const CATS = [
  {key: 'g', title: 'g-* 健身房补充（cable-hip-12；非普通办公）', test: id => id.startsWith('g-')},
  {key: 'flare', title: 'FlareLab 肌群动作（17 肌群 × A 徒手 / B 家用 / C 健身房）', test: id => /^[a-z-]+-[ABC]$/.test(id)},
  {key: 's', title: 's-* 拉伸（原 8 项 + 修订）', test: id => id.startsWith('s-')},
  {key: 't', title: 't-* 托马斯专项（Flare，PR #106）', test: id => id.startsWith('t-')},
  {key: 'o', title: 'o-* 办公室（PR #97–104 + office-hip-leg-02 + office-adductor-back-03 + office-knee-march-04 + office-calf-squat-05 + office-support-06）', test: id => id.startsWith('o-')},
  {key: 'w', title: 'w-* 久坐强化（PR #105）', test: id => id.startsWith('w-')},
  {key: 'h', title: 'h-* 居家/肌群补充/开胯/开肩/小器械力量/徒手后链/办公下肢候选（PR #111–115 + r2 + Pose-Hub PR #5、#6 + office-lower-body-01）', test: id => id.startsWith('h-')},
  {key: 'n', title: 'n-* HipLab 开胯 MVP 新增（PR #119）', test: id => id.startsWith('n-')},
  {key: 'a', title: 'a-* HipLab 自测对比静图（PR #119 + r2）', test: id => id.startsWith('a-')},
];
const catOf = id => (CATS.find(c => c.test(id)) || {key: 'other'}).key;

// ---------- rows ----------
const SCENE = {mat: '垫', chair: '椅', officeChair: '办公椅', wall: '墙', band: '弹力带', bandPost: '弹力带', anchor: '锚点',
  parallettes: '平行杆', dipBars: '双杠', rings: '吊环', pullupBar: '单杠', bench: '凳', dumbbell: '哑铃', kbBottomsUp: '壶铃', kettlebell: '壶铃',
  cableStack: '绳索', cable: '绳索', dHandle: '单柄', ankleStrap: '脚踝扣', landmine: '地雷杆', swissBall: '瑞士球', foamRoller: '泡沫轴',
  sliders: '滑垫', romanChair: '罗马椅', ghd: 'GHD', reverseHyper: '反向背伸机', hipAbductor: '髋外展机', legExtension: '腿屈伸机'};
const ignoreProps = new Set(['gripHand', 'grip']);
const files = fs.readdirSync(path.join(root, 'specs')).filter(f => f.endsWith('.js')).sort();
const specIds = new Set(files.map(f => f.slice(0, -3)));
const rows = [];
for (const file of files) {
  const abs = path.join(root, 'specs', file);
  const {default: s} = await import(pathToFileURL(abs).href);
  const fileId = file.slice(0, -3);
  const rev = fileId.match(/^(.*)-(r\d+)$/);
  const original = rev && specIds.has(rev[1]) ? rev[1] : null;
  const baseId = original || fileId;
  const fps = s.fps || 30;
  const hl = s.highlight || {};
  const groups = (hl.groups || []).map(g => groupLabel[g] || g);
  if (!groups.length && hl.panels?.length) groups.push(`面板 ${hl.panels.join('/')}`);
  const scene = [...new Set((s.props || []).filter(p => !ignoreProps.has(p.type)).map(p => SCENE[p.type] || p.type))];
  const sha = textSha(abs);
  let reg = '✗ 未登记';
  if (baseline?.has(file)) reg = '基线 59（git）';
  else if (candidates[file]) {
    const c = candidates[file], tag = c.pr ? `PR #${c.pr}` : `已登记（${c.sourceBatch || 'home-pr-candidates'}）`;
    reg = c.sha256 === sha ? tag : `${tag} ⚠ 哈希不符`;
  }
  else if (inlineReg.has(file)) reg = inlineReg.get(file).sha256 === sha ? `PR #${inlineReg.get(file).pr}（verify.mjs）` : '⚠ 哈希不符';
  else if (!baseline) reg = '? 无 git 历史';
  const used = [];
  if (flare.has(fileId)) used.push('FlareLab App 51（旧 App 媒体，未经 Pose-Hub 发布）');
  for (const b of boundBy.get(file) || []) used.push(`HipLab v${b.ver}${b.status === 'published' ? '' : `（${b.status}）`}${b.id !== fileId ? ` 作 ${b.id}` : ''}`);
  for (const [ver, r] of Object.entries(releases)) if (r.ids.has(fileId) && !(boundBy.get(file) || []).some(b => b.ver === ver))
    used.push(`原版；v${ver} 绑定 ${[...r.ids.get(fileId)].map(p => path.basename(p, '.js')).join('/')}`);
  if (HIPLAB_STILLS[fileId]) used.push(HIPLAB_STILLS[fileId]);
  const issues = [...(KNOWN[fileId] || []), ...libNote(lib1013.get(fileId))];
  if (s.id !== fileId && !(candidates[file]?.renderId === s.id)) issues.push(`spec.id=${s.id} 与文件名不同`);
  rows.push({
    file, id: fileId, specId: s.id, cat: catOf(baseId), name: s.name || '', nameEn: s.nameEn || '',
    flareName: flare.get(fileId)?.name || '', target: groups.join('+'), side: hl.side || '', scene: scene.join('、') || '—',
    duration: s.timeline?.duration, fps, frames: Math.round((s.timeline?.duration || 0) * fps),
    modelProfile: s.modelProfile || '', revisionOf: original, registered: reg, sha256: sha, usedBy: used,
    lib1013: lib1013.has(fileId), issues,
  });
}

// ---------- markdown ----------
const esc = v => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const usedFlag = r => r.usedBy.some(u => /^FlareLab|^HipLab v|^HipLab 自测/.test(u));
const L = [];
L.push('# 动作目录（自动生成）', '');
L.push('> 由 `node drill-anim/tools/catalog.mjs` 从 specs、`data/drills.json`、`data/home-pr-candidates.json`、`verify.mjs`、`media/manifest.json`、`media/releases/*.sources.json`、2026-10-13 批次 `job-catalog.json` 只读汇总生成，**不要手改**；改了 spec / 清单 / 文档后重新运行。“已知问题”一列只收文档里查得到的记录，并注明出处；没有记录 ≠ 没有问题。', '');
const total = rows.length, revs = rows.filter(r => r.revisionOf).length;
const flareN = rows.filter(r => r.usedBy.some(u => u.startsWith('FlareLab'))).length;
const hipVers = Object.entries(releases).map(([v, r]) => `v${v}（${r.status}）${r.ids.size} 个动作 id`).join('、');
const hipFiles = rows.filter(r => r.usedBy.some(u => u.startsWith('HipLab v'))).length;
const stills = rows.filter(r => r.usedBy.some(u => u.startsWith('HipLab 自测'))).length;
const supersededBy = r => rows.find(x => x.revisionOf === r.id && usedFlag(x));
const superseded = rows.filter(r => !usedFlag(r) && supersededBy(r));
const unused = rows.filter(r => !usedFlag(r) && !supersededBy(r));
L.push('## 统计', '');
L.push('| 项 | 数 |', '|---|---:|');
L.push(`| spec 文件（specs/*.js，不含 _*.mjs 共用模块） | ${total} |`);
L.push(`| 其中修订版（-r2/-r3） | ${revs} |`);
L.push(`| FlareLab App 51（data/drills.json） | ${flareN} |`);
L.push(`| HipLab 已发布素材绑定的 spec 文件（${hipVers}） | ${hipFiles} |`);
L.push(`| HipLab 自测静图在用 spec | ${stills} |`);
L.push(`| 原版已被在用的修订版取代（保留不删） | ${superseded.length} |`);
L.push(`| 有 spec 但没有被任何 App/发布版本使用 | ${unused.length} |`);
L.push(`| SHA 未登记 / 哈希不符 | ${rows.filter(r => /✗|⚠/.test(r.registered)).length} |`, '');
for (const c of CATS) L.push(`- ${c.title}：${rows.filter(r => r.cat === c.key).length}`);
L.push('', '列说明：时长 = `timeline.duration` 秒；帧 = 时长 × spec 的 fps（未写 fps 按 30）。发布时 HipLab 统一包装成 30 fps，所以**发布片的帧号 ≠ spec 原生帧号**。profile 空 = 历史旧人物（未设 `modelProfile`）；`v2` 已退出新生产，仅供历史复现。新做/重做读取 `models/current-production.json`，显式绑定 `training-human-v2plus` 完整配方；本轮动作包 v2 先做六动作、五皮肤试点。SHA 列：基线 59 = 由 git 提交 `1adcab8` 固定；PR #n = 在 `data/home-pr-candidates.json` 或 `verify.mjs` 登记。', '');
for (const c of CATS) {
  const rs = rows.filter(r => r.cat === c.key); if (!rs.length) continue;
  L.push(`## ${c.title}`, '');
  L.push('| id | 中文名 | 目标高亮 | 场景/道具 | 时长/帧 | profile | 修订自 | 使用方 | SHA | 已知问题 |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rs) L.push(`| \`${r.id}\` | ${esc(r.flareName && r.flareName !== r.name ? `${r.name}（App：${r.flareName}）` : r.name)} | ${esc(r.target)}${r.side && r.side !== 'both' ? `（${r.side}）` : ''} | ${esc(r.scene)} | ${r.duration}s/${r.frames}f@${r.fps} | ${r.modelProfile === 'training-human-v2plus' ? 'v2plus' : r.modelProfile === 'training-human-v2' ? 'v2（历史）' : r.modelProfile || '旧'} | ${r.revisionOf ? `\`${r.revisionOf}\`` : ''} | ${esc(r.usedBy.join('；') || '—')} | ${esc(r.registered)} | ${esc(r.issues.join('；'))} |`);
  L.push('');
}
L.push('## 已有 spec 但未被任何 App / 发布版本使用', '');
L.push('这些是“可直接拿来出新版本”的存量；动作审核优化优先从这里挑。', '');
for (const c of CATS) { const rs = unused.filter(r => r.cat === c.key); if (rs.length) L.push(`- **${c.key}**（${rs.length}）：${rs.map(r => `\`${r.id}\``).join(' ')}`); }
L.push('', `原版已被在用修订取代（${superseded.length}）：${superseded.map(r => `\`${r.id}\`→\`${supersededBy(r).id}\``).join(' ')}`);
L.push('', '## 文档中提到计划、但没有 spec（待补全候选）', '');
L.push('| 候选 | 内容 | 为什么还没有 | 出处 |', '|---|---|---|---|');
for (const p of PLANNED) L.push(`| ${esc(p.id)} | ${esc(p.name)} | ${esc(p.why)} | ${esc(p.src)} |`);
L.push('', '新增候选请同时补到 `drill-anim/tools/catalog.mjs` 的 `PLANNED` 表并重新生成。', '');
const md = L.join('\n');

const json = JSON.stringify({generatedFrom: 'drill-anim/tools/catalog.mjs', rows, planned: PLANNED}, null, 1) + '\n';
if (checkOnly) {
  const outputs = [[out, md]];
  if (jsonOut) outputs.push([path.resolve(jsonOut), json]);
  let stale = false;
  for (const [file, expected] of outputs) {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
    if (cur !== expected) {
      console.error(`out of date: ${path.relative(repo, file)} (run node drill-anim/tools/catalog.mjs)`);
      stale = true;
    }
  }
  if (stale) process.exit(1);
  console.log('catalog up to date');
} else {
  if (jsonOut) fs.writeFileSync(path.resolve(jsonOut), json);
  if (out === '-') process.stdout.write(md);
  else { fs.writeFileSync(out, md); console.log(JSON.stringify({wrote: path.relative(repo, out), specs: total, revisions: revs, flare: flareN, hiplabReleaseSpecs: hipFiles, hiplabStills: stills, superseded: superseded.length, unused: unused.length, planned: PLANNED.length})); }
}
