#!/usr/bin/env node
/**
 * Claude Code ReadOnly - Cross-platform installer
 *
 * Usage:
 *   Local:  node install.js
 *   Remote: curl -fsSL https://raw.githubusercontent.com/PublikoFR/Claude-Code-ReadOnly/main/install.js | node
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

// GitHub raw URLs (update with your repo)
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/PublikoFR/Claude-Code-ReadOnly/main';

const FILES_TO_INSTALL = {
  'hooks/protect-readonly.js': 'hooks/protect-readonly.js',
  'commands/list-readonly.md': 'commands/list-readonly.md',
  'commands/list-readonly.js': 'commands/list-readonly.js',
  'commands/add-readonly.md': 'commands/add-readonly.md',
  'commands/add-readonly.js': 'commands/add-readonly.js',
  'commands/remove-readonly.md': 'commands/remove-readonly.md',
  'commands/remove-readonly.js': 'commands/remove-readonly.js',
};

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = {
  info: (msg) => console.log(`${c.cyan}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
};

// Paths
const HOME_DIR = os.homedir();
const CLAUDE_DIR = path.join(HOME_DIR, '.claude');
const PLATFORM = os.platform();

// Check if running locally (with source files) or remotely (via curl | node)
function isLocalInstall() {
  try {
    const scriptDir = __dirname;
    const hookPath = path.join(scriptDir, 'hooks', 'protect-readonly.js');
    return fs.existsSync(hookPath);
  } catch {
    return false;
  }
}

// Download file from URL
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Install a file (from local or remote)
async function installFile(sourceFile, targetFile, isLocal, scriptDir) {
  const targetPath = path.join(CLAUDE_DIR, targetFile);
  ensureDir(path.dirname(targetPath));

  try {
    let content;
    if (isLocal) {
      const sourcePath = path.join(scriptDir, sourceFile);
      content = fs.readFileSync(sourcePath, 'utf8');
    } else {
      const url = `${GITHUB_RAW_BASE}/${sourceFile}`;
      content = await downloadFile(url);
    }

    fs.writeFileSync(targetPath, content);

    // Make executable on Unix
    if (targetFile.endsWith('.js') && PLATFORM !== 'win32') {
      fs.chmodSync(targetPath, '755');
    }

    log.success(`Installed: ${path.basename(targetFile)}`);
  } catch (error) {
    log.error(`Failed: ${path.basename(targetFile)} - ${error.message}`);
  }
}

// Initialize readonlyFolders in settings.json
function initConfig() {
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');

  // Migrate from old readonly-config.json if exists
  const oldConfigPath = path.join(CLAUDE_DIR, 'readonly-config.json');
  let migratedConfig = null;
  if (fs.existsSync(oldConfigPath)) {
    try {
      migratedConfig = JSON.parse(fs.readFileSync(oldConfigPath, 'utf8'));
      fs.unlinkSync(oldConfigPath);
      log.info('Migrated: readonly-config.json → settings.json');
    } catch {}
  }

  if (!fs.existsSync(settingsPath)) {
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    if (!settings.readonlyFolders) {
      settings.readonlyFolders = migratedConfig || { projects: {}, global: [] };
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      log.success('Added: readonlyFolders to settings.json');
    } else if (migratedConfig) {
      settings.readonlyFolders.projects = {
        ...settings.readonlyFolders.projects,
        ...migratedConfig.projects
      };
      settings.readonlyFolders.global = [
        ...new Set([...settings.readonlyFolders.global, ...migratedConfig.global])
      ];
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      log.success('Merged: migrated config into settings.json');
    } else {
      log.info('Exists: readonlyFolders in settings.json');
    }
  } catch (error) {
    log.warn(`Could not update settings.json: ${error.message}`);
  }
}

// Get hook command for settings.json
function getHookCommand() {
  const hookPath = path.join(CLAUDE_DIR, 'hooks', 'protect-readonly.js');
  return `node "${hookPath.replace(/\\/g, '/')}"`;
}

// Update settings.json with hook
function updateSettings() {
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  const hookCommand = getHookCommand();

  if (!fs.existsSync(settingsPath)) {
    log.warn('settings.json not found - creating minimal config');
    const newSettings = {
      hooks: {
        PreToolUse: [{
          matcher: 'Bash',
          hooks: [{
            type: 'command',
            command: hookCommand,
            timeout: 5
          }]
        }]
      },
      readonlyFolders: { projects: {}, global: [] }
    };
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
    log.success('Created: settings.json');
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    if (JSON.stringify(settings).includes('protect-readonly')) {
      const settingsStr = fs.readFileSync(settingsPath, 'utf8');
      const updatedStr = settingsStr.replace(
        /protect-readonly\.(sh|ps1|js)"/g,
        'protect-readonly.js"'
      ).replace(
        /"command":\s*"[^"]*protect-readonly\.js"/g,
        `"command": "${hookCommand.replace(/\\/g, '\\\\')}"`
      );
      fs.writeFileSync(settingsPath, updatedStr);
      log.success('Updated: settings.json hook path');
      return;
    }

    if (!settings.hooks) settings.hooks = {};
    if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

    settings.hooks.PreToolUse.push({
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: hookCommand,
        timeout: 5
      }]
    });

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    log.success('Added: PreToolUse hook to settings.json');

  } catch (error) {
    log.error(`Failed to update settings.json: ${error.message}`);
  }
}

// Cleanup old files
function cleanup() {
  // Old files from previous versions (for users upgrading)
  const oldFiles = [
    path.join(CLAUDE_DIR, 'readonly-config.json'), // Migrated to settings.json
  ];

  for (const file of oldFiles) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        log.info(`Removed old: ${path.basename(file)}`);
      } catch {}
    }
  }
}

// Main
async function install() {
  const isLocal = isLocalInstall();
  const scriptDir = isLocal ? __dirname : null;

  console.log(`
${c.cyan}╔══════════════════════════════════════╗
║   Claude Code ReadOnly - Installer   ║
╚══════════════════════════════════════╝${c.reset}
`);

  log.info(`Platform: ${PLATFORM}`);
  log.info(`Mode: ${isLocal ? 'local' : 'remote'}`);
  console.log('');

  // 1. Create directories
  log.info('Creating directories...');
  ensureDir(path.join(CLAUDE_DIR, 'hooks'));
  ensureDir(path.join(CLAUDE_DIR, 'commands'));

  // 2. Install files
  console.log('');
  log.info('Installing files...');
  for (const [source, target] of Object.entries(FILES_TO_INSTALL)) {
    await installFile(source, target, isLocal, scriptDir);
  }

  // 3. Initialize config
  console.log('');
  log.info('Configuring...');
  initConfig();
  updateSettings();

  // 4. Cleanup
  console.log('');
  log.info('Cleaning up...');
  cleanup();

  // Done
  console.log(`
${c.green}╔══════════════════════════════════════╗
║       Installation complete!         ║
╚══════════════════════════════════════╝${c.reset}

${c.cyan}Commands available:${c.reset}
  /list-readonly                List protected folders
  /add-readonly <path>          Add folder (project-specific)
  /add-readonly <path> --global Add folder (all projects)
  /remove-readonly <path>       Remove folder

${c.dim}Restart Claude Code to apply changes.${c.reset}
`);
}

install().catch(err => {
  log.error(`Installation failed: ${err.message}`);
  process.exit(1);
});
