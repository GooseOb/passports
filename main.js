// Запрос паспортов
fetch('https://script.google.com/macros/s/AKfycbybniugM8wK3-QLOPQ51AJ6jgHrZOfTJ6JSmXDMoT3T8AA3YSLTsVh1893t62zhQTJlFA/exec')
.then(data => data.json())
.then(({response}) => {
	passports = response;
	idInput.classList.remove('loading');
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

const $ = a => body.querySelector(a);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

// Получение DOM-элементов
const {body} = document;
const [prevBtn, rotateBtn, idBtn, nextBtn] = body.querySelectorAll('.p_btn');
const papers = body.querySelectorAll('.paper');
const idForm = $('#id-form');
const idInput = $('#id-input');
const book = $('#book');

let mainPage, frontCover;
{
	const createGetter = prefix => ({get: (target, name) => target.querySelector(prefix + name)});
	const u = new Proxy($('#f3'), createGetter('#u_'));
	mainPage = {
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
	};

	const cah = new Proxy($('#country_and_herb'), createGetter('#'));
	frontCover = {
		countryName: cah['country-name'],
		herb: cah.herb,
	};
}

const countries = [
	['gsld', '#332266', 'Республика Гусляндия', 'goose.svg'],
	['ngld', '#55bb33', 'Республика Неогусляндия', 'goose.svg'],
	['duck', '#ee8844', 'Утиное Государство', 'duck.png']
].map(a => ({code: a[0], color: a[1], name: a[2], photo: a[3]}));

// Присвоение положения страницам и цвета обложке
for (let i = 0; i < papers.length; i++) {
	papers[i].style.zIndex = papers.length - i;
	if (papers[i].querySelector('.page')) papers[i].style.visibility = 'hidden';
};
body.style.setProperty('--p_color', '#999999');

const maxLoc = papers.length + 1;

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
	get ArrowRight() {goPage(true)},
	get ArrowLeft() {goPage(false)},
};
document.addEventListener('keydown', ({key}) => {
	if (getSelection().anchorNode === idForm) return;
	if (+key) idInput.select();
	else keyEvents[key];
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
		const {protocol, host, pathname} = location;
		history.pushState({id: currPassportId}, null,
			protocol + "//" + host + pathname + '?id=' + currPassportId
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

mainPage.photo.onerror = ({target: el}) => el.src = './standard-image/' + currCountry.photo;
function toHtml(data) {
	const [name, surname, sex, countryI, nationality, id, dob, doi, photoUrl, passportStatus, marrys] = data;
	const country = countries[countryI];
	if (currCountry !== country) {
		const is = {
			[country.code.toUpperCase()]: true
		};
		const herbUrl = `./${country.code}/herb.svg`;
		frontCover.countryName.style.fontSize = (is.NGLD ? '20' : '24') + 'px';
		frontCover.countryName.textContent = country.name;
		frontCover.herb.src = herbUrl;
		editColor(
			getComputedStyle(body).getPropertyValue('--p_color'),
			country.color
		);
		book.style.setProperty('--herb_url', `url(${herbUrl})`);
		currCountry = country;

		mainPage.flagCont.style = is.DUCK
			? 'text-align: center; background: #8ce; width: 80%'
			: 'text-align: none; background: none; width: none';
		Object.assign(mainPage.flag, {
			src: is.DUCK ? herbUrl : `./${country.code}/flag.svg`,
			style: `float: ${is.DUCK ? 'none' : 'left'}`
		});
		mainPage.country.textContent = country.name;
	};
	mainPage.photo.src = photoUrl || './standard-image/' + country.photo;
	mainPage.name.textContent = name;
	mainPage.id.textContent = id;
	mainPage.surname.textContent = surname;
	mainPage.dob.textContent = dob;
	mainPage.sex.textContent = sex;
	mainPage.nationality.textContent = nationality;
	mainPage.doi.textContent = doi;
	const {print} = mainPage;
	switch (passportStatus) {
		case 1:
			if (print.textContent === 'Аннулировано')
				print.innerHTML = $('#osis').innerHTML;
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
	const f4 = $('#f4');
	const trs = Array.from(f4.querySelectorAll('tr')).slice(2);
	const isTextInRow = i => !!trs[i].querySelectorAll('td')[1].textContent;
	if (isTextInRow(0)) {
		for (let i = 0; isTextInRow(i); i++)
			trs[i].innerHTML = '<tr><td>&nbsp</td><td></td><td></td></tr>';
		for (let i = 0; i < trs.length; i++)
			trs[i].style.display &&= '';
	};
	if (!marrys) return;
	for (let i = 0; i < marrys.length; i++) {
		const [date, name, type] = marrys[i];
		trs[i].innerHTML = `
		<td>${date}</td>
		<td>${name}</td>
		<td>${+type ? 'Заключ' : 'Расторж'}</td>
		`;
	};
	const pageHeigth = f4.querySelector('.page').offsetHeight;
	const tableHeigth = f4.querySelector('table').offsetHeight;
	let trsNum = Math.ceil((tableHeigth + 60 - pageHeigth) / 30);
	let i = trs.length-1;
	while (trsNum) {
		trs[i--].style.display = 'none';
		trsNum--;
	};
}

function editColor(currHEX, finalHEX, animDuration=1000, animFrames=60) {
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

function openBook() {
	book.style.transform = 'translateX(50%)';
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
	for (let i = 0; i < papers.length; i++)
		if (papers[i].querySelector('.page')) papers[i].style.visibility = 'visible';
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
		for (let i = 0; i < papers.length; i++)
			if (papers[i].querySelector('.page')) papers[i].style.visibility = 'hidden';
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

	let i, shadowPage, getIndex, editCurrLoc, handleBook;
	if (page) {
		if (currLoc === maxLoc) return;
		shadowPage = 'b2';
		getIndex = () => currLoc - papers.length;
		editCurrLoc = () => currLoc++;
		handleBook = [openBook, closeBook];
	} else {
		if (currLoc === 1) return;
		shadowPage = 'f4';
		getIndex = () => papers.length - i;
		editCurrLoc = () => currLoc--;
		handleBook = [closeBook, openBook];
	};

	pageFlipping = true;
	const pNum = +page;
	i = currLoc + pNum - 2;
	const paper = papers[i];
	if (!i) handleBook[0]()
	else if (currLoc === maxLoc-pNum) handleBook[1]();
	paper.classList.toggle('flipped');
	const pageId = paper.querySelector('#f4')?.id || paper.querySelector('#b2')?.id;
	if (pageId) {
		const page = paper.querySelector(`#${pageId} > .page`);
		page.style.boxShadow = 'none';
		if (pageId === shadowPage) setTimeout(() => {
			page.style.boxShadow = (pageId==='b2' ? '-' : '') + '5px 0 5px #0005';
		}, 250);
	};
	setTimeout(() => {
		paper.style.zIndex =
		paper.querySelector('.front').style.zIndex = getIndex();
	}, pNum*250);
	setTimeout(() => pageFlipping = false, 250);
	editCurrLoc();
}

function rotateBook() {
	if (book.style.transform.indexOf('rotate') === -1) {
		book.style.transform = `rotate(90deg) translateX(${currLoc===maxLoc ? 120 : 20}%)`;
		transformBtns(80);
		return;
	};
	book.style.transform = `translateX(${currLoc===1 ? 0 : currLoc===maxLoc ? 100 : 50}%)`;
	transformBtns(currLoc===1 || currLoc===maxLoc ? 0 : 180);
}