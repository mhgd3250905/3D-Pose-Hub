# app-pack：线上素材包目录整理

`normalize_r2_v1.py` 把线上 `pack/r2-v1/catalog.json` 整理成 ugk-3d-pose-sdk 直接能读的格式，产物在 `release/app-pack-r2-v1/`。只改目录 JSON，不改、不重传任何媒体文件。

重跑步骤：

```bash
curl -o /tmp/r2v1.json https://media.uuugk.win/pack/r2-v1/catalog.json   # 现 SHA 22b2a391…dfe804e
python3 tools/app-pack/verify_media.py /tmp/r2v1.json /tmp/verify.json     # 逐个下载核对 bytes/SHA
python3 tools/app-pack/normalize_r2_v1.py --catalog /tmp/r2v1.json --verify /tmp/verify.json \
  --taxonomy catalog/taxonomy.json --legacy-semantic catalog/catalog.json \
  --published-at 2026-11-04T21:00:00+08:00 --out release/app-pack-r2-v1
```

产物：`catalog.json`（上传到 `pack/r2-v1/catalog.json`）、`catalog/catalog.json`（上传到 `pack/r2-v1/catalog/catalog.json`）、`channels/{dev,beta,stable}.json`（上传到 `pack/channels/`）、`report.json`（转换报告，不上传）。

`build_r2_v6.py` / `build_r2_v7.py` 的 `--published-at` 必须是带时区的 ISO-8601，例如
`2026-11-07T10:45:00+08:00`；省略时使用当前 UTC+08:00 时间（精确到秒）。
非 ISO 时间在读取输入、创建输出目录之前就会退出。定稿写本地 `channels/{dev,beta}.json`
前，还会按 SDK 的 schema、pack、catalog URL、SHA-256、字节数、min_sdk 规则自检；不生成 stable 指针。
这些脚本只构建本地产物，不上传或切换线上指针。

验证：`python -m unittest discover -s tools/app-pack -p test_catalog_pointer.py -v`。
