const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup(search=''){
 const nodes=new Map();
 const defaultValues={'#brand-sort':'score','#line-filter':'all','#status-filter':'all','#review-filter':'all'};
 function node(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:defaultValues[key]||'',handlers:{},style:{setProperty(){}},querySelectorAll(){return []},addEventListener(type,fn){this.handlers[type]=fn},showModal(){this.open=true},close(){this.open=false}});return nodes.get(key)}
 const context=vm.createContext({URLSearchParams,location:{search},document:{querySelector:node,querySelectorAll(){return []}}});
 const run=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 run('data.js');return {context,node,run};
}
test('catalogue entries have stable unique IDs, official sources, local photos and valid review states',()=>{
 const {context}=setup();const ds=vm.runInContext('drinks',context);
 assert(ds.length>=150);assert.equal(new Set(ds.map(d=>d.id)).size,ds.length);
 const approved=['monsterenergy.com','celsius.com','bloomnu.com','redbull.com','drinkghost.com','alaninu.com','bevnet.com'];
 for(const d of ds){assert(approved.some(h=>new URL(d.source).hostname===h||new URL(d.source).hostname.endsWith('.'+h)),d.id);assert(d.image?.startsWith('assets/drinks/'),d.id);assert(fs.statSync(path.join(root,d.image)).size>1000,d.id);assert(d.imageWidth>0&&d.imageWidth<=320);assert(d.imageHeight>0&&d.imageHeight<=480);assert(d.score===null||d.score>=0&&d.score<=10);for(const f of vm.runInContext('ratingFields',context))assert(vm.runInContext(`validRating(${JSON.stringify(d[f.key])},ratingFields.find(f=>f.key==='${f.key}'))`,context),d.id+' '+f.key);}
 assert(ds.every(d=>!('sampleReview' in d)));
});
test('rankings keep unrated flavors after rated entries, without changing source order',()=>{
 const {context}=setup();assert.equal(vm.runInContext(`(()=>{const a=[{name:'Z',score:null},{name:'B',score:8},{name:'A',score:null}];return ordered(a).map(x=>x.name).join(',')==='B,A,Z'&&a[0].name==='Z'})()`,context),true);
});
test('homepage keeps four previews per brand and shows full catalogue counts',()=>{
 const {context,node,run}=setup();run('app.js');const html=node('#review-results').innerHTML;
 assert.equal((html.match(/class="brand-panel"/g)||[]).length,6);assert.equal((html.match(/class="drink-row photo-row"/g)||[]).length,24);assert.equal(node('#drink-count').textContent,vm.runInContext('drinks.length',context));
 vm.runInContext("state.query='bloom';render()",context);assert.match(node('#result-count').textContent,/1 BRANDS/);
 vm.runInContext("state.query='';state.view='all';render()",context);assert.equal((node('#review-results').innerHTML.match(/<tr>/g)||[]).length,vm.runInContext('drinks.length+1',context));
 vm.runInContext("state.query='<img src=x>';render()",context);assert.match(node('#review-results').innerHTML,/No matches/);
 vm.runInContext("openReview(drinks.find(d=>d.score===null).id)",context);assert(node('#review-dialog').open);assert.match(node('#dialog-content').innerHTML,/No score has been assigned/);
});
test('all six brand pages render full lists, and filters work together',()=>{
 for(const brand of ['monster','celsius','bloom','red-bull','ghost','alani']){
  const {context,node,run}=setup('?brand='+brand);run('brand.js');const count=vm.runInContext('drinks.filter(d=>brandSlug(d.brand)===slug).length',context);assert.equal((node('#brand-rows').innerHTML.match(/class="excerpt-row"/g)||[]).length,count);
  node('#review-filter').value='unrated';node('#review-filter').handlers.change();assert(!node('#brand-rows').innerHTML.includes('OUT OF 10'));
  node('#brand-search').value='no such flavor';node('#brand-search').handlers.input();assert.match(node('#brand-rows').innerHTML,/No flavors match/);
  node('#brand-search').value='';node('#review-filter').value='all';node('#status-filter').value='limited';node('#status-filter').handlers.change();const limited=vm.runInContext("drinks.filter(d=>brandSlug(d.brand)===slug&&d.status==='limited').length",context);assert.equal((node('#brand-rows').innerHTML.match(/class="excerpt-row"/g)||[]).length,limited);
 }
});
test('unknown brands fail gracefully and external text is escaped',()=>{
 const {context,node,run}=setup('?brand=unknown');run('brand.js');assert.match(node('#brand-page').innerHTML,/Brand not found/);assert.equal(vm.runInContext(`esc('<script>"&')`,context),'&lt;script&gt;&quot;&amp;');
});

test('ratings preserve tenths, distinguish missing from zero, and reject invalid precision',()=>{
 const {context,node,run}=setup();
 assert.equal(vm.runInContext(`ratingFields.every(f=>validRating(null,f)&&validRating(f.min,f)&&validRating(f.max,f)&&validRating(3.7,f)&&!validRating(3.75,f)&&!validRating(f.max+0.1,f)&&!validRating('3.7',f)&&!validRating(NaN,f))`,context),true);
 const profile=vm.runInContext(`sensoryMarkup({sweetness:0,tartness:3.7,dryness:null,alertness:{effect:'Slight lift',context:'<script>',jitters:'None'}})`,context);
 assert.match(profile,/0.0 <small>/);assert.match(profile,/3.7 <small>/);assert.match(profile,/Not rated/);assert.match(profile,/&lt;script&gt;/);assert(!profile.includes('<script>'));
 run('app.js');node('#about-button').handlers.click();assert(node('#review-dialog').open);assert.match(node('#dialog-content').innerHTML,/not an average or a weighted formula/);assert.match(node('#dialog-content').innerHTML,/0.1 increments/);node('.close-dialog').handlers.click();assert(!node('#review-dialog').open);
 const brand=setup('?brand=monster');brand.run('brand.js');brand.node('#about-button').handlers.click();assert.match(brand.node('#dialog-content').innerHTML,/One verdict. Three dimensions/);
});

test('real ratings drive rankings and reviewed labels without changing unrelated entries',()=>{
 const {context,node,run}=setup('?brand=monster');
 vm.runInContext(`const target=drinks.find(d=>d.brand==='Monster');target.score=8.6;target.sweetness=3.2;target.body='My actual review';`,context);
 run('brand.js');node('#review-filter').value='rated';node('#review-filter').handlers.change();
 assert.equal((node('#brand-rows').innerHTML.match(/class="excerpt-row"/g)||[]).length,1);
 assert.match(node('#brand-rows').innerHTML,/My actual review/);assert.match(node('#brand-rows').innerHTML,/8.6/);assert(!node('#brand-rows').innerHTML.includes('No personal tasting notes'));
 run('app.js');vm.runInContext('openReview(target.id)',context);assert.match(node('#dialog-content').innerHTML,/TASTING NOTES/);assert(!node('#dialog-content').innerHTML.includes('Not yet reviewed'));
});
