'use strict';

const expect = require('expect.js');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const watcherFactory = require('..');

let watcher;

describe('yaw', () => {
  before(() => {
    process.chdir(path.resolve(__dirname, 'fixtures'));
  });

  beforeEach((done) => {
    if (fs.existsSync('test')) rimraf.sync('test');
    if (watcher) watcher.clean();
    fs.mkdirSync('test');
    fs.writeFileSync('test/test.js', 'blah', 'utf8');
    watcher = watcherFactory();
    watcher.watch(path.resolve('test'));
    setTimeout(done, 1000);
  });
  after(() => {
    rimraf.sync('test');
  });

  describe('watching a directory for new files', () => {
    it('should emit a create event on addition of a new file', (done) => {
      const newfile = path.resolve('test/dummy.js');

      watcher.once('create', (file, stats) => {
        expect(file).to.eql(newfile);
        done();
      });
      process.nextTick(() => {
        fs.writeFileSync(newfile, 'blah', 'utf8');
      });
    });
    it('should emit a create event on addition of a new directory', (done) => {
      const newdir = path.resolve('test/dummy');

      watcher.once('create', (file, stats) => {
        expect(file).to.eql(newdir);
        done();
      });
      process.nextTick(() => {
        fs.mkdirSync(newdir);
      });
    });
  });

  describe('watching a directory for change to an existing file', () => {
    it('should emit a change event on update of file contents', (done) => {
      const oldfile = path.resolve('test/test.js');

      watcher.once('change', (file, stats) => {
        expect(file).to.eql(oldfile);
        done();
      });
      process.nextTick(() => {
        fs.writeFileSync(oldfile, 'blah', 'utf8');
      });
    });
    it('should emit a delete event on removal from the file system', (done) => {
      const oldfile = path.resolve('test/test.js');

      watcher.once('delete', (file) => {
        expect(file).to.eql(oldfile);
        expect(fs.existsSync(oldfile)).to.equal(false);
        done();
      });
      process.nextTick(() => {
        rimraf.sync(oldfile);
      });
    });
  });
});