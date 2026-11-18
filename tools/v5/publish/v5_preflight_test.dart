// r2-v18（V5 换片）发包预检（SDK 侧）。沿用 tools/vnt/vnt_preflight_test.dart（codex/voice-no-tempo-publish）的做法，
// 复制到 ugk-3d-pose-sdk 的 packages/ugk_trainer_runtime/test/ 下运行：
//
//   本地（切指针前，fake http 读本地目录文件）：
//     V5PF_MODE=local V5PF_PACK_DIR=<build_r2_v18 --out> V5PF_BASE_DIR=<release/app-pack-r2-v16> \
//       flutter test test/v5_preflight_test.dart
//   线上（切指针后，真实网络读线上渠道指针）：
//     V5PF_MODE=online V5PF_CHANNEL=dev|beta V5PF_BASE_DIR=<release/app-pack-r2-v16> \
//       flutter test test/v5_preflight_test.dart
//
// 两种模式都：把 r2-v16 注入为本地当前版 → PoseHubCatalogUpdater.checkNow() 必须 updated →
// 读回缓存的新目录 pack 必须是 r2-v18（V5PF_EXPECT_PACK 可改）：
//   - 249 个动作，SDK 解析出的 video/cover/thumbnail 路径全部在 media/<id>/r2-v18/ 下，且与 r2-v16 路径不同；
//   - 每个动作 voiceGuide 非空，讲解句中英文都有 voice.files 且文字一致，讲解句总数 = r2-v16 的 501；
//   - 除 files/source/mediaRevision/revision/repairReason 外，每个动作 raw JSON 与 r2-v16 逐字段相同。
// 结果打印一行：V5_PREFLIGHT {json}；不通过时测试失败。
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ugk_coach/ugk_coach.dart' as coach;
import 'package:ugk_trainer_runtime/ugk_trainer_runtime.dart';

const _mediaFields = {'files', 'source', 'mediaRevision', 'revision', 'repairReason'};

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
  final mode = env['V5PF_MODE'] ?? 'local';
  final baseDir = env['V5PF_BASE_DIR']!;

  test('V5 r2-v18 pack preflight ($mode)', () async {
    final baseCatalog = await File('$baseDir/catalog.json').readAsBytes();
    final baseSemantic = await File('$baseDir/catalog/catalog.json').readAsBytes();
    final local = coach.PoseHubAppTestCatalog.fromBytes(
      baseCatalog,
      semanticCatalogBytes: baseSemantic,
    );
    final localPack = poseHubPackVersionOf(local);
    final baseRaw = {
      for (final a in (jsonDecode(utf8.decode(baseCatalog)) as Map)['actions'] as List)
        (a as Map)['id'] as String: a,
    };

    final PoseHubCatalogChannel channel;
    PoseHubCatalogHttpClient? http;
    final expectPack = env['V5PF_EXPECT_PACK'] ?? 'r2-v18';
    if (mode == 'local') {
      final dir = env['V5PF_PACK_DIR']!;
      final ptr = jsonDecode(await File('$dir/channels/dev.json').readAsString())
          as Map<String, Object?>;
      final catUrl = ptr['catalog'] as String;
      http = _FileHttp({
        'https://media.uuugk.win/pack/channels/dev.json': '$dir/channels/dev.json',
        catUrl: '$dir/catalog.json',
        Uri.parse(catUrl).resolve('catalog/catalog.json').toString():
            '$dir/catalog/catalog.json',
      });
      channel = PoseHubCatalogChannel.dev;
    } else {
      channel = PoseHubCatalogChannel.values.byName(env['V5PF_CHANNEL'] ?? 'dev');
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
      final cur = await store.read('current.json');
      result['current'] = jsonDecode(utf8.decode(cur!));
      final catBytes = await store.read('packs/$pack/catalog.json');
      result['catalogSha256'] = sha256.convert(catBytes!).toString();
      result['catalogBytes'] = catBytes.length;
      var guides = 0, sentences = 0, missingClip = 0, textMismatch = 0;
      var newMedia = 0, badMedia = 0, otherFieldDiff = 0;
      final noGuide = <String>[];
      for (final a in loaded.allActions) {
        // 媒体：SDK 解析出的三种文件都在 r2-v18 新路径
        for (final f in [a.video, a.cover, a.thumbnail]) {
          if (f.path.startsWith('media/${a.id}/$expectPack/')) {
            newMedia++;
          } else {
            badMedia++;
            p('${a.id} 媒体路径 ${f.path}');
          }
        }
        // 非媒体字段与 r2-v16 逐字段一致
        final old = baseRaw[a.id] as Map?;
        if (old == null) {
          p('${a.id} 不在 r2-v16');
        } else {
          final keys = {...old.keys.cast<String>(), ...a.raw.keys};
          for (final k in keys) {
            if (_mediaFields.contains(k)) continue;
            if (jsonEncode(a.raw[k]) != jsonEncode(old[k])) {
              otherFieldDiff++;
              p('${a.id} 非媒体字段 $k 与 r2-v16 不同');
            }
          }
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
      result.addAll({
        'actions': loaded.allActions.length,
        'newMediaFiles': newMedia,
        'badMediaFiles': badMedia,
        'otherFieldDiff': otherFieldDiff,
        'voiceGuideActions': guides,
        'noVoiceGuide': noGuide,
        'guideSentences': sentences,
        'missingClips': missingClip,
        'textMismatch': textMismatch,
      });
      if (loaded.allActions.length != 249) p('动作数 ${loaded.allActions.length} ≠ 249');
      if (newMedia != 747) p('新媒体 $newMedia ≠ 747');
      if (noGuide.isNotEmpty) p('${noGuide.length} 个动作 voiceGuide 解析为空');
      final want = int.tryParse(env['V5PF_EXPECT_SENTENCES'] ?? '501');
      if (want != null && sentences != want) p('讲解句 $sentences ≠ $want');
    }
    result['problems'] = problems;
    // ignore: avoid_print
    print('V5_PREFLIGHT ${jsonEncode(result)}');
    expect(problems, isEmpty);
  }, timeout: const Timeout(Duration(minutes: 5)));
}
