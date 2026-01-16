# Claude Code ReadOnly

A plugin for [Claude Code](https://claude.ai/code) that protects external folders from modifications while allowing read access.

**Why?** When working on a project, you may need Claude to reference code from other folders (libraries, boilerplates, other projects) without accidentally modifying them. This plugin adds read-only protection to any folder you specify. You can manage restrictions by project, or globally.

**How it works:**
- Installs a **PreToolUse hook** that intercepts Bash commands before execution
- Adds **slash commands** (`/add-readonly`, `/remove-readonly`, `/list-readonly`) to manage protected folders
- Stores configuration in `~/.claude/settings.json` alongside your other Claude Code settings
- Supports **per-project** folders (only accessible from a specific project) and **global** folders (accessible from all projects)

## Features

- **Cross-platform**: Works on Linux, macOS, and Windows
- **No dependencies**: Uses only Node.js (included with Claude Code)
- **Per-project configuration**: Each project can have its own list of read-only folders
- **Global folders**: Share read-only folders across all projects
- **Bash protection**: Blocks dangerous commands (rm, mv, cp, touch, etc.)
- **Edit/Write protection**: Blocks Claude's Edit and Write tools
- **Safe commands allowed**: ls, cat, grep, find, head, tail, etc.

## Installation

### One-liner (all platforms)
```bash
curl -fsSL https://raw.githubusercontent.com/PublikoFR/Claude-Code-ReadOnly/main/install.js | node
```

### From source
```bash
git clone https://github.com/PublikoFR/Claude-Code-ReadOnly.git
cd claude-code-readonly
node install.js
# You can delete the folder after installation
```

### Manual setup (no scripts)

If you prefer not to run any scripts:

1. **Copy the hook** to `~/.claude/hooks/`:
   ```bash
   cp hooks/protect-readonly.js ~/.claude/hooks/
   ```

2. **Copy the commands** to `~/.claude/commands/`:
   ```bash
   cp commands/*.md ~/.claude/commands/
   ```

3. **Add the hook** to `~/.claude/settings.json` in the `hooks` section:
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             {
               "type": "command",
               "command": "node ~/.claude/hooks/protect-readonly.js",
               "timeout": 5
             }
           ]
         }
       ]
     }
   }
   ```

4. **Add readonlyFolders** to `~/.claude/settings.json`:
   ```json
   {
     "readonlyFolders": { "projects": {}, "global": [] }
   }
   ```

## Requirements

- **Claude Code CLI** (includes Node.js)

No external dependencies required.

## Usage

### Add a read-only folder (project-specific)
```
/add-readonly /path/to/folder
```

### Add a read-only folder (global)
```
/add-readonly /path/to/folder --global
```

### List protected folders
```
/list-readonly
```

### Remove a folder
```
/remove-readonly /path/to/folder
```

## Configuration

Configuration is stored in `~/.claude/settings.json` under the `readonlyFolders` key:

```json
{
  "hooks": { ... },
  "permissions": { ... },
  "readonlyFolders": {
    "projects": {
      "/home/user/project-a": [
        "/home/user/shared-lib"
      ],
      "/home/user/project-b": [
        "/home/user/another-lib"
      ]
    },
    "global": [
      "/home/user/always-readonly"
    ]
  }
}
```

## How it works

1. **PreToolUse Hook**: Intercepts every Bash command before execution
2. **Project Detection**: Uses current working directory to identify the project
3. **Path Matching**: Checks if the command targets a protected folder
4. **Command Classification**: Allows read commands, blocks write commands

### Commands blocked
- `rm`, `mv`, `cp`, `touch`, `mkdir`, `rmdir`
- `echo >`, `cat >`, `tee`, `sed -i`
- `chmod`, `chown`, `truncate`, `dd`
- `git checkout`, `git reset`, `git clean`, `git rm`
- Any command with `>` or `>>` redirection

### Commands allowed
- `ls`, `cat`, `head`, `tail`
- `grep`, `rg`, `grepai`, `find`
- `file`, `wc`, `diff`, `stat`, `du`
- `tree`, `bat`, `less`, `more`

## License

MIT
