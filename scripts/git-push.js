const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const remoteUrl = process.argv[2] || 'https://github.com/void191/restaurant-.git';

async function main() {
  console.log('Target Remote:', remoteUrl);

  await git.init({ fs, dir });

  console.log('Staging files (respecting .gitignore)...');
  const files = await git.statusMatrix({ fs, dir });
  
  for (const [filepath, head, workdir, stage] of files) {
    if (workdir !== head) {
      if (workdir === 0) {
        await git.remove({ fs, dir, filepath });
      } else {
        await git.add({ fs, dir, filepath });
      }
    }
  }

  console.log('Committing changes...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Antigravity Agent',
      email: 'agent@antigravity.dev',
    },
    message: 'feat: Complete Restaurant Ordering System with Electron Desktop App & Windows Setup Installer',
  });
  console.log('Committed commit SHA:', sha);

  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {}

  await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  console.log('Pushing to GitHub with force flag...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token, password: '' }),
  });

  console.log('Push Result:', pushResult);
  console.log('Successfully pushed to GitHub repository!');
}

main().catch((err) => {
  console.error('Git Push Error:', err.message || err);
  process.exit(1);
});
