// Request for passports
fetch('https://script.google.com/macros/s/AKfycbybniugM8wK3-QLOPQ51AJ6jgHrZOfTJ6JSmXDMoT3T8AA3YSLTsVh1893t62zhQTJlFA/exec')
.then(data => data.json())
.then(({response}) => {
	passports = response;
	body.classList.remove('loading');
	idInput.max = passports.length;
	if (currPassportId) {
		idInput.value = currPassportId;
		doQRColorTransition = false;
		toHtml(passports[currPassportId-1]);
	};
	console.log('Passports have been loaded');
});

let passports, currCountry, colorChanging, doQRColorTransition;
let currPassportId = +location.search.split('id=')[1] || null;
let currLoc = 1;

const {protocol, host, pathname} = location;
const BASE_URL = protocol + "//" + host + pathname;
const FILES_PATH = './files/';
const DEFAULT_COLOR = 'rgb(135, 135, 135)';
const getPassportUrl = id => BASE_URL + (id ? '?id=' + id : '');

const {assign} = Object;

const $ = id => document.getElementById(id);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

const bookTranslateX = value => {
	book.style.transform = `translateX(${value})`;
}

// DOM-elements
const {body} = document;
const spreads = Array.from(body.querySelectorAll('.spread'));
const rotateBtn = $('rotate-btn');
const prevBtn = $('prev');
const nextBtn = $('next');
const idBtn = $('id-btn');
const idForm = $('id-form');
const idInput = $('id-input');
const book = $('book');
const countryCode = document.getElementById('country-code');

const proxyDOM = (rootId, prefix, getObj) => new Proxy(
	getObj(new Proxy($(rootId),
		{get: (target, name) => target.querySelector(prefix + name)}
	)),
	{set: (target, name, value) => target[name].textContent = value}
);

const mainPage = proxyDOM('f3', '#u_', u => ({
	name: u.name,
	flagCont: u['flag-container'],
	flag: u.flag,
	country: u.country,
	photo: u.photo,
	id: u.id,
	surname: u.surname,
	dob: u.DoB,
	doi: u.DoI,
	sex: u.sex,
	nationality: u.nationality,
	stamp: assign(u.stamp, {
		_codes: {
			'-1': ['null', 'Аннулировано'],
			0: ['no', ''],
			1: ['normal', $('osis').innerHTML]
		},
		setStatus(code) {
			const [className, innerHTML] = this._codes[code] || this._codes[0];
			assign(this, {className, innerHTML});
		}
	}),
}));

const frontCover = proxyDOM('country_and_herb', '#', cah => ({
	countryName: cah['country-name'],
	herb: cah.herb,
}));

const countries = [
	['gsld', '326', 'Республика Гусляндия', 'goose.svg'],
	['ngld', '5b3', 'Республика Неогусляндия', 'goose.svg'],
	['duck', 'e84', 'Утиное Государство', 'duck.png']
].map(([code, colorHEX, name, stdImg]) => ({
	code, name,
	color: colorHEX.match(/./g).map(n => parseInt(n+n, 16)),
	standardImage: FILES_PATH + 'standard-image/' + stdImg
}));

const qr = assign(new QRCode($('qr'), {
	text: getPassportUrl(currPassportId),
	width: 256,
	height: 256,
	colorDark : DEFAULT_COLOR,
	colorLight : '#0000',
	correctLevel : QRCode.CorrectLevel.L
}), {
	startColorChanging() {
		this._oDrawing._elCanvas.style.display = 'unset';
		this._oDrawing._elImage.style.display = 'none';
	},
	changeColor(color) {
		this._htOption.colorDark = color;
		this._oDrawing.draw(this._oQRCode);
	},
	stopColorChanging() {
		this.makeImage();
	}
});

// Set page positions & cover color
for (let i = 0; i < spreads.length; i++) {
	spreads[i].style.zIndex = spreads.length - i;
};
body.style.setProperty('--p_color', DEFAULT_COLOR);

const [lSpread, plSpread] = spreads.reverse();
const [fSpread, sSpread] = spreads.reverse();
fSpread.isCover = fSpread.isFirst =
lSpread.isCover = sSpread.isFirst = true;

const maxLoc = spreads.length + 1;

function getPassport() {
	const id = +idInput.value;
	if (
		id > 0 &&
		id !== currPassportId
	) {
		currPassportId = id;
		const passportUrl = getPassportUrl(id);
		history.pushState({id}, null, passportUrl);
		qr.makeCode(passportUrl);
		toHtml(passports[id-1]);
	};
}

onpopstate = ({state}) => {
	const id = state?.id || false;
	if (id) {
		idInput.value = currPassportId = id;
		toHtml(passports[id-1]);
	} else location.reload();
};

mainPage.photo.onerror = ({target: el}) => el.src = currCountry.standardImage;
function toHtml(data) {
	const [name, surname, sex, countryId, nationality, id, dob, doi, photoUrl, passportStatus, marriages] = data;
	const country = countries[countryId];
	book.dataset.code = country.code;
	if (currCountry !== country) {
		book.className = ''
		const is = {
			[country.code.toUpperCase()]: true
		};
		frontCover.countryName = country.name;
		changeColor(
			getComputedStyle(body).getPropertyValue('--p_color'),
			country.color
		);
		currCountry = country;

		mainPage.country = country.name;
	};
	mainPage.photo.src = photoUrl || country.standardImage;
	assign(mainPage, {name, id, surname, dob, sex, nationality, doi});
	mainPage.stamp.setStatus(passportStatus);
	const f4 = document.getElementById('marriages');
	f4.innerHTML = '';
	if (!marriages) return;
	for (let i = 0; i < marriages.length; i++) {
		const [date, name, divorceDate] = marriages[i];
		const divorce = divorceDate
			? `<div class='divorce'> Расторгнут ${divorceDate} </div>`
			: '';
		f4.innerHTML += `
		<div class='card'>
			<div class='data'>
				<span>${name}</span>
				<span class='date'>${date}</span>
			</div>
			${divorce}
		</div>`;
	};
}

function changeColor(currRGB, final, animDuration = 1000, animFrames = 60) {
	clearInterval(colorChanging);

	const curr = currRGB.match(/\d+/g).map(Number);
	const arr = Array(3);
	for (let i = 0; i < 3; i++)
		arr[i] = (curr[i]-final[i])/animFrames;

	const finalRGB = `rgb(${final})`;
	qr.startColorChanging();

	let onChange, onStop;
	if (doQRColorTransition) {
		onChange = () => qr.changeColor(currRGB);
		onStop = () => qr.stopColorChanging();
	} else {
		qr.changeColor(finalRGB);
		qr.stopColorChanging();
		onChange = () => {};
		onStop = () => doQRColorTransition = true;
	}

	colorChanging = setInterval(() => {
		for (let i = 0; i < 3; i++) curr[i] -= arr[i];
		currRGB = `rgb(${curr.map(num => Math.round(num))})`;
		body.style.setProperty('--p_color', currRGB);
		onChange();
		if (currRGB === finalRGB) {
			onStop();
			clearInterval(colorChanging);
		};
	}, animDuration/animFrames);
}

function openBook() {
	bookTranslateX('50%');
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
}

function closeBook() {
	let btn;
	if (currLoc === 2) {
		bookTranslateX('0');
		btn = prevBtn;
	} else {
		bookTranslateX('100%');
		btn = nextBtn;
	};
	btn.style.opacity = 0;
	setTimeout(() => {
		if (btn.style.opacity === '0') btn.style.visibility = 'hidden';
	}, 250);
	transformBtns(0);
}

const pageController = {
	_isFlipping: false,
	_nextParams: {
		getIndex: () => currLoc - spreads.length,
		handleBook: [openBook, closeBook],
	},
	_prevParams: {
		getIndex: () => spreads.length - i,
		handleBook: [closeBook, openBook]
	},
	next() {
		if (currLoc === maxLoc) return;
		if (this._flip(true, this._nextParams))
			currLoc++;
	},
	prev() {
		if (currLoc === 1) return;
		if (this._flip(false, this._prevParams))
			currLoc--;
	},
	_flip(isNext, {handleBook, getIndex}) {
		if (this._isFlipping) return false;
		this._isFlipping = true;

		i = currLoc + isNext - 2;
		const spread = spreads[i];
		const {isCover, isFirst} = spread;
		spread.classList.toggle('flipped');
		if (isCover) {
			if (isFirst) handleBook[0]();
			else handleBook[1]();
		};
		setTimeout(() => {
			spread.style.zIndex =
			spread.querySelector('.front').style.zIndex =
				getIndex();
		}, isNext*250);
		setTimeout(() => {
			this._isFlipping = false
		}, 250);
		return true;
	}
};

function rotateBook() {
	const isMaxLoc = currLoc === maxLoc;
	const isMinLoc = currLoc === 1;
	const isRotated = ~book.style.transform.indexOf('rotate');
	if (isRotated) {
		bookTranslateX((isMinLoc ? 0 : isMaxLoc ? 100 : 50) + '%');
		transformBtns(isMinLoc || isMaxLoc ? 0 : 180);
		return;
	};
	book.style.transform = `rotate(90deg) translateX(${isMaxLoc ? 120 : 20}%)`;
	transformBtns(80);
}

// Listeners
book.addEventListener('click', ({target: el}) => {
	if (el.closest('#qr'))
		navigator.clipboard.writeText(location.href);
	else if (el.closest('.front'))
		pageController.next();
	else
		pageController.prev();
});
prevBtn.addEventListener('click', () => pageController.prev());
nextBtn.addEventListener('click', () => pageController.next());
rotateBtn.addEventListener('click', rotateBook);
idBtn.addEventListener('click', getPassport);
const keyEvents = {
	ArrowRight() {pageController.next()},
	ArrowLeft() {pageController.prev()}
};
document.addEventListener('keydown', ({key}) => {
	if (getSelection().anchorNode === idForm) return;
	if (+key) idInput.select();
	else keyEvents[key]?.();
});
idInput.addEventListener('keydown', e => e.key === 'Enter' && getPassport());
idInput.addEventListener('input', ({target: el}) => {
	el.value = +el.value > el.max
		? el.max
		: el.value.replace(/^[-0]+/g, '');
});