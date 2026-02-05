# Release Notes for Taskify Business 1.10.5 (February Security Patch)

# Stack Upgrades
- supabase-js `2.95.0`
  - [New in 2.94.1](https://github.com/supabase/supabase-js/releases/tag/v2.95.0)
- electron-builder `26.6.0`
  - [New in 26.6.0](https://github.com/electron-userland/electron-builder/releases/tag/electron-builder%4026.6.0)
- Electron `40.1.0`
  - [New in 40.1.0](https://github.com/electron/electron/releases/tag/v40.2.0)
- npm `11.9.0`
  - [New in 11.9.0](https://github.com/npm/cli/releases/tag/v11.9.0)

# ⚠️Warning
This version of Taskify Business **resolves important security vulnerabilities** caused by packages used by the application that were not updated correctly. This update is recommended for all users as part of the **February Security Patch.**

# Bug Fixes
[4fc6076] Fixed a bug where button icons could be too large.
[4c533ab] Renamed the “Task Settings” section to “User Preferences”.
[6b18ed4] Fixed a bug where the colors selected for the chart lines were reversed when the application was opened.
[c422a3f] Fixed an issue where the Edit button in the pop-up was still active even if no changes had been made to the task.
[b468d93] Some Performance Improvements.