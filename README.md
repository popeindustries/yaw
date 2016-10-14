[![NPM Version](https://img.shields.io/npm/v/yaw.svg?style=flat)](https://npmjs.org/package/yaw)
[![Build Status](https://img.shields.io/travis/popeindustries/yaw.svg?style=flat)](https://travis-ci.org/popeindustries/yaw)

(**Y**)et (**A**)nother (**W**)atch utility. This time event based.

## Installation

```bash
npm install yaw
```

## Usage
```javascript
const watcherFactory = require('yaw');
const watcher = watcherFactory();

watcher.watch('some/file/or/directory')
  .on('error', (err) => {
    // Handle error
  })
  .on('create', (filepath, stats) => {
    // Handle new file or directory
  })
  .on('change', (filepath, stats) => {
    // Handle update to file
  })
  .on('delete', (filepath) => {
    // Handle removal of file or directory
  });
```