"""Exercise guest ownership using a disposable review; always remove it afterward.
Credentials stay in memory. Existing public reviews and editorial scores stay intact.
"""
import json, secrets, urllib.request, urllib.error
API='https://018z4i407i.execute-api.us-east-1.amazonaws.com'
token=secrets.token_hex(32)
other=secrets.token_hex(32)
def request(path, method='GET', body=None, credential=token):
    req=urllib.request.Request(API+path, data=json.dumps(body).encode() if body is not None else None, method=method, headers={'Content-Type':'application/json','X-Guest-Token':credential})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
_,before=request('/catalogue')
drink=next(d for d in before['drinks'] if d['id']=='alani-blue-slush')
path='/guest/'+drink['id']
version=0
try:
    assert request(path,credential='invalid')[0]==401
    review={**drink['review'],'score':8.2,'notes':'Temporary guest integration check','body':''}
    assert request(path,'PUT',{'version':0,'review':review,'website':'bot.example'})[0]==400
    status,result=request(path,'PUT',{'version':0,'review':review})
    assert status==200,(status,result)
    version=result['version']
    assert request(path,credential=other)[1]['review'] is None
    assert request(path,'DELETE',{'version':version},credential=other)[0] in (404,409)
    status,page=request('/community/'+drink['id'])
    assert page['reviews'][0]['displayName']=='Anonymous'
    assert page['reviews'][0]['review']['score']==8.2
    review['score']=8.3
    status,result=request(path,'PUT',{'version':version,'review':review})
    assert status==200
    version=result['version']
    assert request(path,'PUT',{'version':0,'review':review})[0]==409
    assert request('/editor/reviews/'+drink['id'],'PUT',{'version':1,'review':review})[0] in (401,403)
finally:
    if version:
        status,result=request(path,'DELETE',{'version':version})
        assert status==200,(status,result)
assert request('/catalogue')[1]==before,'Public catalogue must match its original state'
print('PASS: guest create, read, update, delete, anonymous attribution, ownership, stale-write protection, honeypot, and editorial denial; original catalogue restored.')
