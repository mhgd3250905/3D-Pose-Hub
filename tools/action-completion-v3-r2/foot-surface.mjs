// Self-contained page diagnostic. Measures posed skinned geometry in metres;
// shader-only displacement is outside getVertexPosition's CPU skinning result.
export function measureFootSurfacesInPage() {
  const T = window.__toonT, v = flareInspector.viewer;
  if (!T || !v?.coach) throw Error('Foot surface measurement requires the active coach');
  const cache = window.__completionFootVertexCache ||= new WeakMap();
  const result = {method:'dominant-foot-toe-bone-skinned-vertices-world-space', units:'metres',
    left:{minY:Infinity, vertexCount:0, meshes:[]}, right:{minY:Infinity, vertexCount:0, meshes:[]}};
  v.coach.updateWorldMatrix(true, true);
  const q = new T.Vector3();
  v.coach.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    for (let a=mesh;a;a=a.parent) if (!a.visible) return;
    if (v.camera && !mesh.layers.test(v.camera.layers)) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (!materials.some(m => m?.visible !== false && m != null)) return;
    const g=mesh.geometry, pos=g.attributes.position, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, sk=mesh.skeleton;
    if (!pos || !si || !sw || !sk) return;
    let ids=cache.get(mesh);
    if (!ids || ids.geometry!==g || ids.skeleton!==sk || ids.si!==si || ids.sw!==sw ||
        ids.siVersion!==si.version || ids.swVersion!==sw.version || ids.count!==pos.count) {
      ids={geometry:g,skeleton:sk,si,sw,siVersion:si.version,swVersion:sw.version,count:pos.count,left:[],right:[]};
      for (let i=0;i<pos.count;i++) {
        let weight=0, name='';
        for (let j=0;j<sw.itemSize;j++) if(sw.getComponent(i,j)>weight) {
          weight=sw.getComponent(i,j);name=sk.bones[si.getComponent(i,j)]?.name || '';
        }
        const side=/^(left|right)(?:Foot|Toe)(?:$|[A-Z0-9_])/i.exec(name)?.[1]?.toLowerCase();
        if (side) ids[side].push(i);
      }
      cache.set(mesh,ids);
    }
    if (!ids.left.length && !ids.right.length) return;
    // Respect draw range and hidden material groups, so omitted vertices cannot
    // make a visible sole appear lower than the geometry actually being drawn.
    const count=g.index?.count ?? pos.count, drawStart=Math.max(0,g.drawRange.start), drawEnd=Math.min(count,drawStart+g.drawRange.count);
    const drawn=new Set(), ranges=Array.isArray(mesh.material) ? g.groups.filter(group=>materials[group.materialIndex]?.visible!==false && materials[group.materialIndex]) : [{start:0,count}];
    for(const range of ranges) for(let i=Math.max(drawStart,range.start);i<Math.min(drawEnd,range.start+range.count);i++)
      drawn.add(g.index ? g.index.getX(i) : i);
    sk.update();
    for (const side of ['left','right']) {
      let minY=Infinity, n=0;
      for (const i of ids[side]) if (drawn.has(i)) {
        mesh.getVertexPosition(i,q).applyMatrix4(mesh.matrixWorld);
        if (!Number.isFinite(q.y)) throw Error('Nonfinite posed foot vertex');
        minY=Math.min(minY,q.y);n++;
      }
      if(n) {result[side].minY=Math.min(result[side].minY,minY);result[side].vertexCount+=n;
        result[side].meshes.push({name:mesh.name || '(unnamed)',uuid:mesh.uuid,vertexCount:n,minY});}
    }
  });
  for(const side of ['left','right']) if(!result[side].vertexCount) throw Error('No visible rendered '+side+' foot/toe vertices');
  return result;
}
