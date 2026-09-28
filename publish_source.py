import sys,json,os,subprocess,pathlib,termios
fd=sys.stdin.fileno(); old=termios.tcgetattr(fd);new=termios.tcgetattr(fd);new[3]&=~termios.ECHO;termios.tcsetattr(fd,termios.TCSANOW,new)
print('Ready for publishing credential on stdin (input is hidden).',flush=True)
c=json.loads(sys.stdin.readline());termios.tcsetattr(fd,termios.TCSANOW,old)
root=pathlib.Path(__file__).resolve().parent/'solar-system'
env=os.environ.copy();env.update(GIT_TERMINAL_PROMPT='0',GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0='Authorization: Bearer '+c['token'])
def run(args,auth=False):
 r=subprocess.run(args,cwd=root,env=env if auth else None,capture_output=True,text=True)
 if r.returncode: print(r.stdout.replace(c['token'],'[redacted]'),r.stderr.replace(c['token'],'[redacted]'));raise SystemExit(r.returncode)
 return r.stdout.strip()
if not (root/'.git').exists():
 run(['git','init','-b',c['branch']]);run(['git','remote','add','origin',c['remote_url']])
remote=run(['git','ls-remote','origin','refs/heads/'+c['branch']],True)
if remote and remote.split()[0] != run(['git','rev-parse','HEAD']): raise SystemExit('Remote has changed; reconcile it before pushing.')
run(['git','add','-A']);run(['git','commit','-m','Reduce celestial body label font sizes by 35 percent'])
sha=run(['git','rev-parse','HEAD']);run(['git','push','origin','HEAD:refs/heads/'+c['branch']],True)
assert run(['git','ls-remote','origin','refs/heads/'+c['branch']],True).split()[0]==sha
archive=str(root.parent/'solar-system-deploy.tar');run(['git','archive','--format=tar','-o',archive,sha,'.openai/hosting.json','dist'])
import tarfile
with tarfile.open(archive) as t:
 assert 'dist/index.html' in t.getnames() and '.openai/hosting.json' in t.getnames()
print(json.dumps(dict(project_id=json.loads((root/'.openai/hosting.json').read_text())['project_id'],commit_sha=sha,archive=archive)),flush=True)
