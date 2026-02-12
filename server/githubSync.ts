import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const REPO_NAME = 'Afrokaviar2.1';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  'dist',
  '.replit',
  'replit.nix',
  '.upm',
  '.config',
  'package-lock.json',
  '.local',
  '/tmp',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (shouldIgnore(fullPath)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

export async function syncToGitHub(): Promise<string> {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
  
  console.log(`[GitHub Sync] Starting sync at ${timestamp}...`);
  
  const octokit = await getGitHubClient();
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`[GitHub Sync] Authenticated as: ${user.login}`);

  try {
    await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description: 'Afrokaviar - Premium Afro-futurist culture operating system for the diaspora',
      private: false,
      auto_init: true,
    });
    console.log(`[GitHub Sync] Repository ${REPO_NAME} created`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: any) {
    if (error.status === 422) {
      console.log(`[GitHub Sync] Repository ${REPO_NAME} exists, updating...`);
    } else {
      throw error;
    }
  }

  const files = getAllFiles('.');
  console.log(`[GitHub Sync] Found ${files.length} files`);

  let mainSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    mainSha = ref.object.sha;
  } catch {
    console.log('[GitHub Sync] No main branch yet, will create one');
  }

  const treeItems: { path: string; mode: '100644'; type: 'blob'; content: string }[] = [];
  
  for (const filePath of files) {
    const relativePath = filePath.startsWith('./') ? filePath.slice(2) : filePath;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      treeItems.push({ path: relativePath, mode: '100644', type: 'blob', content });
    } catch {
      console.log(`[GitHub Sync] Skipped (binary): ${relativePath}`);
    }
  }

  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: REPO_NAME,
    tree: treeItems,
    base_tree: mainSha,
  });

  const commitMessage = `Nightly sync - ${timestamp}`;
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: REPO_NAME,
    message: commitMessage,
    tree: tree.sha,
    parents: mainSha ? [mainSha] : [],
  });

  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commit.sha,
    });
  } catch {
    await octokit.git.createRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }

  const repoUrl = `https://github.com/${user.login}/${REPO_NAME}`;
  console.log(`[GitHub Sync] Sync complete: ${repoUrl}`);
  return repoUrl;
}

export function startGitHubSyncScheduler() {
  cron.schedule('0 23 * * *', async () => {
    try {
      await syncToGitHub();
    } catch (error) {
      console.error('[GitHub Sync] Scheduled sync failed:', error);
    }
  }, {
    timezone: 'UTC'
  });
  console.log('[GitHub Sync] Scheduler started - will sync to GitHub daily at 11:00 PM UTC');
}
