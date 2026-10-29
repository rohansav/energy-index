const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function collectReviews(directory=path.join(root,'reviews')){
 const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
 const catalogue=vm.runInContext('drinks',ctx),fields=vm.runInContext('ratingFields',ctx);
 const known=new Map(catalogue.map(d=>[d.id,d])),seen=new Set();
 return fs.readdirSync(directory).filter(f=>f.endsWith('.json')).sort().map(file=>{
  const d=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
  if(!known.has(d.id)||file!==d.id+'.json'||seen.has(d.id))throw Error('Invalid review identity: '+file);
  seen.add(d.id);const original=known.get(d.id);
  if(d.name!==original.name||d.brand!==original.brand)throw Error('Changed product identity: '+file);
  const result={id:d.id};
  for(const field of fields){
   const raw=d[field.key],value=raw===null||raw===undefined||raw===''?null:Number(raw);
   if((typeof raw!=='string'&&typeof raw!=='number'&&raw!=null)||!vm.runInContext(`validRating(${Number.isFinite(value)?value:value===null?'null':'NaN'},ratingFields.find(f=>f.key==='${field.key}'))`,ctx))throw Error('Invalid '+field.key+' in '+file);
   result[field.key]=value;
  }
  for(const key of ['notes','body']){if(d[key]!=null&&typeof d[key]!=='string')throw Error('Invalid '+key+' in '+file);result[key]=(d[key]||'').trim();if(result[key].length>(key==='notes'?300:20000))throw Error(key+' too long in '+file);}
  return result;
 });
}
function build(){
 const reviews=collectReviews(),out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
 for(const file of ['index.html','brand.html','data.js','app.js','brand.js','style.css','.nojekyll'])fs.copyFileSync(path.join(root,file),path.join(out,file));
 for(const folder of ['assets','admin'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
 // Keep OAuth on the Netlify origin; Pages remains the public catalogue host.
 fs.writeFileSync(path.join(out,'admin','index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=https://brilliant-pavlova-12976b.netlify.app/"><title>Open review editor</title></head><body><p><a href="https://brilliant-pavlova-12976b.netlify.app/">Open the review editor</a></p></body></html>');
 // JSON encoding keeps author-supplied prose inert; the UI escapes it before rendering.
 const script=`const savedReviews=${JSON.stringify(reviews)};\nfor(const review of savedReviews){const drink=drinks.find(d=>d.id===review.id);if(!drink)continue;for(const key of ['score','sweetness','tartness','dryness'])drink[key]=review[key];if(review.notes)drink.notes=review.notes;if(review.body)drink.body=review.body;else if(review.score!==null)drink.body='Rated personally. Written notes have not been added yet.';}\n`;
 fs.writeFileSync(path.join(out,'reviews.js'),script);
 // Change the ratings URL on every content change so cached scripts cannot hide a new review.
 const revision=require('node:crypto').createHash('sha256').update(script).digest('hex').slice(0,16);
 for(const page of ['index.html','brand.html']){
  const file=path.join(out,page);
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('src="reviews.js"',`src="reviews.js?v=${revision}"`));
 }
 console.log('Built '+reviews.length+' reviews ('+reviews.filter(d=>d.score!==null).length+' rated)');
}
if(require.main===module)build();module.exports={collectReviews,build};
