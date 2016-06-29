'use strict';

module.exports = plugin;

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

var PLUGINNAME = 'gulp-rev-replace';

var REG_HTML = /([\s]href=|[\s]src=)['"][a-zA-Z_\-\d\.\/]+['"]|[\s:]url\(['"]?[a-zA-Z_\-\d\.\/]+['"]?\)/g;
var REG_SUB = /([\s]href=|[\s]src=)|['"]|[\s:]url\(|\)/g;

function plugin(options){
  return through.obj(function(file, enc, cb){
    if(file.isNull()){
      this.push(file);
      return cb();
    }
    if(file.isStream()){
      this.emit('error', new gutil.PluginError(PLUGINNAME, 'Streaming not supported'));
      return cb();
    }

    var manifestObj = {};

    if(options.manifest){
      options.manifest.on('data', function(file){
        manifestObj = JSON.parse(file.content.toString());
      });
      options.manifest.on('end', replace);
    }

    function replace(){
      var fileContent = file.contents.toString();
      var filePath = file.history[0].replace(/\\[a-zA-Z_\-\d\.]+$/, '');
      var base = file.base;

      fileContent.replace(REG_HTML, function(matchString){
        var url = matchString.replace(REG_SUB, '');
        console.log(url);
        var absoluteUrl = '';
        if(url.indexOf('/') === 0){
          absoluteUrl = url.replace(/^\//, '');
        }else{
          absoluteUrl = path.join(filePath, url).replace(base, '');
        }
        console.log(absoluteUrl);
        var result = '';
        if(manifestObj[absoluteUrl]){
          console.log('manifest matched ' + absoluteUrl);
          result = matchString.split(url).join('/' + manifestObj[absoluteUrl])
        }else{
          result = matchString;
        }
        return result;
      })
    }

    this.push(file);
    cb();
  });
}
