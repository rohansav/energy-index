/* Decap stores only review content; GitHub enforces repository write permission. */
const message=document.querySelector('#setup-message');
if(!window.ENERGY_AUTH){
 message.textContent='The review editor is prepared, but GitHub sign-in has not been connected yet. Publishing is disabled until the authentication service is configured.';
}else{
 const script=document.createElement('script');
 script.src='https://unpkg.com/decap-cms@3.17.3/dist/decap-cms.js';
 script.onerror=()=>{message.textContent='The editor could not load. Check your connection and reload. Your published reviews have not changed.';};
 script.onload=()=>{
  const choices=(min,max)=>[{label:'Not rated',value:''},...Array.from({length:Math.round((max-min)*10)+1},(_,i)=>{const value=(min+i/10).toFixed(1);return {label:value,value};})];
  const rating=(label,name,min,max)=>({label,name,widget:'select',required:false,options:choices(min,max),hint:`${min.toFixed(1)}–${max.toFixed(1)} in 0.1 increments. Choose Not rated to clear.`});
  CMS.init({config:{load_config_file:false,backend:{name:'github',auth_scope:'public_repo',repo:'rohansav/energy-index',branch:'main',...window.ENERGY_AUTH},site_url:'https://rohansav.github.io/energy-index/',display_url:'https://rohansav.github.io/energy-index/',media_folder:'assets/uploads',publish_mode:'simple',editor:{preview:false},collections:[{name:'reviews',label:'Drink reviews',label_singular:'Drink review',folder:'reviews',extension:'json',format:'json',create:false,delete:false,identifier_field:'name',summary:'{{brand}} — {{name}}',sortable_fields:['brand','name','score'],view_filters:[{label:'Rated',field:'score',pattern:'^[0-9]'}],fields:[{name:'id',widget:'hidden'},{name:'brand',widget:'hidden'},{name:'name',widget:'hidden'},rating('Overall','score',1,10),rating('Sweetness','sweetness',0,5),rating('Tartness','tartness',0,5),rating('Dryness','dryness',0,5),{label:'Short summary',name:'notes',widget:'string',required:false,hint:'Optional short line under the drink name.',pattern:['^.{0,300}$','Use no more than 300 characters.']},{label:'Your notes',name:'body',widget:'text',required:false,hint:'Write your review in plain text. Publish saves it to GitHub; the public site updates after deployment.'}]}]}});
  document.querySelector('#editor-loading').remove();
 };
 document.head.append(script);
}
