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
