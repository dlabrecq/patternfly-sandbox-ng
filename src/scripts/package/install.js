/*
 * This script copies contents of dist directory to the root directory. Thus, allowing module imports like so:
 *
 * import { BasicCardModule } from 'patternfly-sandbox-ng/card';
 *
 * Note: In order to support semantic-release, 'npm publish' must be run from the root instead of the dist directory.
 * When publishing a sub folder, npm loses the ability to insert the correct gitHead information, which prevents
 * semantic-release from working properly.
 *
 * See: https://github.com/npm/read-package-json/issues/66
 */
var fs = require('fs');
var path = require('path');
var appPath = './dist/app';
var bundlePath = './dist/bundles';
var bundleTargetPath = './bundles';

function copyFile(source, target) {
  var targetFile = target;

  // If target is a directory a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }
  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursive(source, target) {
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, path.basename(source));
  if (fs.lstatSync(source).isDirectory() && !fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursive(curSource, targetFolder);
      } else {
        copyFile(curSource, targetFolder);
      }
    });
  } else {
    copyFile(source, targetFolder);
  }
}

function deleteFolderRecursive(source) {
  if (fs.existsSync(source)) {
    fs.readdirSync(source).forEach(function(file,index){
      var curPath = source + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(source);
  }
};

// Skip install for repo clone
if (fs.existsSync('./deploy_key.enc')) {
  process.exit(0);
};

// Copy directories to root so patternfly-sandbox-ng modules can be imported like so:
//
// import { NotificationModule } from 'patternfly-sandbox-ng/notification';
//
fs.readdir(appPath, function(err, items) {
  for (var i = 0; i < items.length; i++) {
    copyFolderRecursive(appPath + '/' + items[i], '.');
  }
  deleteFolderRecursive(appPath);
});

fs.readdir(bundlePath, function(err, items) {
  if (!fs.existsSync(bundleTargetPath)) {
    fs.mkdirSync(bundleTargetPath);
  }
  for (var i = 0; i < items.length; i++) {
    copyFolderRecursive(bundlePath + '/' + items[i], bundleTargetPath);
  }
  deleteFolderRecursive(bundlePath);
});
