'use strict';

module.exports = plugin;

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

var PLUGINNAME = 'gulp-rev-replace';

var REG_HTML = /([\s]href=|[\s]src=)['"][a-zA-Z_\-\d\.\/]+['"]|[\s:]url\(['"]?[a-zA-Z_\-\d\.\/]+['"]?\)/g;
var REG_SUB = /([\s]href=|[\s]src=)|['"]|[\s:]url\(|\)/g;

function plugin(options){
  var cache = [];
  return through.obj(function(file, enc, cb){
    if(file.isNull()){
      this.push(file);
      return cb();
    }
    if(file.isStream()){
      this.emit('error', new gutil.PluginError(PLUGINNAME, 'Streaming not supported'));
      return cb();
    }
    cache.push(file);
    //this.push(file);
    cb();
  }, function(cb){
    var stream = this;
    var manifestObj = {};
    var HTML_MATCHED = 0;
    var REPLACED = 0;

    if(options.manifest){
      options.manifest.on('data', function(file){
        manifestObj = JSON.parse(file.contents.toString());
      });
      options.manifest.on('end', replace);
    }

    function replace(){

      cache.forEach(function(file){
        var fileContent = file.contents.toString();
        var filePath = file.history[0].replace(/\\[a-zA-Z_\-\d\.]+$/, '');
        var base = file.base;
        console.log('\n checking file...' + file.history[0]);

        fileContent.replace(REG_HTML, function(matchString){
          HTML_MATCHED++;
          var url = matchString.replace(REG_SUB, '');
          var absoluteUrl = '';
          if(url.indexOf('/') === 0){
            absoluteUrl = url.replace(/^\//, '');
          }else{
            absoluteUrl = path.join(filePath, url).replace(base, '');
          }
          absoluteUrl = absoluteUrl.split(path.sep).join('/');
          var result = '';
          if(manifestObj[absoluteUrl]){
            console.log(url + '  =>  /' + manifestObj[absoluteUrl]);
            result = matchString.split(url).join('/' + manifestObj[absoluteUrl]);
            REPLACED++;
          }else{
            console.log('not find in manifest  =>  ' + matchString);
            result = matchString;
          }
          return result;
        });

        stream.push(file);

      });

      console.log('\n HTML_MATCHED:' + HTML_MATCHED + ' REPLACED:' + REPLACED);

      cb();

    }

  });
}
