var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var bower = require('gulp-bower');
var babel = require('gulp-babel');
var durandal = require('gulp-durandal');
var rename = require('gulp-rename');
var serve = require('gulp-serve');
var gzip = require('gulp-gzip');
var ejs = require("gulp-ejs");
var exec = require('child_process').exec;


/**
 * Serve and recompile
 */
 
gulp.task('serve', ['watch'], serve('source'));

gulp.task('serve-dist', serve('dist'));

gulp.task('watch', function() {
    
    // turn this on if you want it, howerver it's faster to the sass cli because this
    // will recompile all of it every time
    
    // gulp.watch('source/style/**/*.scss', ['sass']);
       
    gulp.watch('source/app/**/*.es6', ['babel']);
    gulp.watch('source/**/*.ejs', ['ejs']);
});


gulp.task('sass-watch', function() {
    var cmd = 'sass --watch source/style -I bower_components/bootstrap-sass-official/assets/stylesheets -I bower_components/fontawesome/scss';
    exec(cmd, function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
});


/**
 * Get libraries
 */

gulp.task('bower', function() {
    return bower().pipe(gulp.dest('source/lib'));
});



/**
 * Compilation of debug files
 */ 
 
gulp.task('compile', ['ejs', 'sass', 'babel']);

gulp.task('ejs', function() {
    gulp.src('source/index.ejs')
    .pipe(ejs({
        debug: true
    }))
    .pipe(gulp.dest("source"));
});

gulp.task('sass', function () {
    return sass('source/style', {
            style: 'compressed',
            loadPath: [
                './source/style',
                'bower_components/bootstrap-sass-official/assets/stylesheets',
                'bower_components/fontawesome/scss',
            ]
        })
        .on('error', function (err) {
            console.error('Error!', err.message);
        })
        .pipe(gulp.dest('source/style'));
});

gulp.task('babel', function () {
    return gulp.src(['source/app/**/*.es6'])
        .pipe(babel({ modules: 'amd' }))
        .pipe(rename({ extname: '.js' }))
        .pipe(gulp.dest('./source/app'));
});




/**
 * Create a distribution
 */
 
gulp.task('dist', ['dist:durandal', 'dist:ejs', 'dist:sass']);

gulp.task('dist:durandal', ['babel'], function(){
    return durandal({
        baseDir: 'source/app',
        main: 'boot.js',
        output: 'app.js',
        almond: true,
        minify: true,
        rjsConfigAdapter: function(options) {
            options.generateSourceMaps = false;
            return options;
        }
    })
    .pipe(gulp.dest('./dist/'))
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist:ejs', function() {
    return gulp.src('source/index.ejs')
    .pipe(ejs({
        debug: false
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist:sass', ['sass'], function() {
    return gulp.src('source/style/app.css')
    .pipe(gulp.dest('./dist/'))
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
});