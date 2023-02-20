'use strict';

const { series, src, dest } = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssmin = require('gulp-cssmin');

function compile() {
  // src()表示创建一个读取文件系统的流
  return src('./src/*.scss')
    .pipe(sass.sync())
    // 自动添加前缀
    .pipe(autoprefixer({
      browsers: ['ie > 9', 'last 2 versions'],
      cascade: false
    }))
    // css压缩
    .pipe(cssmin())
    // dest()是创建一个写入到文件系统的流
    .pipe(dest('./lib'));
}

function copyfont() {
  return src('./src/fonts/**')
    .pipe(cssmin())
    .pipe(dest('./lib/fonts'));
}
// 串行就是任务一个一个执行
exports.build = series(compile, copyfont);
