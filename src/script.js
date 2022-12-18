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

const $ = id => document.getElementById(id);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

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
const osisLogo = $('osis');

const createGetter = (prefix) => ({
	get: (target, name) => target.querySelector(prefix + name)
});
const proxyDOM = (obj) => new Proxy(obj, {
	set: (target, name, value) => target[name].textContent = value
});

const u = new Proxy($('f3'), createGetter('#u_'));
const mainPage = proxyDOM({
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
	stamp: u.stamp,
});

const cah = new Proxy($('country_and_herb'), createGetter('#'));
const frontCover = proxyDOM({
	countryName: cah['country-name'],
	herb: cah.herb,
});

const countries = [
	['gsld', '#332266', 'Республика Гусляндия', 'goose.svg'],
	['ngld', '#55bb33', 'Республика Неогусляндия', 'goose.svg'],
	['duck', '#ee8844', 'Утиное Государство', 'duck.png']
].map(([code, colorHEX, name, stdImg]) => ({
	code, name, colorHEX,
	color: colorHEX.slice(1).match(/../g).map(num => parseInt(num, 16)),
	dir: FILES_PATH + code + '/',
	standardImage: FILES_PATH + 'standard-image/' + stdImg
}));

const qr = Object.assign(new QRCode($('qr'), {
	text: getPassportUrl(currPassportId),
	width: 256,
	height: 256,
	colorDark : DEFAULT_COLOR,
	colorLight : '#00000000',
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
lSpread.isCover =
sSpread.isExtreme = sSpread.isFirst =
plSpread.isExtreme = true;

const maxLoc = spreads.length + 1;

function getPassport() {
	const id = +idInput.value;
	if (
		id > 0 &&
		id !== currPassportId
	) {
		currPassportId = id;
		history.pushState({id: currPassportId}, null,
			getPassportUrl(currPassportId)
		);
		qr.makeCode(getPassportUrl(currPassportId));
		toHtml(passports[currPassportId-1]);
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
	if (currCountry !== country) {
		const is = {
			[country.code.toUpperCase()]: true
		};
		const herbUrl = country.dir + '/herb.svg';
		frontCover.countryName.style.fontSize = (is.NGLD ? '20' : '24') + 'px';
		frontCover.countryName = country.name;
		frontCover.herb.src = herbUrl;
		changeColor(
			getComputedStyle(body).getPropertyValue('--p_color'),
			country.color
		);
		book.style.setProperty('--herb_url', `url(${herbUrl})`);
		currCountry = country;

		mainPage.flagCont.style = is.DUCK
			? 'text-align: center; background: #8ce; width: 80%'
			: 'text-align: none; background: none; width: none';
		Object.assign(mainPage.flag, {
			src: is.DUCK
				? herbUrl
				: country.dir + '/flag.svg',
			style: `float: ${is.DUCK ? 'none' : 'left'}`
		});
		mainPage.country = country.name;
	};
	mainPage.photo.src = photoUrl || country.standardImage;
	Object.assign(mainPage, {name, id, surname, dob, sex, nationality, doi});
	const {stamp} = mainPage;
	switch (passportStatus) {
		case 1:
			if (stamp.textContent === 'Аннулировано')
				stamp.innerHTML = osisLogo.innerHTML;
			Object.assign(stamp.style, {
				visibility: 'visible',
				width: '130px',
				transform: 'rotate(-90deg) translate(100%, 400%)',
			});
			break;
		case -1:
			stamp.textContent = 'Аннулировано';
			Object.assign(stamp.style, {
				visibility: 'visible',
				width: '90%',
				transform: 'rotate(-90deg) translateY(200%)',
			});
			break;
		default:
			stamp.style.visibility = 'hidden';
	};
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
	const {round} = Math;
	qr.startColorChanging();
	if (!doQRColorTransition) {
		qr.changeColor(finalRGB);
		qr.stopColorChanging();
	};
	colorChanging = setInterval(() => {
		for (let i = 0; i < 3; i++) curr[i] -= arr[i];
		currRGB = `rgb(${curr.map(num => round(num))})`;
		body.style.setProperty('--p_color', currRGB);
		if (doQRColorTransition) qr.changeColor(currRGB);
		if (currRGB === finalRGB) {
			if (doQRColorTransition) qr.stopColorChanging();
			else doQRColorTransition = true;
			clearInterval(colorChanging);
		}
	}, animDuration/animFrames);
}

function openBook() {
	book.style.transform = 'translateX(50%)';
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
}

function closeBook() {
	let btn;
	if (currLoc === 2) {
		book.style.transform = 'translateX(0)';
		btn = prevBtn;
	} else {
		book.style.transform = 'translateX(100%)';
		btn = nextBtn;
	};
	btn.style.opacity = 0;
	setTimeout(() => {
		if (btn.style.opacity === '0') btn.style.visibility = 'hidden';
	}, 250);
	transformBtns(0);
}

const pageController = {
	_lastPageFrontId: 'f4',
	_firstPageBackId: 'b2',
	_isFlipping: false,
	_nextParams: {
		isShadowPage(id) {return id === this._firstPageBackId},
		getIndex: () => currLoc - spreads.length,
		handleBook: [openBook, closeBook],
	},
	_prevParams: {
		isShadowPage(id) {return id === this._lastPageFrontId},
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
	_flip(isNext, {handleBook, isShadowPage, getIndex}) {
		if (this._isFlipping) return false;
		this._isFlipping = true;

		i = currLoc + isNext - 2;
		const spread = spreads[i];
		const {isCover, isFirst} = spread;
		spread.classList.toggle('flipped');
		if (isCover) {
			if (isFirst) handleBook[0]();
			else handleBook[1]();
		} else if (spread.isExtreme) {
			const id = isFirst ? this._firstPageBackId : this._lastPageFrontId;
			const paper = document.getElementById(id).querySelector('.paper');
			paper.style.boxShadow = 'none';
			if (isShadowPage(id)) setTimeout(() => {
				const sign = isFirst ? '-' : '';
				paper.style.boxShadow = sign + '5px 0 5px #0005';
			}, 250);
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
	if (book.style.transform.indexOf('rotate') === -1) {
		book.style.transform = `rotate(90deg) translateX(${isMaxLoc ? 120 : 20}%)`;
		transformBtns(80);
		return;
	};
	book.style.transform = `translateX(${isMinLoc ? 0 : isMaxLoc ? 100 : 50}%)`;
	transformBtns(isMinLoc || isMaxLoc ? 0 : 180);
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