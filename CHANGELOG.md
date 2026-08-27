# Release Notes for Taskify Business 1.12.0

# Stack Upgrades
- supabase-js `2.112.4`
  - [New in 2.112.4](https://github.com/supabase/supabase-js/releases/tag/v2.112.4)
- i18next `26.4.0`
  - [New in 26.4.0](https://github.com/i18next/i18next/releases/tag/v26.4.0)
- Electron `44.0.0`
  - [New in 44.0.0](https://github.com/electron/electron/releases/tag/v44.0.0)
- npm `11.9.1`
  - [New in 11.9.1](https://github.com/npm/cli/releases/tag/v11.19.1)
- js-yaml `5.4.1`
  - [New in 5.4.1](https://github.com/nodeca/js-yaml)

# ⚠️Warning
This version of Taskify Business **resolves important security vulnerabilities** caused by packages used by the application that were not updated correctly. This update is recommended for all users as part of the **July Security Patch.**

# Security Fixes
[d07ef45] Resolve Content-Injection with Task Name Creation [CWE-79]. 

# Breaking Changes
[b8099ab] Removed AI. Now Taskify Business is more efficent and more reliable.

# Bug Fixes
[1209ac9] Fixed bugs with Spellcheck option, sometime it doesn't save the option.
[7fc9da2] Fixed alert titles, now show correctly "Taskify Business" and not "Close".
[a9e11fb] Fixed some alerts not correctly translated.
[5d4484f] Fixed saved colors from the Chart not loading correctly sometimes.
[18cce4c] Fixed chart not displayed correctly sometimes.