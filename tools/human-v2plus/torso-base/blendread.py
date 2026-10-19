# minimal .blend (v4.x, 64-bit little endian) reader: SDNA + blocks + struct field access
import struct, numpy as np, re
class Blend:
    def __init__(s, path):
        d = s.d = open(path, 'rb').read(); assert d[:7] == b'BLENDER' and d[7:8] == b'-' and d[8:9] == b'v'
        o = 12; s.blocks = []; s.byptr = {}
        while o < len(d):
            code, ln, ptr, sdna, nr = struct.unpack_from('<4siQii', d, o); o += 24
            code = code.rstrip(b'\0').decode('latin1'); b = (code, ln, ptr, sdna, nr, o); s.blocks.append(b)
            if ptr: s.byptr[ptr] = b
            if code == 'DNA1': s.parse_dna(o)
            if code == 'ENDB': break
            o += ln
    def parse_dna(s, o):
        d = s.d; assert d[o:o+4] == b'SDNA'; o += 4
        def names(o):
            assert d[o:o+4] in (b'NAME', b'TYPE'); o += 4; n, = struct.unpack_from('<i', d, o); o += 4; out = []
            for _ in range(n):
                e = d.index(b'\0', o); out.append(d[o:e].decode('latin1')); o = e + 1
            return out, (o + 3) & ~3
        s.names, o = names(o); s.types, o = names(o)
        assert d[o:o+4] == b'TLEN'; o += 4; s.tlen = list(struct.unpack_from('<%dh' % len(s.types), d, o)); o += 2 * len(s.types); o = (o + 3) & ~3
        assert d[o:o+4] == b'STRC'; o += 4; n, = struct.unpack_from('<i', d, o); o += 4; s.structs = []; s.sidx = {}
        for i in range(n):
            t, nf = struct.unpack_from('<hh', d, o); o += 4; fl = []; off = 0
            for _ in range(nf):
                ft, fn = struct.unpack_from('<hh', d, o); o += 4; nm = s.names[fn]
                isptr = nm.startswith('*') or nm.startswith('(*'); arr = 1
                for m in re.findall(r'\[(\d+)\]', nm): arr *= int(m)
                sz = (8 if isptr else s.tlen[ft]) * arr
                base = re.sub(r'\[.*', '', nm).lstrip('*').replace('(', '').replace(')', '')
                fl.append((base, s.types[ft], isptr, arr, off, sz, nm)); off += sz
            s.structs.append((s.types[t], fl)); s.sidx[s.types[t]] = i
    def fields(s, tname): return {f[0]: f for f in s.structs[s.sidx[tname]][1]}
    def get(s, tname, base, field):
        f = s.fields(tname)[field]; o = base + f[4]
        if f[2]:
            return struct.unpack_from('<%dQ' % f[3], s.d, o) if f[3] > 1 else struct.unpack_from('<Q', s.d, o)[0]
        T = f[1]; fmt = {'int': 'i', 'float': 'f', 'short': 'h', 'char': 'B', 'uchar': 'B', 'double': 'd', 'int64_t': 'q', 'uint64_t': 'Q', 'int8_t': 'b', 'uint': 'I', 'ushort': 'H', 'uint32_t': 'I', 'int32_t': 'i', 'uint8_t': 'B', 'int16_t': 'h'}.get(T)
        if T == 'char' and f[3] > 1: return s.d[o:o+f[3]].split(b'\0')[0].decode('latin1')
        if fmt is None: return o   # nested struct: return its offset
        return struct.unpack_from('<%d%s' % (f[3], fmt), s.d, o) if f[3] > 1 else struct.unpack_from('<' + fmt, s.d, o)[0]
    def block(s, ptr): return s.byptr.get(ptr)
    def data(s, ptr): b = s.byptr[ptr]; return s.d[b[5]:b[5]+b[1]]
    def of_code(s, code): return [b for b in s.blocks if b[0] == code]
    def sname(s, b): return s.structs[b[3]][0]
    def listbase(s, base_off, tname):
        first = struct.unpack_from('<Q', s.d, base_off)[0]; out = []
        while first:
            b = s.byptr[first]; out.append(b[5]); first = s.get(tname, b[5], 'next')
        return out
    def cdlayers(s, cd_off):
        lp = s.get('CustomData', cd_off, 'layers'); n = s.get('CustomData', cd_off, 'totlayer'); out = []
        if not lp: return out
        b = s.byptr[lp]; sz = s.tlen[s.sidx['CustomDataLayer']] if False else None
        L = s.structs[s.sidx['CustomDataLayer']][1]; size = L[-1][4] + L[-1][5]
        for i in range(n):
            o = b[5] + i * size
            out.append(dict(type=s.get('CustomDataLayer', o, 'type'), name=s.get('CustomDataLayer', o, 'name'), data=s.get('CustomDataLayer', o, 'data')))
        return out
