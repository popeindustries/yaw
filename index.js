'use strict';

const Emitter = require('events');
const fs = require('fs');
const path = require('path');

const RE_IGNORE = /^[.~]|~$/;
const THROTTLE_TIMEOUT = 100;

module.exports = function watcherFactory () {
  return new Watcher();
};

class Watcher extends Emitter {
  /**
   * Constructor
   */
  constructor () {
    super();

    this.watchers = {};
    this._throttling = {
      create: 0,
      delete: 0,
      change: 0
    };
  }

  /**
   * Watch a 'source' file or directory for changes
   * @param {String} source
   */
  watch (source) {
    if (RE_IGNORE.test(path.basename(source)) || source in this.watchers) return;

    fs.stat(source, (err, stats) => {
      let lastChange;

      if (err) {
        this.emit('error', err);
      } else {
        lastChange = stats.mtime.getTime();
        // Recursively parse items in directory
        if (stats.isDirectory()) {
          fs.readdir(source, (err, files) => {
            if (err) this.emit('error', err);
            files.forEach((file) => {
              this.watch(path.resolve(source, file));
            });
          });
        }
      }

      // Store watcher objects
      this.watchers[source] = fs.watch(source, (evt, filename) => {
        // Deleted
        if (!fs.existsSync(source)) {
          this.unwatch(source);
          this._throttleEvent('delete', source);
          return;
        }

        fs.stat(source, (err, stats) => {
          if (err) return this.emit('error', err);

          if (stats.isFile()) {
            // Notify if changed
            if ((stats.mtime.getTime()) !== lastChange) {
              this._throttleEvent('change', source, stats);
            }
            lastChange = stats.mtime.getTime();
          } else if (stats.isDirectory()) {
            fs.readdir(source, (err, files) => {
              if (err) return this.emit('error', err);

              files.forEach((file) => {
                const item = path.resolve(source, file);

                // New file or directory
                if (!RE_IGNORE.test(path.basename(item)) && !this.watchers[item]) {
                  fs.stat(item, (err, stats) =>{
                    if (err) return;

                    this._throttleEvent('create', item, stats);
                    this.watch(item);
                  });
                }
              });
            });
          }
        });
      });
    });
  }

  /**
   * Stop watching a 'source' file or directory for changes
   * @param {String} source
   */
  unwatch (source) {
    const watcher = this.watchers[source];

    if (watcher) {
      delete this.watchers[source];
      try {
        watcher.close();
      } catch (err) { /* ignore */}
    }
  }

  /**
   * Stop watching all sources for changes
   */
  clean () {
    for (const source in this.watchers) {
      this.unwatch(source);
    }
    for (const type in this._throttling) {
      clearInterval(this._throttling[type]);
      this._throttling[type] = 0;
    }
  }

  /**
   * Protect against mutiple event emits
   * @param {String} type
   * @param {Object} [props]
   */
  _throttleEvent (type, ...props) {
    if (!this._throttling[type]) {
      this.emit(type, ...props);
      this._throttling[type] = setTimeout(() => {
        this._throttling[type] = 0;
      }, THROTTLE_TIMEOUT);
    }
  }
}