var path = require('path')
	, fs = require('fs')
	, rimraf = require('rimraf')
	, Watcher = require('..')
	, watcher;

describe('yaw', function () {
	before(function() {
		process.chdir(path.resolve(__dirname, 'fixtures'));
	});
	beforeEach(function(done) {
		if (fs.existsSync('test')) rimraf.sync('test');
		if (watcher) watcher.clean();
		fs.mkdirSync('test');
		fs.writeFileSync('test/test.js', 'blah', 'utf8');
		watcher = new Watcher();
		watcher.watch(path.resolve('test'));
		setTimeout(done, 1000);
	});
	after(function() {
		rimraf.sync('test');
	});

	describe('watching a directory for new files', function() {
		it('should emit a create event on addition of a new file', function (done) {
			var newfile = path.resolve('test/dummy.js');
			watcher.once('create', function(file, stats) {
				file.should.eql(newfile);
				done();
			});
			process.nextTick(function() {
				fs.writeFileSync(newfile, 'blah', 'utf8');
			});
		});
		it('should emit a create event on addition of a new directory', function (done) {
			var newdir = path.resolve('test/dummy');
			watcher.once('create', function(file, stats) {
				file.should.eql(newdir);
				done();
			});
			process.nextTick(function() {
				fs.mkdirSync(newdir);
			});
		});
	});
	describe('watching a directory for change to an existing file', function() {
		it('should emit a change event on update of file contents', function (done) {
			var oldfile = path.resolve('test/test.js');
			watcher.once('change', function(file, stats) {
				file.should.eql(oldfile);
				done();
			});
			process.nextTick(function() {
				fs.writeFileSync(oldfile, 'blah', 'utf8');
			});
		});
		it('should emit a delete event on removal from the file system', function (done) {
			var oldfile = path.resolve('test/test.js');
			watcher.once('delete', function(file) {
				file.should.eql(oldfile);
				fs.existsSync(oldfile).should.be.false;
				done();
			});
			process.nextTick(function() {
				rimraf.sync(oldfile);
			});
		});
	});
});