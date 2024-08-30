## [2.0.2](https://github.com/retejs/history-plugin/compare/v2.0.1...v2.0.2) (2024-08-30)


### Bug Fixes

* update cli and fix linting errors ([0e0020a](https://github.com/retejs/history-plugin/commit/0e0020abf7d9698d6b21d001a31499d0fd927b3d))

## [2.0.1](https://github.com/retejs/history-plugin/compare/v2.0.0...v2.0.1) (2024-01-27)


### Bug Fixes

* **build:** source maps ([5e75f2f](https://github.com/retejs/history-plugin/commit/5e75f2f3835553eaf6e082cb8216c7a3042e7fac))

## v2.0.0-beta.6

- Fix node position for "undo" method of removed node
- Exposed `add`, `getHistorySnapshot`, `getRecent` and `clear` methods
- Added `history.separate()` and support `action.separated = true`
- Breaking changes:
  - Added presets
  ```ts
  import { Presets as HistoryPresets } from "rete-history-plugin";

  history.addPreset(HistoryPresets.classic.setup());
  ```
  - action types as second generic argument
  ```ts
  import { HistoryActions, HistoryPlugin } from "rete-history-plugin";

  const history = new HistoryPlugin<Schemes, HistoryActions<Schemes>>();
  ```
