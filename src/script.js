// Запрос паспортов
fetch('https://script.google.com/macros/s/AKfycbybniugM8wK3-QLOPQ51AJ6jgHrZOfTJ6JSmXDMoT3T8AA3YSLTsVh1893t62zhQTJlFA/exec')
.then(data => data.json())
.then(({response}) => {
	passports = response;
	body.classList.remove('loading');
	idInput.max = passports.length;
	if (currPassportId) {
		idInput.value = currPassportId;
		toHtml(passports[currPassportId-1]);
	};
	console.log('Паспорта получены');
});

let passports, currCountry, colorChanging;
let currPassportId = +location.search.split('id=')[1] || false;
let pageFlipping = false;
let currLoc = 1;

const {protocol, host, pathname} = location;
const BASE_URL = protocol + "//" + host + pathname;
const FILES_PATH = './files/';

const $ = a => document.getElementById(a);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

// Получение DOM-элементов
const {body} = document;
const [prevBtn, rotateBtn, idBtn, nextBtn] = body.querySelectorAll('.p_btn');
const spreads = body.querySelectorAll('.spread');
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
	print: u.print,
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
].map(a => ({
	dir: FILES_PATH + a[0] + '/',
	code: a[0],
	color: a[1],
	name: a[2],
	standardImage: FILES_PATH + 'standard-image/' + a[3]
}));

// Присвоение положения страницам и цвета обложке
for (let i = 0; i < spreads.length; i++) {
	spreads[i].style.zIndex = spreads.length - i;
	if (spreads[i].querySelector('.paper')) spreads[i].style.visibility = 'hidden';
};
body.style.setProperty('--p_color', '#999999');

const maxLoc = spreads.length + 1;

// Триггеры
book.addEventListener('click', ({target: el}) => {
	if (el.closest('.back'))
		goPage(false);
	else if (!el.closest('#copy'))
		goPage(true);
	else if (currPassportId)
		navigator.clipboard.writeText(location.href);
});
const pageHandler = e => goPage(e.target === nextBtn);
prevBtn.addEventListener('click', pageHandler);
nextBtn.addEventListener('click', pageHandler);
rotateBtn.addEventListener('click', rotateBook);
idBtn.addEventListener('click', getPassport);
const keyEvents = {
	ArrowRight() {goPage(true)},
	ArrowLeft() {goPage(false)},
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

function getPassport() {
	const {value} = idInput;
	if (
		value > 0 &&
		value != currPassportId
	) {
		currPassportId = value;
		history.pushState({id: currPassportId}, null,
			BASE_URL + '?id=' + currPassportId
		);
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
	const [name, surname, sex, countryI, nationality, id, dob, doi, photoUrl, passportStatus, marriages] = data;
	const country = countries[countryI];
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
	const {print} = mainPage;
	switch (passportStatus) {
		case 1:
			if (print.textContent === 'Аннулировано')
				print.innerHTML = osisLogo;
			Object.assign(print.style, {
				visibility: 'visible',
				width: '130px',
				transform: 'rotate(-90deg) translate(100%, 400%)',
			});
			break;
		case -1:
			print.textContent = 'Аннулировано';
			Object.assign(print.style, {
				visibility: 'visible',
				width: '90%',
				transform: 'rotate(-90deg) translateY(200%)',
			});
			break;
		default:
			print.style.visibility = 'hidden';
	};
	const f4 = document.getElementById('marriages');
	f4.innerHTML = '';
	if (!marriages) return;
	for (let i = 0; i < marriages.length; i++) {
		const [date, name, status] = marriages[i];
		const divorce = status
			? `<div class='divorce'> Расторгнут ${status} </div>`
			: '';
		f4.innerHTML += `
			<div class='card'>
				<div class='data'>
					<span>${name}</span>
					<span class='date'>${date}</span>
				</div>
				${divorce}
			</div>
		`;
	};
}

function changeColor(currHEX, finalHEX, animDuration = 1000, animFrames = 60) {
	clearInterval(colorChanging);
	const toRGB = str => [
		parseInt(str[1]+str[2], 16),
		parseInt(str[3]+str[4], 16),
		parseInt(str[5]+str[6], 16)
	];

	const currRGB = toRGB(currHEX);
	const finalRGB = toRGB(finalHEX);
	const arr = [
		(currRGB[0]-finalRGB[0])/animFrames,
		(currRGB[1]-finalRGB[1])/animFrames,
		(currRGB[2]-finalRGB[2])/animFrames
	];

	const {round} = Math;
	colorChanging = setInterval(() => {
		currHEX = '#' +
		round(currRGB[0] -= arr[0]).toString(16) +
		round(currRGB[1] -= arr[1]).toString(16) +
		round(currRGB[2] -= arr[2]).toString(16);
		body.style.setProperty('--p_color', currHEX);
		if (currHEX === finalHEX) clearInterval(colorChanging);
	}, animDuration/animFrames);
}

const setSpreadsVisibility = state => {
	for (let i = 0; i < spreads.length; i++)
		if (spreads[i].querySelector('.paper')) spreads[i].style.visibility = state;
};

function openBook() {
	book.style.transform = 'translateX(50%)';
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
	setSpreadsVisibility('visible');
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
		setSpreadsVisibility('hidden');
	}, 250);
	transformBtns(0);
}

function goPage(page) {
	if (pageFlipping) return;

	if (typeof page !== 'boolean') {
		if (isNaN(page)) return;
		page = +page;
		const maxPage = maxLoc*2-5;
		if (page < 1) page = -1
		else if (page > maxPage) page = maxPage + 1;
		let currPage = currLoc*2-3;
		const next = currPage < page;
		const interval = setInterval(() => {
			if (page===currPage || page===currPage-1) clearInterval(interval);
			goPage(next);
			currPage += next ? 2 : -2;
		}, 270);
		return;
	};

	let i, shadowPage, getIndex, changeCurrLoc, handleBook;
	if (page) {
		if (currLoc === maxLoc) return;
		shadowPage = 'b2';
		getIndex = () => currLoc - spreads.length;
		changeCurrLoc = () => currLoc++;
		handleBook = [openBook, closeBook];
	} else {
		if (currLoc === 1) return;
		shadowPage = 'f4';
		getIndex = () => spreads.length - i;
		changeCurrLoc = () => currLoc--;
		handleBook = [closeBook, openBook];
	};

	pageFlipping = true;
	const pNum = +page;
	i = currLoc + pNum - 2;
	const spread = spreads[i];
	if (!i) handleBook[0]()
	else if (currLoc === maxLoc-pNum) handleBook[1]();
	spread.classList.toggle('flipped');
	const extremePage = spread.querySelector('#f4') || spread.querySelector('#b2');
	if (extremePage) {
		const paper = extremePage.querySelector(`.paper`);
		paper.style.boxShadow = 'none';
		const pageId = extremePage.id
		if (pageId === shadowPage) setTimeout(() => {
			const isB2 = pageId === 'b2';
			paper.style.boxShadow = (isB2 ? '-' : '') + '5px 0 5px #0005';
		}, 250);
	};
	setTimeout(() => {
		spread.style.zIndex =
		spread.querySelector('.front').style.zIndex = getIndex();
	}, pNum*250);
	setTimeout(() => pageFlipping = false, 250);
	changeCurrLoc();
}

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