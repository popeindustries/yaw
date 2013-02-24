An event based file watching utility.

## Installation

```bash
npm install buddy-watcher
```

## Usage
```javascript
var Watcher = require('buddy-watcher');

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
  })
```