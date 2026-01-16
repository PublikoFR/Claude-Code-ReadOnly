#!/usr/bin/env node
/**
 * Claude Code ReadOnly - PreToolUse Hook
 * Protects folders from modifications (cross-platform, no dependencies)
 * Config is stored in ~/.claude/settings.json under "readonlyFolders"
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Config path
const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

// Safe commands (read-only operations)
const SAFE_PATTERNS = [
  /^ls\b/, /^dir\b/, /^Get-ChildItem\b/,
  /^cat\s+[^>|]+$/, /^type\s/, /^Get-Content\b/,
  /^head\s/, /^tail\s/,
  /^grep\s/, /^rg\s/, /^grepai\s/, /^Select-String\b/,
  /^find\s.*-name/, /^find\s.*-type/, /^find\s.*-print/,
  /^file\s/, /^wc\s/, /^diff\s/,
  /^less\s/, /^more\s/, /^bat\s/,
  /^tree\b/, /^stat\s/, /^du\s/,
  /^realpath\s/, /^basename\s/, /^dirname\s/,
  /^readlink\s/, /^pwd\b/,
  /^md5sum\s/, /^sha256sum\s/,
  /^xxd\s/, /^hexdump\s/, /^strings\s/,
];

// Dangerous commands (write operations)
const DANGEROUS_PATTERNS = [
  /^rm\s/, /\srm\s/, /&&\s*rm\s/, /;\s*rm\s/,
  /^del\s/, /^Remove-Item\b/, /^erase\s/,
  /^mv\s/, /\smv\s/, /^move\s/, /^Move-Item\b/,
  /^cp\s/, /\scp\s/, /^copy\s/, /^Copy-Item\b/,
  /^touch\s/, /\stouch\s/, /^New-Item\b/,
  /^mkdir\s/, /\smkdir\s/, /^md\s/,
  /^rmdir\s/, /^rd\s/,
  /^echo\s.*>/, /\secho\s.*>/,
  /^printf\s.*>/,
  /^cat\s.*>/, /\scat\s.*>/,
  /^Set-Content\b/, /^Out-File\b/, /^Add-Content\b/,
  /\s>\s/, /\s>>\s/, /^>/, /^>>/,
  /^tee\s/, /\stee\s/,
  /^sed\s+-i/, /\ssed\s+-i/,
  /^chmod\s/, /\schmod\s/, /^icacls\s/,
  /^chown\s/, /\schown\s/,
  /^truncate\s/,
  /^dd\s/, /\sdd\s/,
  /^ln\s/, /\sln\s/,
  /^unlink\s/, /^shred\s/,
  /^install\s/, /\sinstall\s/,
  /^git\s+checkout/, /^git\s+reset/, /^git\s+clean/, /^git\s+rm/,
];

function isSafeCommand(cmd) {
  return SAFE_PATTERNS.some(pattern => pattern.test(cmd));
}

function isDangerousCommand(cmd) {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(cmd));
}

function getProtectedFolders(currentDir) {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return [];
  }

  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    const config = settings.readonlyFolders;

    if (!config) {
      return [];
    }

    const folders = [];

    // Project-specific folders
    if (config.projects && config.projects[currentDir]) {
      folders.push(...config.projects[currentDir]);
    }

    // Global folders
    if (config.global && Array.isArray(config.global)) {
      folders.push(...config.global);
    }

    return folders;
  } catch {
    return [];
  }
}

function main() {
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });

  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const command = data?.tool_input?.command || '';
      const currentDir = data?.cwd || process.cwd();

      if (!command) {
        process.exit(0);
      }

      const protectedFolders = getProtectedFolders(currentDir);

      if (protectedFolders.length === 0) {
        process.exit(0);
      }

      for (const folder of protectedFolders) {
        if (!folder) continue;

        if (command.includes(folder)) {
          if (isSafeCommand(command)) {
            process.exit(0);
          }

          if (isDangerousCommand(command)) {
            const folderName = path.basename(folder);
            const response = {
              decision: 'block',
              reason: `Read-only: ${folderName}`
            };
            console.log(JSON.stringify(response));
            process.exit(0);
          }
        }
      }

      process.exit(0);

    } catch {
      process.exit(0);
    }
  });
}

main();
