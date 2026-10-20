# decode a v2plus piece JSON (pos / index / joints / weights) -> numpy
import json, base64, numpy as np
def unb(s,dt): return np.frombuffer(base64.b64decode(s),dt)
def load_piece(path):
    d=json.load(open(path)); n=d['n']
    V=unb(d['pos']['u16'],np.uint16).reshape(-1,3)*np.array(d['pos']['scale'])+np.array(d['pos']['lo'])
    F=unb(d['index']['u16'],np.uint16).reshape(-1,3).astype(np.int64)
    J=unb(d['joints']['u8'],np.uint8).reshape(-1,4); W=unb(d['weights']['u8'],np.uint8).reshape(-1,4)/255.
    return d,V,F,J,W
