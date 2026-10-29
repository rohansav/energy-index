const state={view:'brands',query:''};
const results=document.querySelector('#review-results');
document.querySelector('#drink-count').textContent=drinks.length;
function render(){
 const filtered=drinks.filter(d=>matchesDrink(d,state.query));
 const shown=brands.filter(b=>filtered.some(d=>d.brand===b.name));
 document.querySelector('#result-count').textContent=`${shown.length} BRANDS / ${filtered.length} FLAVORS`;
 if(!filtered.length){results.innerHTML='<p class="empty">No matches. Try a different brand or flavor.</p>';return;}
 results.innerHTML=state.view==='brands'?`<div class="brand-grid">${shown.map(b=>{
 const all=ordered(filtered.filter(d=>d.brand===b.name));const rows=all.slice(0,4);
 return `<section class="brand-panel" aria-label="${esc(b.name)} catalogue"><a class="brand-cover" href="brand.html?brand=${brandSlug(b.name)}" style="--color:${b.color};--text:${b.text}"><span class="cover-arrow" aria-hidden="true">↗</span><span class="brand-index">${String(brands.indexOf(b)+1).padStart(2,'0')} / BRAND INDEX</span><h2>${esc(b.name)}</h2><div class="cover-bottom"><span>${all.length} FLAVORS</span><span>VIEW BRAND ↗</span></div></a><div class="list-heading"><span>${all.some(d=>d.score!==null)?'TOP 4 PREVIEW':'FLAVOR PREVIEW'}</span><span>${all.some(d=>d.score!==null)?'OVERALL ↓':'UNRATED · A–Z'}</span></div>${rows.map(d=>`<button class="drink-row photo-row" data-id="${d.id}" aria-label="${esc(d.name)}. ${d.score===null?'Unrated':`Overall ${d.score.toFixed(1)}`}. Open details.">${photo(d,'mini-product')}<span><span class="drink-name">${esc(d.name)}</span><span class="drink-note">${esc(d.notes)}</span></span>${scoreMarkup(d,'compact')}</button>`).join('')}<a class="brand-all-link" href="brand.html?brand=${brandSlug(b.name)}">Browse all ${all.length} flavors <span>→</span></a></section>`;
 }).join('')}</div>`:`<div class="table-scroll"><table><thead><tr><th>CAN</th><th>FLAVOR</th><th>BRAND</th><th class="flavor-cell">AVAILABILITY</th><th>OVERALL</th></tr></thead><tbody>${ordered(filtered).map(d=>`<tr><td>${photo(d,'table-product')}</td><td><button data-id="${d.id}">${esc(d.name)} ↗</button></td><td>${esc(d.brand)}</td><td class="flavor-cell">${esc(statusLabel(d.status))}</td><td>${scoreMarkup(d,'compact')}</td></tr>`).join('')}</tbody></table></div>`;
 results.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>openReview(b.dataset.id)));wireImageFallbacks(results);
}
const dialog=document.querySelector('#review-dialog');
function openReview(id){
 const d=drinks.find(d=>d.id===id);
 document.querySelector('#dialog-content').innerHTML=`<div class="eyebrow">${esc(d.brand.toUpperCase())} / ${esc(d.line.toUpperCase())}</div><div class="product-dialog-heading">${photo(d,'dialog-product')}<div><h2 id="dialog-title">${esc(d.name)}</h2>${scoreMarkup(d)}<span class="availability-tag">${esc(statusLabel(d.status))}</span></div></div><div class="note-label">${d.score===null?'CATALOGUE NOTES':'TASTING NOTES'}</div><p>${esc(d.body)}</p>${sensoryMarkup(d)}${sourceDetails(d)}<p class="sample-note">${d.score===null?'Not yet reviewed. No score has been assigned.':'Personal rating and tasting notes.'} Product images belong to their respective brands.</p>`;
 wireImageFallbacks(dialog);dialog.showModal();
}
wireReviewDialog();
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}));document.querySelector('#search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});render();
