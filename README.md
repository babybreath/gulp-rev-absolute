# gulp-rev-absolute

Rewrite occurences of filenames which have been renamed by gulp-rev. Support relative.

## Install
```bash
$ npm install --save-dev gulp-rev-absolute
```

## Usage
```javascript
var domain = '//test.example.com';                        // 静态域名
var sourcePath      = 'public';                           // 前端代码根目录
var buildPath       = 'build';                            // 输出目录

var srcImg  = sourcePath + '/**/*.{jpg,jpeg,png,gif,bmp}';// img 源码
var srcCss  = sourcePath + '/**/*.css';                   // css 源码

// 图片md5 处理
gulp.task('img', [], function(){
    return gulp.src(srcImg)
        .pipe(rev())
        .pipe(gulp.dest(buildPath))
        .pipe(rev.manifest('imgManifest.json'))
        .pipe(gulp.dest(buildPath));
});
gulp.task('css', ['img'], function(){
    var imgManifest = gulp.src(buildPath + "/imgManifest.json");
    return gulp.src(srcCss)
        .pipe(revAbsolute({manifest: imgManifest, base: baseUrl, prefix: domain}))
        .pipe(gulp.dest(buildPath))

});
```