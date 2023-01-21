const gulp = require('gulp');
const del = require('del');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const hash = require('gulp-hash-filename');
const minCSS = require('gulp-clean-css');
const sass = require('gulp-sass')(require('sass'));
const minHTML = require('gulp-htmlmin');
const {readdirSync} = require('fs');

const isDev = process.argv.includes('--dev');
const isProd = !isDev;

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
	qr: getPathes('qrcode.static.js')
};

const SCRIPT = 'script';
const STYLE = 'style';
const HTML = 'html';

const hashParams = {format: '{name}.{hash}{ext}'};

const getDestFileNames = (type, regExp) => {
	return readdirSync(pathes[type].dest)
		.filter(name => regExp.test(name));
};

const clean = () => del(['docs']);

const src = fileType => gulp.src(pathes[fileType].src);
const dest = fileType => gulp.dest(pathes[fileType].dest);

const htmlElements = {
	script: fileName => `<script defer src='./${fileName}'></script>`,
	style: fileName => `<link rel='stylesheet' href='./${fileName}'>`
};

const html = () => src(HTML)
	.pipe(replace('<styles/>', () => htmlElements.style(
		getDestFileNames(STYLE, /\.css$/)[0]
	)))
	.pipe(replace('<scripts/>',
		() => getDestFileNames(SCRIPT, /\.js$/)
			.map(htmlElements.script)
			.join('')
	))
	.pipe(minHTML({
		collapseWhitespace: true,
		removeComments: true
	}))
	.pipe(dest(HTML));

const script = () => {
	const $ = src(SCRIPT);
	if (isProd) $
		.pipe(uglify())
		.pipe(replace(/^/, '(()=>{'))
		.pipe(replace(/$/, '})()'))
		.pipe(hash(hashParams));
	return $.pipe(dest(SCRIPT));
};

const style = () => {
	const $ = src(STYLE)
		.pipe(sass())
		.pipe(replace(/ \[/g, '[')); // fixes gulp
	if (isProd) $
		.pipe(minCSS())
		.pipe(hash(hashParams))
	return $.pipe(dest(STYLE));
};

const getFileMover = type => {
	gulp.task(type, () => src(type).pipe(dest(type)));
	return gulp.task(type);
};

const files = getFileMover('files');
const og = getFileMover('og');
const qr = getFileMover('qr');

const updateFiles = (ext, fns) => gulp.series(
	() => del(['docs/**/*.' + ext, '!docs/**/*.static.' + ext]),
	...fns
);

const update = {
	[SCRIPT]: updateFiles('js', [script, html]),
	[STYLE]: updateFiles('css', [style, html]),
	[HTML]: updateFiles('html', [html]),
};

const watch = () => {
	[HTML, STYLE, SCRIPT].forEach(item => {
		gulp.watch(pathes[item].src, update[item]);
	});
};

const build = gulp.series(
	clean,
	gulp.parallel(style, script, files, og, qr),
	html
);

module.exports = {
	default: build,
	build,
	watch,
	clean,
	...update
};