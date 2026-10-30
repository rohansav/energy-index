"""Run checked SQL migrations inside the private VPC, then remove the temporary runner.
No database import, network exposure, or credentials printed/written to disk.
"""
import importlib.util, pathlib, json, subprocess, zipfile, time
root=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('deploy',root/'scripts/aws/deploy-api.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
aws=m.aws
folder=root/'dist/schema';folder.mkdir(parents=True,exist_ok=True)
source='''import {databasePool} from "../src/server/database";
import {migrateDatabase} from "../src/server/migrate-database";
export async function handler(){ const pool=databasePool();try{
const fingerprint=async()=> (await pool.query("SELECT md5(jsonb_agg(to_jsonb(r) ORDER BY product_id)::text) AS hash FROM editorial_reviews r")).rows[0].hash;
const before=await fingerprint();await migrateDatabase(pool);
await pool.query("GRANT SELECT,INSERT,UPDATE ON community_users,community_reviews TO energy_app");
await pool.query("GRANT INSERT ON community_review_history TO energy_app");
return {editorialUnchanged:before===await fingerprint(),communityCount:Number((await pool.query('SELECT count(*) AS count FROM community_reviews WHERE NOT deleted')).rows[0].count)};
}finally{await pool.end();}}
'''
entry=root/'dist/schema-entry.ts';entry.write_text(source)
subprocess.run([str(root/'node_modules/.bin/esbuild'),str(entry),'--bundle','--platform=node','--target=node22','--format=cjs','--outfile='+str(folder/'handler.cjs')],cwd=root,check=True)
archive=root/'dist/schema.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 z.write(folder/'handler.cjs','handler.cjs');z.write(root/'infra/rds-ca.pem','rds-ca.pem')
 for f in (root/'migrations').glob('*.sql'):z.write(f,'migrations/'+f.name)
db=aws('rds','describe-db-instances','--db-instance-identifier','energy-index')['DBInstances'][0]
secret=json.loads(aws('secretsmanager','get-secret-value','--secret-id',db['MasterUserSecret']['SecretArn'])['SecretString'])
from urllib.parse import quote
url='postgresql://'+quote(secret['username'],safe='')+':'+quote(secret['password'],safe='')+'@'+db['Endpoint']['Address']+':5432/energy_index'
config=aws('lambda','get-function-configuration','--function-name','energy-index-api')
name='energy-index-schema-'+str(int(time.time()))
created=False
try:
 aws('lambda','create-function','--function-name',name,'--runtime','nodejs22.x','--role',config['Role'],'--handler','handler.handler','--timeout','60','--memory-size','256','--vpc-config',json.dumps({'SubnetIds':config['VpcConfig']['SubnetIds'],'SecurityGroupIds':config['VpcConfig']['SecurityGroupIds']}),'--environment',json.dumps({'Variables':{'DATABASE_URL':url,'DATABASE_CA_FILE':'/var/task/rds-ca.pem'}}),'--zip-file','fileb://'+str(archive));created=True
 aws('lambda','wait','function-active-v2','--function-name',name)
 output=root/'dist/schema-result.json'
 response=aws('lambda','invoke','--function-name',name,str(output))
 result=json.loads(output.read_text())
 if response.get('FunctionError') or not result.get('editorialUnchanged'):raise RuntimeError('Migration failed or editorial fingerprint changed; inspect the schema runner result locally.')
 print(json.dumps(result))
finally:
 if created:aws('lambda','delete-function','--function-name',name)
