"""Deploy the existing catalogue/editor persistence API. No credentials are printed.
Requires an authenticated energy-index AWS CLI profile and .env.aws.json locally.
"""
import json, subprocess, pathlib, time, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
REGION='us-east-1'
BASE=['aws','--profile','energy-index','--region',REGION,'--output','json']
def aws(*args):
    result=subprocess.run(BASE+list(args),text=True,capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr)
    return json.loads(result.stdout) if result.stdout.strip() else {}
def ensure_role(name, policy):
    try: role=aws('iam','get-role','--role-name',name)['Role']
    except RuntimeError as e:
        if 'NoSuchEntity' not in str(e): raise
        role=aws('iam','create-role','--role-name',name,'--assume-role-policy-document',json.dumps({'Version':'2012-10-17','Statement':[{'Effect':'Allow','Principal':{'Service':'lambda.amazonaws.com'},'Action':'sts:AssumeRole'}]}))['Role']
    aws('iam','attach-role-policy','--role-name',name,'--policy-arn','arn:aws:iam::aws:policy/service-role/'+policy)
    return role['Arn']
def function(name,role,handler,env,vpc=None):
    args=['--function-name',name,'--runtime','nodejs22.x','--role',role,'--handler',handler,'--timeout','20','--memory-size','256','--environment',json.dumps({'Variables':env})]
    if vpc: args+=['--vpc-config',json.dumps(vpc)]
    try:
        aws('lambda','get-function','--function-name',name)
        aws('lambda','update-function-code','--function-name',name,'--zip-file','fileb://'+str(ROOT/'dist/api.zip'))
        aws('lambda','wait','function-updated-v2','--function-name',name)
        aws('lambda','update-function-configuration',*args)
    except RuntimeError as e:
        if 'ResourceNotFoundException' not in str(e): raise
        for attempt in range(12):
            try:
                aws('lambda','create-function',*args,'--zip-file','fileb://'+str(ROOT/'dist/api.zip'))
                break
            except RuntimeError as e:
                if 'cannot be assumed' not in str(e) or attempt==11: raise
                time.sleep(5)
    aws('lambda','wait','function-active-v2','--function-name',name)
    return aws('lambda','get-function','--function-name',name)['Configuration']['FunctionArn']

if __name__=='__main__':
    config=json.loads((ROOT/'.env.aws.json').read_text())
    account=aws('sts','get-caller-identity')['Account']
    groups=aws('ec2','describe-security-groups','--filters','Name=group-name,Values=energy-index-api','Name=vpc-id,Values=vpc-0c274146ca6788981')['SecurityGroups']
    sg=groups[0]['GroupId'] if groups else aws('ec2','create-security-group','--group-name','energy-index-api','--description','Energy Index private Lambda database clients','--vpc-id','vpc-0c274146ca6788981')['GroupId']
    try: aws('ec2','authorize-security-group-ingress','--group-id','sg-0f4029cde5ceef5af','--protocol','tcp','--port','5432','--source-group',sg)
    except RuntimeError as e:
        if 'InvalidPermission.Duplicate' not in str(e): raise
    with zipfile.ZipFile(ROOT/'dist/api.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for file in (ROOT/'dist/api').iterdir(): archive.write(file,file.name)
    role=ensure_role('energy-index-api','AWSLambdaVPCAccessExecutionRole')
    authRole=ensure_role('energy-index-authorizer','AWSLambdaBasicExecutionRole')
    apiArn=function('energy-index-api',role,'handler.handler',{'DATABASE_URL':config['appUrl'],'DATABASE_CA_FILE':'/var/task/rds-ca.pem'}, {'SubnetIds':['subnet-0eb2c46f898a6654a','subnet-0bc592c05c05cbb1f'],'SecurityGroupIds':[sg]})
    authConfig=json.loads((ROOT/'src/lib/auth-config.json').read_text())
    authEnv={'COGNITO_USER_POOL_ID':authConfig['userPoolId'],'COGNITO_CLIENT_ID':authConfig['clientId'],'EDITOR_COGNITO_SUB':authConfig.get('editorSub','')}
    if not authConfig.get('legacyDisabled'): authEnv['EDITOR_GITHUB_ID']='33819259'
    authArn=function('energy-index-authorizer',authRole,'authorizer.handler',authEnv)
    apis=aws('apigatewayv2','get-apis')['Items']
    api=next((api for api in apis if api['Name']=='energy-index'),None)
    if not api: api=aws('apigatewayv2','create-api','--name','energy-index','--protocol-type','HTTP')
    apiId=api['ApiId']
    aws('apigatewayv2','update-api','--api-id',apiId,'--cors-configuration',json.dumps({'AllowOrigins':['https://rohansav.github.io','https://brilliant-pavlova-12976b.netlify.app'],'AllowMethods':['GET','PUT','OPTIONS'],'AllowHeaders':['authorization','content-type'],'MaxAge':300}))
    integrations=aws('apigatewayv2','get-integrations','--api-id',apiId)['Items']
    integration=integrations[0] if integrations else aws('apigatewayv2','create-integration','--api-id',apiId,'--integration-type','AWS_PROXY','--integration-uri',apiArn,'--payload-format-version','2.0')
    authorizers=aws('apigatewayv2','get-authorizers','--api-id',apiId)['Items']
    authorizer=authorizers[0] if authorizers else aws('apigatewayv2','create-authorizer','--api-id',apiId,'--name','github-owner','--authorizer-type','REQUEST','--authorizer-uri',f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{authArn}/invocations','--identity-source','$request.header.Authorization','--authorizer-payload-format-version','2.0','--enable-simple-responses','--authorizer-result-ttl-in-seconds','0')
    routes=aws('apigatewayv2','get-routes','--api-id',apiId)['Items']
    for key in ['GET /catalogue','GET /editor/reviews','GET /editor/reviews/{id}','PUT /editor/reviews/{id}']:
        args=['--api-id',apiId,'--route-key',key,'--target','integrations/'+integration['IntegrationId']]
        if key!='GET /catalogue': args+=['--authorization-type','CUSTOM','--authorizer-id',authorizer['AuthorizerId']]
        else: args+=['--authorization-type','NONE']
        existing=next((r for r in routes if r['RouteKey']==key),None)
        if existing: aws('apigatewayv2','update-route','--route-id',existing['RouteId'],*args)
        else: aws('apigatewayv2','create-route',*args)
    stages=aws('apigatewayv2','get-stages','--api-id',apiId)['Items']
    op='update-stage' if stages else 'create-stage'
    aws('apigatewayv2',op,'--api-id',apiId,'--stage-name','$default','--auto-deploy','--default-route-settings',json.dumps({'ThrottlingBurstLimit':20,'ThrottlingRateLimit':10}))
    for name,suffix in [('energy-index-api','/*/*'),('energy-index-authorizer','/authorizers/*')]:
        try: aws('lambda','add-permission','--function-name',name,'--statement-id','energy-http-api','--action','lambda:InvokeFunction','--principal','apigateway.amazonaws.com','--source-arn',f'arn:aws:execute-api:{REGION}:{account}:{apiId}'+suffix)
        except RuntimeError as e:
            if 'ResourceConflictException' not in str(e): raise
    for name in ['energy-index-api','energy-index-authorizer']:
        try: aws('logs','create-log-group','--log-group-name','/aws/lambda/'+name)
        except RuntimeError as e:
            if 'ResourceAlreadyExistsException' not in str(e): raise
        aws('logs','put-retention-policy','--log-group-name','/aws/lambda/'+name,'--retention-in-days','14')
    (ROOT/'infra/aws-public.json').write_text(json.dumps({'region':REGION,'database':'energy-index','apiUrl':api['ApiEndpoint'],'apiId':apiId},indent=2)+'\n')
    print('API deployed: '+api['ApiEndpoint'])
