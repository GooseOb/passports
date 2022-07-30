const gulp = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const hash = require('gulp-hash-filename');
const minCSS = require('gulp-clean-css');
const sass = require('gulp-sass')(require('sass'));
const minHTML = require('gulp-htmlmin');
const {readdirSync} = require('fs');

// const param = process.argv.pop();
// const isDev = param === '--dev';
// const isProd = !isDev;

const getPathes = (src, dest = '') => ({
	src: 'src/' + src,
	dest: 'docs/' + dest
});

const pathes = {
	html: getPathes('index.html'),
	og: getPathes('og.jpg'),
	script: getPathes('script.js'),
	style: getPathes('style.sass'),
	files: getPathes('files/**/*', 'files'),
};

const hashParams = {format: '{name}.{hash}{ext}'};
const renameParams = {suffix: '.min'};

const inDest = type => readdirSync(pathes[type].dest);
const toFilesHash = file => {
	const [name, /*min*/, hash, ext] = file.split('.');
	filesHash[ext][name] = hash;
};
const setHash = (dest, regExp) => inDest(dest)
	.filter(fileName => regExp.test(fileName))
	.forEach(toFilesHash);
const filesHash = {
	css: {},
	js: {},
	save: done => {
		setHash('style', /.css$/);
		setHash('script', /.js$/);
		done();
	}
};

const clean = () => del(['docs']);

const src = fileType => gulp.src(pathes[fileType].src);
const dest = fileType => gulp.dest(pathes[fileType].dest);

const hashNamesCSS = [
	/(\w+)\.css/g,
	(_, a) => a + '.min.' + filesHash.css[a] + '.css'
];

const html = () => src('html')
	.pipe(replace(...hashNamesCSS))
	.pipe(replace(/<script.*\/script>/, () => `<script defer src='./script.min.${filesHash.js.script}.js'></script>`))
	.pipe(minHTML({
		collapseWhitespace: true,
		removeComments: true
	}))
	.pipe(dest('html'));

const script = () => src('script')
	.pipe(replace(...hashNamesCSS))
	.pipe(uglify())
	.pipe(rename(renameParams))
	.pipe(replace(/^/, '(()=>{'))
	.pipe(replace(/$/, '})()'))
	.pipe(hash(hashParams))
	.pipe(dest('script'));

const style = () => src('style')
	.pipe(sass())
	.pipe(rename(renameParams))
	.pipe(minCSS())
	.pipe(hash(hashParams))
	.pipe(dest('style'));

const getMoveFn = file => () => src(file)
	.pipe(dest(file));

const files = getMoveFn('files');
const og = getMoveFn('og');

const watch = () => {
	gulp.watch(pathes.html.src, html);
	gulp.watch(pathes.style.src, style);
	gulp.watch(pathes.script.src, script);
};

const build = gulp.series(
	clean,
	gulp.parallel(style, script, files, og),
	filesHash.save,
	html
);

const updateFiles = (ext, fn) => gulp.series(
	() => del(['docs/**/*.' + ext]),
	...(fn === html
		? [filesHash.save, fn]
		: [fn, filesHash.save, html]
	)
);
module.exports = {
	default: build,
	build,
	watch,
	clean,
	script: updateFiles('js', script),
	style: updateFiles('css', style),
	html: updateFiles('html', html)
};