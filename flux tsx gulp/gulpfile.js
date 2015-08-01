var gulp = require('gulp');
var tsc = require('gulp-typescript');
var serve = require('gulp-serve');
var jspm = require('jspm');
var path = require('path');
var fs = require('fs');
var del  = require('del');
var sass = require('gulp-sass');

gulp.task('clean', function(cb) {
    del(['debug', 'dist'], cb);
});

gulp.task('tsx', function () {
    return gulp.src(['source/js/**/*.tsx', 'source/js/**/*.ts'])
        .pipe(tsc({
            declarationFiles: false,
            target: 'es6',
            typescript: require('ntypescript'),
            jsx: 'react'
        })).js
        .pipe(gulp.dest('debug/js'));
});

gulp.task('sass', function () {
  gulp.src('source/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('debug/css'))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('bundle', function () {
    return jspm.bundleSFX('debug/js/index', 'dist/js/app.js', { sourceMaps: false });
});     

gulp.task('serve-debug', serve({
  root: ['debug', 'public', '.'],
  port: 80,
  middleware: function(req, res, next) {
    if(req.url === '/') res.end(fs.readFileSync('source/index.debug.html'));
    next();
  }
}));

gulp.task('serve-prod', serve({
  root: ['dist', 'public'],
  port: 80,
  middleware: function(req, res, next) {
    if(req.url === '/') res.end(fs.readFileSync('source/index.html'));
    next();
  }
}));