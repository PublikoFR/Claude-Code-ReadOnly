---
description: Remove a folder from the read-only list
argument-hint: <path> [--global]
---

Remove a folder from read-only protection.

Arguments received: $ARGUMENTS

Instructions:
1. Read ~/.claude/settings.json
2. Parse arguments:
   - If --global: remove from readonlyFolders.global
   - Otherwise: remove from readonlyFolders.projects[CWD]
3. Remove path from readonlyFolders
4. Also remove from permissions.additionalDirectories
5. Also remove associated deny rules for Edit and Write
6. Save settings.json
7. Confirm removal
