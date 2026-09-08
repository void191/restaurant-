const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const remoteUrl = process.argv[2] || 'https://github.com/void191/restaurant-.git';

async function main() {
  console.log('Target Remote:', remoteUrl);

  try {
    await git.init({ fs, dir });
  } catch (e) {}

  console.log('Staging files...');
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
  try {
    const sha = await git.commit({
      fs,
      dir,
      author: {
        name: 'Antigravity Agent',
        email: 'agent@antigravity.dev',
      },
      message: 'feat: Multi-Role Restaurant Ordering System with real-time ticket rail and location capture',
    });
    console.log('Committed commit SHA:', sha);
  } catch (e) {
    console.log('Commit note:', e.message);
  }

  // Create/switch to main branch
  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {
    // If already exists
  }

  // Set remote
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
  } catch {
    await git.deleteRemote({ fs, dir, remote: 'origin' }).catch(() => {});
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
  }

  const currentBranch = (await git.currentBranch({ fs, dir })) || 'main';
  console.log(`Current branch: ${currentBranch}`);
  console.log(`Pushing ${currentBranch} to ${remoteUrl}...`);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: currentBranch,
    force: true,
    onAuth: () => {
      if (token) {
        return { username: token, password: '' };
      }
      return undefined;
    },
  });

  console.log('Push Result:', pushResult);
  console.log('Successfully pushed to GitHub repository!');
}

main().catch((err) => {
  console.error('Git Push Error:', err.message || err);
  process.exit(1);
});
