var fs = require('fs')
	, path = require('path')
	, util = require("util")
	, EventEmitter = require('events').EventEmitter
	, existsSync = fs.existsSync || path.existsSync
	, RE_IGNORE = /^[.~]|~$/
	, THROTTLE_TIMEOUT = 100;

module.exports = Watcher;

/**
 * Constructor
 */
function Watcher() {
	EventEmitter.call(this);

	this.watchers = {};
	this._throttling = {
		'create': 0,
		'delete': 0,
		'change': 0
	};
}

// Inherit
util.inherits(Watcher, EventEmitter);

/**
 * Watch a 'source' file or directory for changes
 * @param {String} source
 */
Watcher.prototype.watch = function(source) {
	var self = this;

	if (!RE_IGNORE.test(path.basename(source))) {
		fs.stat(source, function(err, stats) {
			var lastChange;
			if (err) {
				self.emit('error', err);
			} else {
				lastChange = stats.mtime.getTime();
				// Recursively parse items in directory
				if (stats.isDirectory()) {
					fs.readdir(source, function(err, files) {
						if (err) self.emit('error', err);
						files.forEach(function(file) {
							self.watch(path.resolve(source, file));
						});
					});
				}
			}

			// Store watcher objects
			self.watchers[source] = fs.watch(source, function(evt, filename) {
				if (existsSync(source)) {
					fs.stat(source, function(err, stats) {
						if (err) {
							self.emit('error', err);
						} else {
							if (stats.isFile()) {
								// Notify if changed
								if ((stats.mtime.getTime()) !== lastChange) {
									self._throttleEvent('change', source, stats);
								}
								lastChange = stats.mtime.getTime();
							} else if (stats.isDirectory()) {
								fs.readdir(source, function(err, files) {
									if (err) {
										self.emit('error', err);
									} else {
										files.forEach(function(file) {
											var item = path.resolve(source, file);
											// New file or directory
											if (!RE_IGNORE.test(path.basename(item)) && !self.watchers[item]) {
												fs.stat(item, function(err, stats) {
													self._throttleEvent('create', item, stats);
													self.watch(item);
												});
											}
										});
									}
								});
							}
						}
					});
				// Deleted
				} else {
					self.unwatch(source);
					self._throttleEvent('delete', source);
				}
			});
		});
	}
};

/**
 * Stop watching a 'source' file or directory for changes
 * @param {String} source
 */
Watcher.prototype.unwatch = function(source) {
	var watcher = this.watchers[source];
	if (watcher) {
		delete this.watchers[source];
		try {
			watcher.close();
		} catch (err) { }
	}
};

/**
 * Stop watching all sources for changes
 */
Watcher.prototype.clean = function() {
	for (var source in this.watchers) {
		this.unwatch(source);
	}
	for (var type in this._throttling) {
		clearInterval(this._throttling[type]);
		this._throttling[type] = 0;
	}
};

/**
 * Protect against mutiple event emits
 * @param {String} type
 * @param [props]
 */
Watcher.prototype._throttleEvent = function(type) {
	var self = this
		, props = (2 <= arguments.length)
			? Array.prototype.slice.call(arguments, 1)
			: [];
	if (!this._throttling[type]) {
		this.emit.apply(this, [type].concat(props));
		this._throttling[type] = setTimeout((function() {
			self._throttling[type] = 0;
		}), THROTTLE_TIMEOUT);
	}
};
