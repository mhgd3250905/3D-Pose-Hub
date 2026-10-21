# label-font-zh.woff2 — copyright, source, licence

| | |
|---|---|
| File | `tools/human-v2plus/regions/label-font-zh.woff2` (14 448 bytes) |
| SHA-256 | `be0d12e587d329f35728250957184a638a4a6fbc07e9f8f11ccda0ae4a5b1db4` |
| Font | Noto Sans SC Medium (weight 500), PostScript `NotoSansSC-Medium` |
| Version (name ID 5) | `Version 2.004-H2;hotconv 1.0.118;makeotfexe 2.5.65603` |
| Copyright (name ID 0) | (c) 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. |
| Licence | SIL Open Font License 1.1 — full text with the copyright line in [`OFL.txt`](OFL.txt) next to this file |
| Upstream | Noto Sans SC / Noto CJK (Adobe + Google), https://github.com/notofonts/noto-cjk ; the `-H2` hinted build distributed by Google Fonts (https://fonts.google.com/noto/specimen/Noto+Sans+SC) |
| Obtained | 2026-10-20, a Google Fonts text subset of Noto Sans SC 500 (only the glyphs of the region table's Chinese names, 107 glyphs), saved unchanged as `label-font-zh.woff2` (Google Fonts origin inferred from the `-H2` build tag and the working file name `noto-sans-sc-500-regions.woff2`; the exact request URL was not recorded) |
| Use | Review sheets only: `tools/human-v2plus/regions-poses.mjs --labels` registers it as `V2PLabelCJK` because headless Chromium has no CJK font. Not loaded by the drill runtime, not shipped in App media. |

Notes

- The file is a subset (an OFL "Modified Version"). It keeps the original family name "Noto Sans SC" and does not use the Reserved Font Name "Source"; it is distributed only together with `OFL.txt`, as OFL §2 requires.
- The WOFF metadata block is empty, so the copyright and licence travel as these two text files.
- Replacing the font: regenerate a subset of the same family, update the size / SHA-256 / version above, keep `OFL.txt`.
