[![Build Status](https://travis-ci.org/popeindustries/yaw.png)](https://travis-ci.org/popeindustries/yaw)

__Y__et __A__nother __W__atch utility. This time event based.

## Installation

```bash
npm install yaw
```

## Usage
```javascript
var Watcher = require('yaw');

var watcher = new Watcher();
watcher.watch('some/file/or/directory')
  .on('error', function(err) {
    // Handle error
  })
  .on('create', function(filepath, stats) {
    // Handle new file or directory
  })
  .on('change', function(filepath, stats) {
    // Handle update to file
  })
  .on('delete', function(filepath) {
    // Handle removal of file or directory
  });
```