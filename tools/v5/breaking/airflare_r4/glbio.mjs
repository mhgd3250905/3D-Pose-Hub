// unpack: node glbio.mjs unpack in.glb out.glb  -> uncompressed GLB (meshopt decoded, single buffer)
// pack:   node glbio.mjs pack raw.glb ref.glb out.glb -> re-encode raw bufferViews with meshopt using ref's layout
import fs from 'node:fs';
import { MeshoptDecoder } from '/tmp/mo/node_modules/meshoptimizer/meshopt_decoder.module.js';
import { MeshoptEncoder } from '/tmp/mo/node_modules/meshoptimizer/meshopt_encoder.module.js';
const rd = f => { const b = fs.readFileSync(f); const jl = b.readUInt32LE(12); const j = JSON.parse(b.subarray(20, 20 + jl).toString());
  const bo = 20 + jl; const bl = b.readUInt32LE(bo); return { j, bin: b.subarray(bo + 8, bo + 8 + bl) }; };
const wr = (f, j, bin) => { let js = Buffer.from(JSON.stringify(j)); const pj = (4 - js.length % 4) % 4; js = Buffer.concat([js, Buffer.alloc(pj, 0x20)]);
  const pb = (4 - bin.length % 4) % 4; bin = Buffer.concat([bin, Buffer.alloc(pb)]);
  const h = Buffer.alloc(12); h.writeUInt32LE(0x46546C67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4E4F534A, 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004E4942, 4);
  fs.writeFileSync(f, Buffer.concat([h, c1, js, c2, bin])); };
const [cmd, ...a] = process.argv.slice(2);
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
if (cmd === 'unpack') {
  const { j, bin } = rd(a[0]); const parts = []; let off = 0;
  for (const bv of j.bufferViews) {
    const e = bv.extensions?.EXT_meshopt_compression; let data;
    if (e) { data = new Uint8Array(e.count * e.byteStride);
      MeshoptDecoder.decodeGltfBuffer(data, e.count, e.byteStride, new Uint8Array(bin.buffer, bin.byteOffset + (e.byteOffset || 0), e.byteLength), e.mode, e.filter || 'NONE');
      delete bv.extensions; } else data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    const pad = (4 - off % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; }
    bv.buffer = 0; bv.byteOffset = off; bv.byteLength = data.length; parts.push(Buffer.from(data)); off += data.length;
  }
  const out = Buffer.concat(parts); j.buffers = [{ byteLength: out.length }];
  j.extensionsUsed = j.extensionsUsed.filter(x => x !== 'EXT_meshopt_compression'); j.extensionsRequired = j.extensionsRequired.filter(x => x !== 'EXT_meshopt_compression');
  wr(a[1], j, out); console.log('unpacked', out.length);
} else if (cmd === 'pack') {
  const raw = rd(a[0]), ref = rd(a[1]); const j = raw.j; const parts = []; let off = 0;
  // compression layout from ref for the bufferViews it has; extra views (e.g. new IBMs) are stored uncompressed in buffer 0
  j.bufferViews = j.bufferViews.map((bv, i) => i < ref.j.bufferViews.length ? Object.assign({}, ref.j.bufferViews[i], { byteLength: bv.byteLength, _raw: bv }) : Object.assign({}, bv, { _raw: bv }));
  j.buffers = JSON.parse(JSON.stringify(ref.j.buffers)); j.extensionsUsed = ref.j.extensionsUsed; j.extensionsRequired = ref.j.extensionsRequired;
  // buffer0 = compressed, buffer1 = fallback (no data)
  for (let i = 0; i < j.bufferViews.length; i++) {
    const bv = j.bufferViews[i], rb = bv._raw; delete bv._raw; const src = new Uint8Array(raw.bin.buffer, raw.bin.byteOffset + rb.byteOffset, rb.byteLength);
    const e = bv.extensions?.EXT_meshopt_compression; let enc;
    if (e) { enc = e.mode === 'TRIANGLES' ? MeshoptEncoder.encodeGltfBuffer(src, e.count, e.byteStride, 'TRIANGLES') : MeshoptEncoder.encodeGltfBuffer(src, e.count, e.byteStride, e.mode);
      e.byteOffset = off; e.byteLength = enc.length; e.buffer = 0; }
    else { enc = src; bv.byteOffset = off; bv.buffer = 0; bv.byteLength = src.length; }
    parts.push(Buffer.from(enc)); off += enc.length; const pad = (4 - off % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; }
  }
  const out = Buffer.concat(parts); j.buffers[0].byteLength = out.length;
  // fallback buffer 1 must cover every compressed view's byteOffset+byteLength (decoded layout = raw layout)
  let fb = 0; for (const bv of j.bufferViews) if (bv.extensions?.EXT_meshopt_compression) fb = Math.max(fb, bv.byteOffset + bv.byteLength); j.buffers[1].byteLength = fb;
  wr(a[2], j, out); console.log('packed', out.length);
}
