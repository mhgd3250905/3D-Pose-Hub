// voice-no-tempo-r1 发包预检（SDK 侧）。复制到 ugk-3d-pose-sdk 的 packages/ugk_trainer_runtime/test/ 下运行：
//
//   本地（切指针前，用 fake http 读本地目录文件）：
//     VNT_MODE=local VNT_PACK_DIR=<新目录 out> VNT_BASE_DIR=<r2-v15 基线目录> \
//       flutter test test/vnt_preflight_test.dart
//   线上（切指针后，真实网络读线上渠道指针）：
//     VNT_MODE=online VNT_CHANNEL=dev|beta|stable VNT_BASE_DIR=<r2-v15 基线目录> VNT_EXPECT_PACK=r2-v16 \
//       flutter test test/vnt_preflight_test.dart
//
// 两种模式都：把 r2-v15 注入为本地当前版 → PoseHubCatalogUpdater.checkNow() 必须 updated →
// 读回缓存的新目录，逐个动作 PoseHubVoiceGuide.forAction 必须非空（249 个），
// 统计讲解句（带 clipId 的 set/reminders/steps 条目），并核对每句中英文都有 voice.files 且文字一致。
// 结果打印一行：VNT_PREFLIGHT {json}；不通过时测试失败。
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ugk_coach/ugk_coach.dart' as coach;
import 'package:ugk_trainer_runtime/ugk_trainer_runtime.dart';

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
  final mode = env['VNT_MODE'] ?? 'local';
  final baseDir = env['VNT_BASE_DIR']!;

  test('voice-no-tempo-r1 pack preflight ($mode)', () async {
    final baseCatalog = await File('$baseDir/catalog.json').readAsBytes();
    final baseSemantic = await File('$baseDir/catalog/catalog.json').readAsBytes();
    final local = coach.PoseHubAppTestCatalog.fromBytes(
      baseCatalog,
      semanticCatalogBytes: baseSemantic,
    );
    final localPack = poseHubPackVersionOf(local);

    final PoseHubCatalogChannel channel;
    PoseHubCatalogHttpClient? http;
    String? expectPack = env['VNT_EXPECT_PACK'];
    if (mode == 'local') {
      final dir = env['VNT_PACK_DIR']!;
      final ptr = jsonDecode(await File('$dir/channels/dev.json').readAsString())
          as Map<String, Object?>;
      expectPack ??= ptr['pack'] as String;
      final catUrl = ptr['catalog'] as String;
      http = _FileHttp({
        'https://media.uuugk.win/pack/channels/dev.json': '$dir/channels/dev.json',
        catUrl: '$dir/catalog.json',
        Uri.parse(catUrl).resolve('catalog/catalog.json').toString():
            '$dir/catalog/catalog.json',
      });
      channel = PoseHubCatalogChannel.dev;
    } else {
      channel = PoseHubCatalogChannel.values.byName(env['VNT_CHANNEL'] ?? 'dev');
    }

    final store = MemoryPoseHubCatalogStore();
    final events = <PoseHubCatalogUpdateEvent>[];
    final updater = PoseHubCatalogUpdater(
      config: PoseHubCatalogUpdateConfig(channel: channel),
      store: store,
      http: http,
      loadLocal: () async => local,
      onEvent: events.add,
    );
    final outcome = await updater.checkNow();
    final loaded = await readVerifiedPoseHubCatalog(store);

    final result = <String, Object?>{
      'mode': mode,
      'channel': channel.name,
      'localPack': localPack,
      'outcome': outcome.name,
      'events': events.map((e) => e.toString()).toList(),
    };
    var problems = <String>[];
    if (outcome != PoseHubCatalogUpdateOutcome.updated) problems.add('outcome ${outcome.name}');
    if (loaded == null) {
      problems.add('读回缓存目录失败');
    } else {
      final pack = poseHubPackVersionOf(loaded);
      result['pack'] = pack;
      if (expectPack != null && pack != expectPack) problems.add('pack $pack ≠ $expectPack');
      final cur = await store.read('current.json');
      result['current'] = jsonDecode(utf8.decode(cur!));
      final catBytes = await store.read('packs/$pack/catalog.json');
      result['catalogSha256'] = sha256.convert(catBytes!).toString();
      result['catalogBytes'] = catBytes.length;
      var guides = 0, sentences = 0, missingClip = 0, textMismatch = 0;
      final modes = <String, int>{};
      final noGuide = <String>[];
      for (final a in loaded.allActions) {
        final g = a.voiceGuide;
        if (g == null) {
          noGuide.add(a.id);
          continue;
        }
        guides++;
        modes['${g.mode.name}/${g.phaseCues?.name ?? '-'}'] =
            (modes['${g.mode.name}/${g.phaseCues?.name ?? '-'}'] ?? 0) + 1;
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
          for (final lang in const ['zh', 'en']) {
            final k = '${c.clipId}|$lang';
            if (!files.containsKey(k)) {
              missingClip++;
              if (missingClip <= 10) problems.add('${a.id} 缺语音 $k');
            } else if (files[k] != c.text(lang)) {
              textMismatch++;
              if (textMismatch <= 10) problems.add('${a.id} 文字不一致 $k');
            }
          }
        }
      }
      result.addAll({
        'actions': loaded.allActions.length,
        'voiceGuideActions': guides,
        'voiceGuideModes': modes,
        'noVoiceGuide': noGuide,
        'guideSentences': sentences,
        'missingClips': missingClip,
        'textMismatch': textMismatch,
      });
      if (noGuide.isNotEmpty) problems.add('${noGuide.length} 个动作 voiceGuide 解析为空');
      final want = int.tryParse(env['VNT_EXPECT_SENTENCES'] ?? '');
      if (want != null && sentences != want) problems.add('讲解句 $sentences ≠ $want');
    }
    result['problems'] = problems;
    // ignore: avoid_print
    print('VNT_PREFLIGHT ${jsonEncode(result)}');
    expect(problems, isEmpty);
  }, timeout: const Timeout(Duration(minutes: 5)));
}
