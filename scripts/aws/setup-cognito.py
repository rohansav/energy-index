"""Provision the public browser login; no client secret or public registration."""
import importlib.util, json, pathlib
root=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('deploy',root/'scripts/aws/deploy-api.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
aws=m.aws
pools=aws('cognito-idp','list-user-pools','--max-results','60')['UserPools']
pool=next((p for p in pools if p['Name']=='energy-index'),None)
if not pool:
    pool=aws('cognito-idp','create-user-pool','--pool-name','energy-index','--user-pool-tier','ESSENTIALS','--admin-create-user-config',json.dumps({'AllowAdminCreateUserOnly':True}),'--auto-verified-attributes','email','--username-configuration',json.dumps({'CaseSensitive':False}),'--policies',json.dumps({'PasswordPolicy':{'MinimumLength':12,'RequireUppercase':True,'RequireLowercase':True,'RequireNumbers':True,'RequireSymbols':True,'TemporaryPasswordValidityDays':7}}),'--account-recovery-setting',json.dumps({'RecoveryMechanisms':[{'Priority':1,'Name':'verified_email'}]}))['UserPool']
pid=pool['Id']; domain='energy-index-rohansav'
desc=aws('cognito-idp','describe-user-pool','--user-pool-id',pid)['UserPool']
if not desc.get('Domain'): aws('cognito-idp','create-user-pool-domain','--user-pool-id',pid,'--domain',domain,'--managed-login-version','2')
clients=aws('cognito-idp','list-user-pool-clients','--user-pool-id',pid)['UserPoolClients']
client=next((c for c in clients if c['ClientName']=='energy-index-web'),None)
args=['--user-pool-id',pid,'--client-name','energy-index-web','--supported-identity-providers','COGNITO','--allowed-o-auth-flows','code','--allowed-o-auth-scopes','openid','email','profile','--allowed-o-auth-flows-user-pool-client','--callback-urls','https://rohansav.github.io/energy-index/auth/callback/','http://localhost:3000/energy-index/auth/callback/','--logout-urls','https://rohansav.github.io/energy-index/editor/','http://localhost:3000/energy-index/editor/','--prevent-user-existence-errors','ENABLED','--access-token-validity','60','--id-token-validity','60','--refresh-token-validity','7','--token-validity-units',json.dumps({'AccessToken':'minutes','IdToken':'minutes','RefreshToken':'days'})]
if client: client=aws('cognito-idp','update-user-pool-client','--client-id',client['ClientId'],*args)['UserPoolClient']
else: client=aws('cognito-idp','create-user-pool-client','--no-generate-secret',*args)['UserPoolClient']
try: aws('cognito-idp','create-managed-login-branding','--user-pool-id',pid,'--client-id',client['ClientId'],'--use-cognito-provided-values')
except RuntimeError as e:
    if 'ManagedLoginBrandingExists' not in str(e): raise
previous=json.loads((root/'src/lib/auth-config.json').read_text()) if (root/'src/lib/auth-config.json').exists() else {}
config={**previous,'userPoolId':pid,'clientId':client['ClientId'],'authority':f'https://cognito-idp.us-east-1.amazonaws.com/{pid}','domain':f'https://{domain}.auth.us-east-1.amazoncognito.com'}
(root/'src/lib/auth-config.json').write_text(json.dumps(config,indent=2)+'\n')
print(json.dumps(config))
