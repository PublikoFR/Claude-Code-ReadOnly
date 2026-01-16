---
description: Add a folder as read-only (protected from modifications)
argument-hint: <path> [--global]
---

Add a folder as read-only for the current project.

Arguments received: $ARGUMENTS

Instructions:
1. Read ~/.claude/settings.json
2. Parse arguments:
   - If --global: add to readonlyFolders.global
   - Otherwise: add to readonlyFolders.projects[CWD]
3. Convert path to absolute if needed
4. Verify folder exists
5. Create readonlyFolders structure if it doesn't exist
6. Add to JSON (avoid duplicates)
7. Also update permissions.additionalDirectories (prefixed with //)
8. Also add deny rules for Edit and Write
9. Save settings.json
10. Confirm addition
