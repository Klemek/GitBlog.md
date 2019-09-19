/* jshint -W117 */
const fs = require('fs');
const path = require('path');
const utils = require('./test_utils');

const dataDir = 'test_data';

beforeEach(() => {
  utils.deleteFolderSync(dataDir);
  fs.mkdirSync(dataDir);
});

afterAll(() => {
  if (fs.existsSync(dataDir)) {
    utils.deleteFolderSync(dataDir);
  }
});

test('load 1 script', () => {
  const file = path.join(dataDir, 'test.js');
  fs.writeFileSync(file, `
           var a = 5;
           function b(){
            return a;
           }`);
  require('../src/script_loader')(file);
  expect(global['b']).toBeDefined();
  expect(global['b']()).toBe(5);
});

test('load 2 script', () => {
  const file1 = path.join(dataDir, 'test.js');
  fs.writeFileSync(file1, `
           var a = 5;
           function b(){
            return a;
           }`);
  const file2 = path.join(dataDir, 'test2.js');
  fs.writeFileSync(file2, `
           var a = 9;
           function b(){
            return a;
           }`);
  require('../src/script_loader')(file1);
  expect(global['b']).toBeDefined();
  expect(global['b']()).toBe(5);

  require('../src/script_loader.js')(file2);
  expect(global['b']).toBeDefined();
  expect(global['b']()).toBe(9);
});