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
  var base;
  options = options || {};

  if(options.hasOwnProperty('base') && path.isAbsolute(options.base)){
    base = options.base.split(path.sep).join('/');
    console.log('\nbase => ' + base);
  }else{
    base = false;
  }

  var isLog = options.log || false;

  function log(msg){
    isLog && console.log(msg);
  }

  return through.obj(function(file, enc, cb){
    if(file.isNull()){
      this.push(file);
      return cb();
    }
    if(file.isStream()){
      this.emit('error', new gutil.PluginError(PLUGINNAME, 'Streaming not supported.'));
      return cb();
    }
    if(!base){
      this.emit('error', new gutil.PluginError(PLUGINNAME, 'param base required and must be absolute'));
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
    var DOMAIN = '/';

    if(options.manifest){
      options.manifest.on('data', function(file){
        manifestObj = JSON.parse(file.contents.toString());
      });
      options.manifest.on('end', replace);
    }

    if(options.prefix){
      DOMAIN = options.prefix.replace(/\/$/, '') + '/';
    }

    function replace(){

      cache.forEach(function(file){
        var fileContent = file.contents.toString();
        var filePath = path.dirname(file.history[0]);
        var extname = path.extname(file.history[0]);
        log('\nchecking file...' + file.history[0]);

        fileContent = fileContent.replace(REG_HTML, function(matchString){
          HTML_MATCHED++;
          var url = matchString.replace(REG_SUB, '');
          var absoluteUrl = '';
          var resultUrl = '';
          var result = '';
          if(url.indexOf('/') === 0){
            absoluteUrl = url.replace(/^\//, '');
          }else{
            absoluteUrl = path.join(filePath, url).split(path.sep).join('/').replace(base, '').replace(/^\//, '');
          }
          if(manifestObj[absoluteUrl]){
            if(extname == '.js' || extname == '.css'){
              resultUrl = path.relative(filePath, path.join(base,manifestObj[absoluteUrl])).split(path.sep).join('/');
            }else{
              resultUrl = DOMAIN + manifestObj[absoluteUrl];
            }

            result = matchString.split(url).join(resultUrl);
            log(url + '  =>  ' + resultUrl);
            REPLACED++;
          }else{
            log('not find in manifest  =>  ' + matchString);
            result = matchString;
          }
          return result;
        });

        file.contents = new Buffer(fileContent);

        stream.push(file);

      });

      console.log('\nMATCHED:' + HTML_MATCHED + ' REPLACED:' + REPLACED + '\n');

      cb();

    }

  });
}
