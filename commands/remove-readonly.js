#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');
const CWD = process.cwd();

// Parse arguments
let folderPath = null;
let isGlobal = false;

for (const arg of args) {
  if (arg === '--global') {
    isGlobal = true;
  } else if (!folderPath) {
    folderPath = arg;
  }
}

if (!folderPath) {
  console.log('Usage: remove-readonly <path> [--global]');
  process.exit(1);
}

// Convert to absolute path
if (!path.isAbsolute(folderPath)) {
  folderPath = path.resolve(CWD, folderPath);
}

// Read settings
if (!fs.existsSync(SETTINGS_FILE)) {
  console.log('Error: settings.json not found');
  process.exit(1);
}

const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));

if (!settings.readonlyFolders) {
  console.log('No read-only folders configured');
  process.exit(0);
}

// Remove folder
let removed = false;

if (isGlobal) {
  const idx = settings.readonlyFolders.global.indexOf(folderPath);
  if (idx !== -1) {
    settings.readonlyFolders.global.splice(idx, 1);
    removed = true;
  }
} else {
  if (settings.readonlyFolders.projects[CWD]) {
    const idx = settings.readonlyFolders.projects[CWD].indexOf(folderPath);
    if (idx !== -1) {
      settings.readonlyFolders.projects[CWD].splice(idx, 1);
      removed = true;
      // Clean up empty array
      if (settings.readonlyFolders.projects[CWD].length === 0) {
        delete settings.readonlyFolders.projects[CWD];
      }
    }
  }
}

if (removed) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  console.log(`✓ Removed read-only: ${folderPath}`);
} else {
  console.log(`Not found: ${folderPath}`);
}
