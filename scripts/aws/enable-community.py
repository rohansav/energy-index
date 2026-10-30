"""Enable verified-email self-registration while preserving existing pool settings."""
import importlib.util,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('deploy',root/'scripts/aws/deploy-api.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
aws=m.aws
config=json.loads((root/'src/lib/auth-config.json').read_text());pid=config['userPoolId']
pool=aws('cognito-idp','describe-user-pool','--user-pool-id',pid)['UserPool']
allowed=aws('cognito-idp','update-user-pool','--generate-cli-skeleton','input')
update={key:value for key,value in pool.items() if key in allowed}
update['UserPoolId']=pid
update['AdminCreateUserConfig']={**pool.get('AdminCreateUserConfig',{}),'AllowAdminCreateUserOnly':False}
update['AutoVerifiedAttributes']=['email']
import awscli.botocore.session
client=awscli.botocore.session.Session(profile='energy-index').create_client('cognito-idp',region_name='us-east-1')
client.update_user_pool(**update)
print('Community signup enabled; email confirmation required. Existing editor account preserved.')
