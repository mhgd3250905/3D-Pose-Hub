#!/usr/bin/env python3
"""Create an offline WebGL review page for the stacked-alpha delivery contract."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import quote


FORMAT = "pose-hub-stacked-alpha-delivery@1"
MAX_PREVIEW_ACTIONS = 3
PREFERRED_PREVIEW_IDS = ("h-chair-tspine", "w-bird-dog", "h-squat")


def file_url(root: Path, entry: dict, label: str) -> str:
    if not isinstance(entry, dict):
        raise ValueError(f"{label}: file reference must be an object")
    raw = entry.get("path")
    if not isinstance(raw, str) or not raw or "\\" in raw:
        raise ValueError(f"{label}: path must be a nonempty relative POSIX path")
    relative = Path(raw)
    if relative.is_absolute() or ":" in raw or "?" in raw or "#" in raw:
        raise ValueError(f"{label}: only local relative paths are allowed")
    resolved = (root / relative).resolve()
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise ValueError(f"{label}: missing file or path escapes delivery root: {raw}")
    if type(entry.get("bytes")) is not int or entry["bytes"] <= 0 or resolved.stat().st_size != entry["bytes"]:
        raise ValueError(f"{label}: file size does not match manifest")
    digest = hashlib.sha256()
    with resolved.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != str(entry.get("sha256", "")).lower():
        raise ValueError(f"{label}: SHA-256 does not match manifest")
    return quote(relative.as_posix(), safe="/")


def select_actions(source: dict, selected_ids: list[str] | None = None) -> list[dict]:
    """Choose a bounded preview without hashing or loading unselected media."""
    actions = source.get("actions")
    if not isinstance(actions, list) or not actions:
        raise ValueError("manifest actions must be a nonempty list")
    indexed = {}
    for action in actions:
        if not isinstance(action, dict):
            raise ValueError("manifest action must be an object")
        action_id = action.get("id")
        if not isinstance(action_id, str) or not action_id or action_id in indexed:
            raise ValueError("action IDs must be nonempty and unique")
        indexed[action_id] = action
    if selected_ids is not None:
        if (not selected_ids or len(selected_ids) > MAX_PREVIEW_ACTIONS
                or len(selected_ids) != len(set(selected_ids))):
            raise ValueError("--ids requires one to three unique ready action IDs")
        missing = set(selected_ids) - indexed.keys()
        if missing:
            raise ValueError("requested IDs are absent from manifest: " + ", ".join(sorted(missing)))
        chosen = [indexed[action_id] for action_id in selected_ids]
    elif len(actions) > MAX_PREVIEW_ACTIONS and all(value in indexed for value in PREFERRED_PREVIEW_IDS):
        chosen = [indexed[action_id] for action_id in PREFERRED_PREVIEW_IDS]
    else:
        chosen = actions[:MAX_PREVIEW_ACTIONS]
    states = source.get("states", {})
    if not isinstance(states, dict):
        raise ValueError("manifest states must be an object")
    pending, excluded = source.get("pendingIds", []), source.get("excluded", [])
    if not all(isinstance(values, list) and all(isinstance(value, str) for value in values)
               for values in (pending, excluded)):
        raise ValueError("manifest pendingIds and excluded must be lists of IDs")
    unavailable = set(pending) | set(excluded)
    for action in chosen:
        action_id = action["id"]
        state_record = states.get(action_id, {})
        if not isinstance(state_record, dict):
            raise ValueError(f"{action_id}: ready state must be an object")
        state = state_record.get("state", action.get("state"))
        if (action_id in unavailable or action.get("availableForApp") is False
                or (state is not None and (not isinstance(state, str) or not state.startswith("ready")))):
            raise ValueError(f"{action_id}: selected action is not ready")
        files = action.get("files")
        if not isinstance(files, dict) or not all(isinstance(files.get(kind), dict)
                                                   for kind in ("video", "cover", "thumbnail")):
            raise ValueError(f"{action_id}: ready video, cover and thumbnail references are required")
    return chosen


def review_data(manifest: Path, selected_ids: list[str] | None = None) -> list[dict]:
    source = json.loads(manifest.read_text(encoding="utf-8-sig"))
    if source.get("format") != FORMAT:
        raise ValueError(f"expected manifest format {FORMAT}")
    root = manifest.parent.resolve()
    result = []
    for action in select_actions(source, selected_ids):
        action_id = action["id"]
        fps, frames, cover_frame = (action.get(key) for key in ("fps", "frames", "coverFrame"))
        if isinstance(fps, bool) or not isinstance(fps, (int, float)) or not 0 < fps <= 240:
            raise ValueError(f"{action_id}: invalid fps")
        if isinstance(frames, bool) or not isinstance(frames, int) or frames <= 0:
            raise ValueError(f"{action_id}: invalid frames")
        if isinstance(cover_frame, bool) or not isinstance(cover_frame, int) or not 0 <= cover_frame < frames:
            raise ValueError(f"{action_id}: coverFrame must be within the video")
        files = action.get("files", {})
        video = files.get("video", {})
        if (video.get("width"), video.get("height")) != (720, 1440):
            raise ValueError(f"{action_id}: packed video must be 720x1440")
        urls = {kind: file_url(root, files.get(kind, {}), f"{action_id}/{kind}")
                for kind in ("video", "cover", "thumbnail")}
        result.append({"id": action_id, "nameZh": action.get("nameZh", action_id),
                       "fps": fps, "frames": frames, "coverFrame": cover_frame, **urls})
    return result


PAGE = r'''<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'">
<title>SmartFit · 透明样片审阅</title>
<style>
:root{color-scheme:light;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#172331;background:#edf1f5}
*{box-sizing:border-box}body{margin:0}main{max-width:1240px;margin:auto;padding:32px 24px 48px}
header{margin-bottom:22px}h1{font-size:27px;line-height:1.3;margin:6px 0 10px;font-weight:700;letter-spacing:-.6px}
.eyebrow{color:#35625e;font-weight:700;font-size:12px;letter-spacing:2px}p{margin:5px 0;color:#536271}
.toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:20px 0 24px}
button,input{font:inherit}button{border:1px solid #ced7df;border-radius:8px;padding:7px 12px;cursor:pointer;background:#fff;color:#253647}
button:hover{border-color:#558f87}button[aria-pressed=true]{background:#285e57;color:white;border-color:#285e57}
button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #30a89b;outline-offset:3px}
input[type=color]{width:36px;height:34px;padding:2px;border:1px solid #c9d3dc;border-radius:7px;background:white;vertical-align:middle}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:20px;align-items:start}
.card{min-width:0;border:1px solid #dae2e8;background:white;border-radius:14px;overflow:hidden;box-shadow:0 5px 20px #233d5410}
.card-head{padding:17px 18px 13px}h2{font-size:18px;margin:0 0 3px}.id{font:11px/1.5 ui-monospace,monospace;color:#71808e;overflow-wrap:anywhere}
.stage{width:min(100%,360px);aspect-ratio:1;margin:0 auto;position:relative;overflow:hidden;isolation:isolate;background-color:#fff}
.stage canvas{width:100%;height:100%;display:block}.checker{background-color:#f4f4f4;background-image:conic-gradient(#ccd2d6 25%,transparent 0 50%,#ccd2d6 0 75%,transparent 0);background-size:24px 24px}
.stage.dark{background:#172331}.stage.white{background:#fff}.stage.custom{background:var(--custom-color,#eaa262)}
.controls{padding:13px 18px 8px;display:flex;flex-wrap:wrap;gap:7px}.controls button{font-size:13px;padding:5px 9px}
.status{margin:0 18px 5px;min-height:24px;font-size:12px;overflow-wrap:anywhere;color:#42665e}.status.error{color:#ad2a27}
.time{margin:0 18px 12px;font:12px ui-monospace,monospace;color:#687986}
.assets{border-top:1px solid #e8edf0;padding:12px 18px 17px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{margin:0;min-width:0}.asset-stage{aspect-ratio:1;border-radius:7px;overflow:hidden;display:grid;place-items:center}
.asset-stage img{max-width:100%;max-height:100%;display:block}figcaption{font-size:12px;color:#617282;margin-top:5px}
.asset-state{display:block;font-size:10px;overflow-wrap:anywhere;color:#617282}video{display:none}
footer{margin-top:24px;color:#647483;font-size:12px}.notice{border-left:3px solid #86aaa3;padding:9px 14px;background:#fff9}
.empty{color:#a12828}a{color:#23695f}noscript{display:block;padding:20px;color:#a12828}
</style>
<main>
<header><div class="eyebrow">POSE HUB / SMARTFIT</div><h1>透明样片审阅</h1>
<p>同一帧上半为 straight RGB，下半为灰度 alpha；每半 720 × 720，默认以 360 × 360 显示。</p>
<p class="notice">本页最多加载三个视频，通过 WebGL 重构透明效果；完整 App 清单不会一次载入。普通视频播放器会显示上下两半。完整动作审核与发布资格仍按交付清单管理。</p></header>
<div class="toolbar" aria-label="预览背景">
<span>检查背景</span><button data-bg="white" aria-pressed="false">白色</button>
<button data-bg="dark" aria-pressed="false">深色</button><button data-bg="checker" aria-pressed="true">棋盘</button>
<button data-bg="custom" aria-pressed="false">自选色</button><label>颜色 <input id="custom-color" type="color" value="#eaa262" aria-label="自选背景颜色"></label>
</div>
<section id="cards" class="grid" aria-label="透明动画样片"></section>
<noscript>需要启用 JavaScript 与 WebGL 才能重构透明视频。</noscript>
<footer>视频和透明 WebP 均从此目录加载，无外部脚本或网络依赖。若浏览器拒绝 file:// 视频纹理，请通过本地 HTTP 服务打开同一目录。<br>透明纹理逐半限制在像素中心；WebGL 使用 alpha:true、premultipliedAlpha:false，不在片元中预乘 RGB。</footer>
</main>
<script id="review-data" type="application/json">__REVIEW_DATA__</script>
<script>
'use strict';
const actions = JSON.parse(document.getElementById('review-data').textContent);
if (!Array.isArray(actions) || actions.length < 1 || actions.length > 3) throw Error('Preview requires one to three selected actions');
const cards = [], root = document.getElementById('cards');
let background = 'checker';
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function setBackground(value) {
  background = value;
  document.querySelectorAll('.stage,.asset-stage').forEach(node => {
    node.classList.remove('white','dark','checker','custom'); node.classList.add(value);
    node.style.setProperty('--custom-color', document.getElementById('custom-color').value);
    if (value === 'custom') node.style.background = document.getElementById('custom-color').value;
    else node.style.background = '';
  });
  document.querySelectorAll('[data-bg]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.bg === value)));
}
document.querySelectorAll('[data-bg]').forEach(node => node.addEventListener('click', () => setBackground(node.dataset.bg)));
document.getElementById('custom-color').addEventListener('input', () => setBackground('custom'));
function shader(gl, kind, source) {
  const result = gl.createShader(kind); gl.shaderSource(result, source); gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(result));
  return result;
}
function makeRenderer(canvas, video) {
  const gl = canvas.getContext('webgl', {alpha:true,premultipliedAlpha:false,antialias:false});
  if (!gl) throw Error('此浏览器没有可用的 WebGL');
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, `
    attribute vec2 position; varying vec2 uv;
    void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`));
  gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, `
    precision highp float; varying vec2 uv; uniform sampler2D packedTexture;
    void main(){
      float x=clamp(uv.x,0.5/720.0,1.0-0.5/720.0);
      // UNPACK_FLIP_Y_WEBGL=true: top RGB occupies texture y in [0.5,1].
      float rgbY=clamp(0.5+uv.y*0.5,0.5+0.5/1440.0,1.0-0.5/1440.0);
      float alphaY=clamp(uv.y*0.5,0.5/1440.0,0.5-0.5/1440.0);
      vec3 color=texture2D(packedTexture,vec2(x,rgbY)).rgb;
      float alpha=texture2D(packedTexture,vec2(x,alphaY)).r;
      gl_FragColor=vec4(color,alpha);
    }`));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program); gl.disable(gl.BLEND);
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0); const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program,'packedTexture'),0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.viewport(0,0,720,720); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
  return {gl, draw(){
    if (video.readyState < 2) return false;
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    const error=gl.getError(); if(error!==gl.NO_ERROR) throw Error('WebGL '+error);
    return true;
  }};
}
function createCard(action) {
  if(cards.length>=3) throw Error('At most three video previews may be loaded');
  const card=element('article','card'); card.dataset.id=action.id; card.dataset.state='loading';
  card.dataset.videoState='loading'; card.dataset.coverState='loading'; card.dataset.thumbnailState='loading';
  const head=element('div','card-head'); head.append(element('h2','',action.nameZh),element('div','id',action.id));
  const stage=element('div','stage checker'), canvas=element('canvas'); canvas.width=720; canvas.height=720;
  canvas.setAttribute('aria-label',action.nameZh+'透明视频'); stage.append(canvas);
  const video=element('video'); video.muted=true; video.loop=true; video.playsInline=true; video.preload='auto';
  const controls=element('div','controls'), status=element('p','status','正在加载视频和透明图片…'); status.setAttribute('role','status');
  const time=element('p','time','0.000 s'), assets=element('div','assets');
  card.append(head,stage,controls,status,time,assets,video); root.append(card);
  let renderer, failed=false;
  const api={id:action.id,card,video,canvas,action,drawCount:0}; cards.push(api);
  function fail(message, part='video') {
    failed=true;card.dataset.state='error';card.dataset[part+'State']='error';
    status.classList.add('error'); status.textContent=message;
  }
  function update() {
    if(failed) return;
    const done=['videoState','coverState','thumbnailState'].every(key=>card.dataset[key]==='loaded');
    card.dataset.state=done?'loaded':'loading';
    status.textContent=done?'已加载 · 视频透明重构及两张透明 WebP 就绪':'正在加载视频和透明图片…';
  }
  function draw() {
    if(failed || !renderer) return;
    try {if(renderer.draw()) {api.drawCount++;card.dataset.videoState='loaded';update();}}
    catch(error){video.pause();fail('视频纹理加载失败：'+error.message+'。请通过本地 HTTP 服务打开。');}
    time.textContent=video.currentTime.toFixed(3)+' s · frame '+Math.min(action.frames-1,Math.floor(video.currentTime*action.fps));
  }
  async function seek(frame) {
    video.pause();
    if(video.readyState<1) await new Promise((resolve,reject)=>{
      video.addEventListener('loadedmetadata',resolve,{once:true});
      video.addEventListener('error',reject,{once:true});
    });
    const seconds=Math.min(frame/action.fps,Math.max(0,video.duration-0.001));
    if(Math.abs(video.currentTime-seconds)<0.00001){draw();return;}
    await new Promise((resolve,reject)=>{
      video.addEventListener('seeked',resolve,{once:true});
      video.addEventListener('error',reject,{once:true});video.currentTime=seconds;
    }); draw();
  }
  api.seek=seek;
  function button(label,name,callback) {
    const node=element('button','',label);node.dataset.action=name;
    node.addEventListener('click',()=>Promise.resolve().then(callback).catch(error=>fail(error.message)));
    controls.append(node);
  }
  button('播放','play',()=>video.play());button('暂停','pause',()=>{video.pause();draw();});
  button('首帧','first',()=>seek(0));button('封面帧 '+action.coverFrame,'cover',()=>seek(action.coverFrame));
  [['cover','透明封面'],['thumbnail','透明缩略图']].forEach(([kind,label])=>{
    const figure=element('figure'), imageStage=element('div','asset-stage checker'), image=element('img');
    image.alt=action.nameZh+' · '+label;image.decoding='async';image.dataset.kind=kind;
    const caption=element('figcaption','',label), imageStatus=element('span','asset-state','加载中');
    imageStage.append(image);caption.append(imageStatus);figure.append(imageStage,caption);assets.append(figure);
    image.addEventListener('load',()=>{
      try {
        const probe=document.createElement('canvas');probe.width=image.naturalWidth;probe.height=image.naturalHeight;
        const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
        const pixels=ctx.getImageData(0,0,probe.width,probe.height).data;let transparent=0,partial=0;
        for(let n=3;n<pixels.length;n+=4){if(pixels[n]<255)transparent++;if(pixels[n]>0&&pixels[n]<255)partial++;}
        image.dataset.transparentPixels=String(transparent);image.dataset.partialAlphaPixels=String(partial);
        if(!transparent) throw Error(label+'未检测到透明像素');
        card.dataset[kind+'State']='loaded';
        imageStatus.textContent=image.naturalWidth+'×'+image.naturalHeight+' · 透明像素 '+transparent+' · 半透明 '+partial;update();
      }catch(error){imageStatus.textContent=error.message;fail(error.message,kind);}
    });
    image.addEventListener('error',()=>{imageStatus.textContent='加载失败';fail(label+'加载失败',kind);});image.src=action[kind];
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();video.pause();fail('WebGL 上下文丢失，请刷新页面。');});
  video.addEventListener('error',()=>fail('视频加载失败，MediaError '+(video.error?video.error.code:'unknown')));
  video.addEventListener('loadedmetadata',()=>{
    if(video.videoWidth!==720||video.videoHeight!==1440)fail('视频实际尺寸不是 720×1440');
  });
  ['loadeddata','seeked','pause','timeupdate'].forEach(event=>video.addEventListener(event,draw));
  try{renderer=makeRenderer(canvas,video);api.gl=renderer.gl;}catch(error){fail(error.message);}
  if('requestVideoFrameCallback' in video){
    const tick=()=>{draw();if(!failed)video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);
  } else {
    const tick=()=>{if(!video.paused)draw();if(!failed)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  }
  video.src=action.video;video.load();
}
actions.forEach(createCard);setBackground(background);
window.poseHubReview={cards,setBackground,protocol:'top-rgb-bottom-alpha',
  snapshot:()=>cards.map(item=>({id:item.id,state:item.card.dataset.state,video:item.card.dataset.videoState,
    cover:item.card.dataset.coverState,thumbnail:item.card.dataset.thumbnailState,drawCount:item.drawCount,
    currentTime:item.video.currentTime,width:item.video.videoWidth,height:item.video.videoHeight,
    context:item.gl?item.gl.getContextAttributes():null}))};
</script>
</html>
'''


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--ids", nargs="+", metavar="ID",
                        help="Preview one to three ready IDs; by default select at most three, preferring chair-tspine/bird-dog/squat")
    args = parser.parse_args()
    manifest = args.manifest.resolve(strict=True)
    output = manifest.parent / "review.html"
    if output.exists():
        parser.error(f"refusing to overwrite {output}")
    try:
        data = review_data(manifest, args.ids)
        # Keep manifest text inert inside the inline JSON element.
        encoded = json.dumps(data, ensure_ascii=False).replace("<", "\\u003c").replace("&", "\\u0026")
        page = PAGE.replace("__REVIEW_DATA__", encoded)
        with output.open("x", encoding="utf-8", newline="\n") as stream:
            stream.write(page)
    except (OSError, ValueError, TypeError, KeyError) as error:
        parser.error(str(error))
    print(output)


if __name__ == "__main__":
    main()
