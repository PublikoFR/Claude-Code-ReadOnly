---
description: List folders configured as read-only
---

Display read-only folders for the current project.

Instructions:
1. Read ~/.claude/settings.json
2. Look for the "readonlyFolders" key
3. Identify current project (CWD)
4. Display:
   - Folders specific to this project (from readonlyFolders.projects[CWD])
   - Global folders (from readonlyFolders.global)
5. Format as table with path and type (project/global)
