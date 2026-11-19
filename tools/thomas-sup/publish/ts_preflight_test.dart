// r2-v19（r2-v18 + 托马斯补充 12 个动作）SDK 预检。沿用 tools/v5/publish/v5_preflight_test.dart（codex/v5-publish）的做法，
// 复制到 ugk-3d-pose-sdk 的 packages/ugk_trainer_runtime/test/ 下运行。
//
//   本地（fake http 读本地目录文件；r2-v19 不切任何渠道指针，所以只有本地模式）：
//     TSPF_PACK_DIR=<build_r2_v19 --out> TSPF_BASE_DIR=<tools/thomas-sup/publish/base-r2-v18> \
//       flutter test test/ts_preflight_test.dart
//
// 把 r2-v18 注入为本地当前版 → 用 <out>/pointer-preview.json 当作 dev 渠道（只在 fake http 里，线上指针不读不写）
// → PoseHubCatalogUpdater.checkNow() 必须 updated → 读回缓存的新目录：
//   - pack = r2-v19，261 个动作；前 249 个动作 raw JSON 与 r2-v18 逐字段相同（oldFieldDiff = 0，含媒体字段）；
//   - 新 12 个：SDK 解析出的 video/cover/thumbnail 在 media/<id>/r2-v19/ 下；voiceGuide 可解析；
//     讲解句中英都有 voice.files 且文字一致；
//   - 讲解句总数 = r2-v18 的 501 + 新动作的自写句（TSPF_EXPECT_SENTENCES，默认 521）；
//   - 目录 + semantic catalog 用 SDK 的 fromBytes 严格校验（semantic 定义字段逐字一致）并能转成 AI catalog，新 12 个都在。
// 结果打印一行：TS_PREFLIGHT {json}；不通过时测试失败。
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ugk_coach/ugk_coach.dart' as coach;
import 'package:ugk_trainer_runtime/ugk_trainer_runtime.dart';

const _newIds = [
  't-pushup-plus', 't-kneeling-scap-pushup', 't-frog-stand', 't-planche-lean', 't-seated-shoulder-ext-slide',
  't-self-resisted-wrist-flexion', 't-self-resisted-wrist-extension', 't-seated-forearm-rotation', 't-hanging-leg-raise',
  't-straddle-active-lift', 't-straddle-planche', 't-pbar-support-swing',
];

class _FileHttp implements PoseHubCatalogHttpClient {
  _FileHttp(this.routes);
  final Map<String, String> routes;
  @override
  Future<PoseHubCatalogHttpResponse> get(
    Uri uri, {
    Map<String, String> headers = const {},
    int maxBytes = 64 * 1024 * 1024,
  }) async {
    final path = routes[uri.toString()];
    if (path == null) throw SocketException('no route $uri');
    return PoseHubCatalogHttpResponse(200, await File(path).readAsBytes());
  }
}

void main() {
  final env = Platform.environment;
  final baseDir = env['TSPF_BASE_DIR']!;
  final dir = env['TSPF_PACK_DIR']!;
  final expectPack = env['TSPF_EXPECT_PACK'] ?? 'r2-v19';

  test('Thomas supplement r2-v19 pack preflight', () async {
    final baseCatalog = await File('$baseDir/catalog.json').readAsBytes();
    final baseSemantic = await File('$baseDir/catalog/catalog.json').readAsBytes();
    final local = coach.PoseHubAppTestCatalog.fromBytes(baseCatalog, semanticCatalogBytes: baseSemantic);
    final localPack = poseHubPackVersionOf(local);
    final baseRaw = {
      for (final a in (jsonDecode(utf8.decode(baseCatalog)) as Map)['actions'] as List) (a as Map)['id'] as String: a,
    };
    final ptr = jsonDecode(await File('$dir/pointer-preview.json').readAsString()) as Map<String, Object?>;
    final catUrl = ptr['catalog'] as String;
    final http = _FileHttp({
      'https://media.uuugk.win/pack/channels/dev.json': '$dir/pointer-preview.json',
      catUrl: '$dir/catalog.json',
      Uri.parse(catUrl).resolve('catalog/catalog.json').toString(): '$dir/catalog/catalog.json',
    });
    final store = MemoryPoseHubCatalogStore();
    final events = <PoseHubCatalogUpdateEvent>[];
    final updater = PoseHubCatalogUpdater(
      config: PoseHubCatalogUpdateConfig(channel: PoseHubCatalogChannel.dev),
      store: store,
      http: http,
      loadLocal: () async => local,
      onEvent: events.add,
    );
    final outcome = await updater.checkNow();
    final loaded = await readVerifiedPoseHubCatalog(store);

    final result = <String, Object?>{
      'sdk': poseHubCatalogSdkVersion,
      'localPack': localPack,
      'outcome': outcome.name,
      'events': events.map((e) => e.toString()).toList(),
    };
    final problems = <String>[];
    void p(String s) {
      if (problems.length < 30) problems.add(s);
    }

    if (outcome != PoseHubCatalogUpdateOutcome.updated) p('outcome ${outcome.name}');
    if (loaded == null) {
      p('读回缓存目录失败');
    } else {
      final pack = poseHubPackVersionOf(loaded);
      result['pack'] = pack;
      if (pack != expectPack) p('pack $pack ≠ $expectPack');
      final catBytes = await store.read('packs/$pack/catalog.json');
      result['catalogSha256'] = sha256.convert(catBytes!).toString();
      result['catalogBytes'] = catBytes.length;
      // 严格解析：目录 + semantic catalog（定义字段逐字一致）→ AI catalog
      final semBytes = await File('$dir/catalog/catalog.json').readAsBytes();
      final strict = coach.PoseHubAppTestCatalog.fromBytes(catBytes, semanticCatalogBytes: semBytes);
      final ai = strict.toAiCatalog();
      final aiMissing = _newIds.where((id) => ai[id] == null).toList();
      if (aiMissing.isNotEmpty) p('AI catalog 缺 $aiMissing');
      result['aiCatalogProblems'] = ai.problems.length;
      if (ai.problems.isNotEmpty) p('AI catalog problems ${ai.problems.take(5).toList()}');

      var oldFieldDiff = 0, newMedia = 0, badMedia = 0, guides = 0, sentences = 0, newSentences = 0;
      var missingClip = 0, textMismatch = 0;
      final noGuide = <String>[];
      final ids = loaded.allActions.map((a) => a.id).toList();
      for (final a in loaded.allActions) {
        final old = baseRaw[a.id] as Map?;
        final isNew = _newIds.contains(a.id);
        if (old != null) {
          final keys = {...old.keys.cast<String>(), ...a.raw.keys};
          for (final k in keys) {
            if (jsonEncode(a.raw[k]) != jsonEncode(old[k])) {
              oldFieldDiff++;
              p('${a.id} 旧动作字段 $k 与 r2-v18 不同');
            }
          }
        } else if (!isNew) {
          p('${a.id} 既不在 r2-v18 也不在托马斯补充名单');
        }
        if (isNew) {
          for (final f in [a.video, a.cover, a.thumbnail]) {
            if (f.path.startsWith('media/${a.id}/$expectPack/')) {
              newMedia++;
            } else {
              badMedia++;
              p('${a.id} 媒体路径 ${f.path}');
            }
          }
          if (!a.trainingDefinitionComplete || !a.availableForTraining) p('${a.id} 训练定义不完整或不可训练');
        }
        final g = a.voiceGuide;
        if (g == null) {
          noGuide.add(a.id);
          continue;
        }
        guides++;
        final files = <String, String?>{};
        final voice = a.raw['voice'];
        if (voice is Map) {
          for (final f in (voice['files'] as List? ?? const [])) {
            if (f is Map) files['${f['clipId']}|${f['language']}'] = f['text'] as String?;
          }
        }
        for (final c in [...g.set, ...g.reminders, ...g.steps]) {
          if (c.clipId == null) continue;
          sentences++;
          if (isNew) newSentences++;
          for (final lang in const ['zh', 'en']) {
            final k = '${c.clipId}|$lang';
            if (!files.containsKey(k)) {
              missingClip++;
              p('${a.id} 缺语音 $k');
            } else if (files[k] != c.text(lang)) {
              textMismatch++;
              p('${a.id} 文字不一致 $k');
            }
          }
        }
      }
      final missingNew = _newIds.where((id) => !ids.contains(id)).toList();
      result.addAll({
        'actions': loaded.allActions.length,
        'missingNew': missingNew,
        'oldFieldDiff': oldFieldDiff,
        'newMediaFiles': newMedia,
        'badMediaFiles': badMedia,
        'voiceGuideActions': guides,
        'noVoiceGuide': noGuide,
        'guideSentences': sentences,
        'newGuideSentences': newSentences,
        'missingClips': missingClip,
        'textMismatch': textMismatch,
      });
      if (loaded.allActions.length != 261) p('动作数 ${loaded.allActions.length} ≠ 261');
      if (missingNew.isNotEmpty) p('缺新动作 $missingNew');
      if (ids.take(249).join(',') != baseRaw.keys.join(',')) p('前 249 个动作顺序与 r2-v18 不同');
      if (newMedia != 36) p('新媒体 $newMedia ≠ 36');
      if (noGuide.isNotEmpty) p('${noGuide.length} 个动作 voiceGuide 解析为空');
      final want = int.tryParse(env['TSPF_EXPECT_SENTENCES'] ?? '521');
      if (want != null && sentences != want) p('讲解句 $sentences ≠ $want');
    }
    result['problems'] = problems;
    // ignore: avoid_print
    print('TS_PREFLIGHT ${jsonEncode(result)}');
    expect(problems, isEmpty);
  }, timeout: const Timeout(Duration(minutes: 5)));
}
