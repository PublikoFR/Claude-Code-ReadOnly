#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');
const CWD = process.cwd();

// Parse arguments
let pathParts = [];
let isGlobal = false;

for (const arg of args) {
  if (arg === '--global') {
    isGlobal = true;
  } else {
    pathParts.push(arg);
  }
}

// Join path parts (handles paths with spaces)
let folderPath = pathParts.join(' ');

if (!folderPath) {
  console.log('Usage: add-readonly <path> [--global]');
  process.exit(1);
}

// Convert to absolute path
if (!path.isAbsolute(folderPath)) {
  folderPath = path.resolve(CWD, folderPath);
}

// Check folder exists
if (!fs.existsSync(folderPath)) {
  console.log(`Error: Folder not found: ${folderPath}`);
  process.exit(1);
}

// Read settings
let settings = {};
if (fs.existsSync(SETTINGS_FILE)) {
  settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

// Ensure structure exists
if (!settings.readonlyFolders) {
  settings.readonlyFolders = { projects: {}, global: [] };
}

// Add folder
if (isGlobal) {
  if (!settings.readonlyFolders.global.includes(folderPath)) {
    settings.readonlyFolders.global.push(folderPath);
  }
} else {
  if (!settings.readonlyFolders.projects[CWD]) {
    settings.readonlyFolders.projects[CWD] = [];
  }
  if (!settings.readonlyFolders.projects[CWD].includes(folderPath)) {
    settings.readonlyFolders.projects[CWD].push(folderPath);
  }
}

// Save
fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

console.log(`✓ Added read-only: ${folderPath}`);
console.log(`  Type: ${isGlobal ? 'global' : 'project (' + CWD + ')'}`);
