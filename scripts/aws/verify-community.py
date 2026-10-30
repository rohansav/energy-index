"""Disposable end-to-end member check. Removes its published review and Cognito user.
Credentials stay in process memory and are supplied directly through the AWS SDK.
"""
import importlib.util,json,pathlib,subprocess,secrets,time,urllib.request,urllib.error
root=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('deploy',root/'scripts/aws/deploy-api.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
aws=m.aws
c=json.loads((root/'src/lib/auth-config.json').read_text());pid=c['userPoolId'];cid=c['clientId']
base=json.loads((root/'infra/aws-public.json').read_text())['apiUrl']
import awscli.botocore.session
cognito=awscli.botocore.session.Session(profile='energy-index').create_client('cognito-idp',region_name='us-east-1')
def command(operation,payload):
 return getattr(cognito,operation.replace('-','_'))(**payload)
def request(path,token=None,method='GET',data=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,headers=headers,method=method,data=json.dumps(data).encode() if data is not None else None)
 with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
client=aws('cognito-idp','describe-user-pool-client','--user-pool-id',pid,'--client-id',cid)['UserPoolClient']
allowed=aws('cognito-idp','update-user-pool-client','--generate-cli-skeleton','input')
original={k:v for k,v in client.items() if k in allowed};original['UserPoolId']=pid
updated={**original,'ExplicitAuthFlows':list(set(client.get('ExplicitAuthFlows',[])+['ALLOW_ADMIN_USER_PASSWORD_AUTH']))}
username='energy-integration-'+str(int(time.time()));password=secrets.token_urlsafe(32)+'Aa1!';token=None;version=0;published=False;created=False
before=request('/catalogue');drink=next(d for d in before['drinks'] if d['id']=='alani-blue-slush');id=drink['id']
try:
 command('update-user-pool-client',updated)
 command('admin-create-user',{'UserPoolId':pid,'Username':username,'MessageAction':'SUPPRESS'});created=True
 command('admin-set-user-password',{'UserPoolId':pid,'Username':username,'Password':password,'Permanent':True})
 auth=command('admin-initiate-auth',{'UserPoolId':pid,'ClientId':cid,'AuthFlow':'ADMIN_USER_PASSWORD_AUTH','AuthParameters':{'USERNAME':username,'PASSWORD':password}})
 token=auth['AuthenticationResult']['AccessToken']
 try:request('/editor/reviews',token);raise AssertionError('Member reached editor API')
 except urllib.error.HTTPError as e:assert e.code==403
 assert request(f'/community/{id}/mine',token)['version']==0
 review={**drink['review'],'score':8.2,'sweetness':0,'energy':None,'notes':'Temporary integration verification; removed immediately.','body':''}
 version=request(f'/community/{id}/mine',token,'PUT',{'version':0,'displayName':'Integration check (temporary)','review':review})['version'];published=True
 page=request(f'/community/{id}');assert page['stats']['count']==1 and page['stats']['average']==8.2
 assert page['stats']['sensory']['sweetness']=={'average':0,'count':1}
 assert page['stats']['sensory']['energy']=={'average':None,'count':0}
 review['score']=9.1
 version=request(f'/community/{id}/mine',token,'PUT',{'version':version,'displayName':'Integration check (temporary)','review':review})['version']
 assert request(f'/community/{id}')['stats']['average']==9.1
 try:request(f'/community/{id}/mine',token,'PUT',{'version':1,'displayName':'Integration check (temporary)','review':review});raise AssertionError('Stale write accepted')
 except urllib.error.HTTPError as e:assert e.code==409
 request(f'/community/{id}/mine',token,'DELETE',{'version':version});published=False
 assert request(f'/community/{id}')['stats'] is None
 assert request('/catalogue')==before
 print('PASS: member sign-in, editorial isolation, create, update, exact averages, optional zero/null, conflict, delete, unchanged catalogue.')
finally:
 if published and token:
  own=request(f'/community/{id}/mine',token)
  request(f'/community/{id}/mine',token,'DELETE',{'version':own['version']})
 if created:command('admin-delete-user',{'UserPoolId':pid,'Username':username})
 command('update-user-pool-client',original)
