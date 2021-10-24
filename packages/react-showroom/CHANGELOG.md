# react-showroom

## 0.24.1

### Patch Changes

- Fix race condition for iframe
- Updated dependencies [undefined]
  - @showroomjs/ui@0.19.1

## 0.24.0

### Minor Changes

- 66e1d74: Always prerender site now

### Patch Changes

- 66e1d74: Fix id warning
- Updated dependencies [66e1d74]
  - @showroomjs/core@0.20.0
  - @showroomjs/ui@0.19.0

## 0.23.0

### Minor Changes

- 2310801: Add ability to zoom in or out of preview

### Patch Changes

- Updated dependencies [2310801]
  - @showroomjs/core@0.19.0
  - @showroomjs/ui@0.18.0

## 0.22.0

### Minor Changes

- 8a446aa: Support preview multiple screens in standalone view

### Patch Changes

- Updated dependencies [8a446aa]
  - @showroomjs/core@0.18.0
  - @showroomjs/ui@0.17.0

## 0.21.0

### Minor Changes

- e410fef: Prerender example in iframe

### Patch Changes

- Updated dependencies [e410fef]
  - @showroomjs/core@0.17.0
  - @showroomjs/ui@0.16.1

## 0.20.0

### Minor Changes

- ef26422: Support render example in iframe

### Patch Changes

- Updated dependencies [ef26422]
  - @showroomjs/core@0.16.0
  - @showroomjs/ui@0.16.0

## 0.19.0

### Minor Changes

- e46959b: Performance improvement

  - Add `cacheDir` config options.
  - Set minimum chunk size to avoid tiny chunk.

### Patch Changes

- Updated dependencies [e46959b]
  - @showroomjs/core@0.15.0
  - @showroomjs/ui@0.15.1

## 0.18.0

### Minor Changes

- fb83641: Switch back to webpack from vite

### Patch Changes

- Updated dependencies [fb83641]
  - @showroomjs/bundles@0.12.0
  - @showroomjs/core@0.14.0
  - @showroomjs/ui@0.15.0

## 0.17.0

### Minor Changes

- 6c3917a: Suspend navigation until code is loaded

### Patch Changes

- Updated dependencies [6c3917a]
  - @showroomjs/core@0.13.0
  - @showroomjs/ui@0.14.2

## 0.16.1

### Patch Changes

- fd00c0b: Fix deprecated style
- Updated dependencies [fd00c0b]
  - @showroomjs/bundles@0.11.1
  - @showroomjs/core@0.12.1
  - @showroomjs/ui@0.14.1

## 0.16.0

### Minor Changes

- 2fa823a: Handle multiple require correctly

## 0.15.0

### Breaking Changes

- Rename config filename from react-showroom.js to react-showroom.config.js
- Handle basePath correctly so it also works in dev mode

### Patch Changes

- Updated dependencies [b8f15e2]
  - @showroomjs/ui@0.14.0

## 0.14.0

### Minor Changes

- 6c59ca6: Bump vite and increase code cache timeout

### Patch Changes

- Updated dependencies [6c59ca6]
  - @showroomjs/core@0.12.0
  - @showroomjs/ui@0.13.1

## 0.13.0

### Minor Changes

- 585358f: Add copy button for standalone view
- ccb725d: Expose useComponentList custom hook to create custom navigation

### Patch Changes

- Updated dependencies [585358f]
- Updated dependencies [ccb725d]
  - @showroomjs/ui@0.13.0

## 0.12.0

### Minor Changes

- 5b25154: Tweak design and bump deps

### Patch Changes

- Updated dependencies [5b25154]
  - @showroomjs/ui@0.12.0

## 0.11.3

### Patch Changes

- 484c9ce: Fix dev always use hash router
- Updated dependencies [484c9ce]
  - @showroomjs/core@0.11.3
  - @showroomjs/ui@0.11.3

## 0.11.2

### Patch Changes

- 56819fc: Remove unused package
- 4edde8b: Improve dev performance and prefetch resources
- Updated dependencies [4edde8b]
  - @showroomjs/core@0.11.2
  - @showroomjs/ui@0.11.2

## 0.11.1

### Patch Changes

- 05d0710: Handle trailing slash and fix markdown included in search result
- Updated dependencies [05d0710]
  - @showroomjs/core@0.11.1
  - @showroomjs/ui@0.11.1

## 0.11.0

### Minor Changes

- 3dfb015: Add support for code-splitting by page

### Patch Changes

- a559344: Change to use pnpm and changesets
- Updated dependencies [3dfb015]
- Updated dependencies [a559344]
  - @showroomjs/bundles@0.11.0
  - @showroomjs/core@0.11.0
  - @showroomjs/ui@0.11.0
