# Claude Code ReadOnly - TODO

## Done

- [x] PreToolUse hook to intercept Bash commands
- [x] Block dangerous commands (rm, mv, cp, touch, mkdir, etc.)
- [x] Allow safe commands (ls, cat, grep, find, head, tail, etc.)
- [x] JSON config stored in ~/.claude/settings.json (readonlyFolders key)
- [x] Per-project folder mapping
- [x] Global folders (shared across all projects)
- [x] Slash commands: `/add-readonly`, `/remove-readonly`, `/list-readonly`
- [x] Cross-platform support (Linux, macOS, Windows)
- [x] No external dependencies (Node.js only)
- [x] Single install.js script (local + remote install)
- [x] Auto-update ~/.claude/settings.json (hook + permissions)

## To do

- [ ] Auto-completion for paths in commands
- [ ] `/readonly-status` command to check if hook is active
- [ ] Support for glob patterns (e.g. `~/projects/*/node_modules`)
- [ ] Uninstall command
- [ ] Block Edit/Write tools via hook (not just settings.json)

## Project structure

```
Claude Code ReadOnly/
├── README.md
├── TODO.md
├── install.js              ← Single install script (local + remote)
├── hooks/
│   └── protect-readonly.js
└── commands/
    ├── list-readonly.md
    ├── add-readonly.md
    └── remove-readonly.md
```

## Installed files

```
~/.claude/
├── settings.json           ← Config (readonlyFolders key + hook)
├── hooks/
│   └── protect-readonly.js
└── commands/
    ├── list-readonly.md
    ├── add-readonly.md
    └── remove-readonly.md
```
