/*eslint no-unused-vars: 0 */
'use strict';

var chai = require('chai'),
    should = chai.should(),
    fs = require('fs'),
    path = require('path'),
    stylus = require('stylus'),
    poststylus = require('../index'),
    postcss = require('postcss'),
    parse = require('css-parse');

// path to test input/output files
var testPath = path.join(__dirname, 'fixtures'),
    mocksPath = path.join(__dirname, 'mocks'),
    mockDeps = { postcss: postcss };

var mocks = require(mocksPath)(mockDeps);

// matching function to test if input stylus = expected output css
var matchExpected = function(file, plugin, done) {
  return stylus(fs.readFileSync(path.join(testPath, file), 'utf8'))
    .use(poststylus(plugin))
    .render(function(err, css) {

      // if it can't render exit immediately
      if (err) {
        return done(err);
      }

      // set up css test file
      var expected = fs.readFileSync(path.join(
        testPath,
        file.replace('.styl', '.css')),
      'utf8'
      );

      // processed output should === css test file
      parse(css).should.eql(parse(expected));

      return done();
    });
};

// start the tests
describe('PostStylus', function() {
  var mockModule;

  before(function() {
    mockModule = path.join(__dirname, 'mockModule');
  });

  it('works', function(done) {
    return matchExpected('plugin.styl', mocks.plugin, done);
  });

  it('takes a string and requires it', function(done) {
    return matchExpected('plugin.styl', mockModule, done);
  });

  it('takes an array of strings and requires them', function(done) {
    return matchExpected('plugin.styl', [mockModule], done);
  });

  it('stays alive when not given plugins', function(done) {
    return matchExpected('untouched.styl', '', done);
  });

  describe('accepts a warning function', function () {
    var wasCalled, warnFn, filename, file;

    before(function () {
      warnFn = function (message) {
        wasCalled = true;
      };
      filename = path.join(testPath, 'plugin.styl');
      file = fs.readFileSync(filename, 'utf8');
    });

    beforeEach(function () {
      wasCalled = false;
    });

    it('calls the warning function when a warning is raised', function(done) {
      stylus(file)
        .use(poststylus(mocks.warn(true), warnFn))
        .render(function(err) {
          if (err) {
            return done(err);
          }

          should.equal(wasCalled, true);
          done();
        });
    });

    it('does not call the warning function if a warning is not raised', function(done) {
      stylus(file)
        .use(poststylus(mocks.warn(false), warnFn))
        .render(function(err) {
          if (err) {
            return done(err);
          }

          should.equal(wasCalled, false);
          done();
        });
    });
  });
});
