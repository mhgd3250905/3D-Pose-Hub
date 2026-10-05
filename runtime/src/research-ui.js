const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderSources(sources=[],label='教学与资料') {
  const links=sources.filter(source=>/^https?:\/\//.test(source.url||''));
  if(!links.length)return '';
  const kinds={coach:'教练示范',anatomy:'肌肉功能',study:'原始研究'};
  return `<details class="research-sources"><summary>${escape(label)} <span>${links.length}</span></summary><ul>${links.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a><small>${kinds[source.kind]||'教学参考'}</small></li>`).join('')}</ul></details>`;
}

export function poseSources(urls=[]) {
  return urls.map(url=>{
    let label='教练示范';
    if(url.includes('Sz5rd22PCSI')){
      const value=Number(new URL(url).searchParams.get('t')?.replace('s','')||0);
      label=`VincaniTV${value?' · '+Math.floor(value/60)+':'+String(value%60).padStart(2,'0'):''}`;
    }else if(url.includes('breakdancingninja.com'))label='Breakdancing Ninja · 抬腿与抬髋';
    else if(url.includes('2fFBaFV9Ugk'))label='Chiki Skills · Flare 分解';
    return {label,url,kind:'coach'};
  });
}
