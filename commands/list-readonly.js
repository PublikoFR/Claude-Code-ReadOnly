#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');
const CWD = process.cwd();

// Read settings
if (!fs.existsSync(SETTINGS_FILE)) {
  console.log('No settings.json found');
  process.exit(0);
}

const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
const config = settings.readonlyFolders;

if (!config) {
  console.log('No read-only folders configured');
  process.exit(0);
}

console.log('\n📁 Read-only folders\n');
console.log(`Current project: ${CWD}\n`);

// Project folders
const projectFolders = config.projects?.[CWD] || [];
if (projectFolders.length > 0) {
  console.log('Project-specific:');
  for (const folder of projectFolders) {
    console.log(`  • ${folder}`);
  }
} else {
  console.log('Project-specific: (none)');
}

// Global folders
console.log('');
if (config.global?.length > 0) {
  console.log('Global:');
  for (const folder of config.global) {
    console.log(`  • ${folder}`);
  }
} else {
  console.log('Global: (none)');
}

const total = projectFolders.length + (config.global?.length || 0);
console.log(`\nTotal: ${total} folder(s) protected\n`);
