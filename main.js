// Запрос паспортов
fetch('https://script.google.com/macros/s/AKfycbybniugM8wK3-QLOPQ51AJ6jgHrZOfTJ6JSmXDMoT3T8AA3YSLTsVh1893t62zhQTJlFA/exec')
.then(data => data.text())
.then(data => {
	passports = JSON.parse(data).response;
	idInput.classList.remove('loading');
	idInput.max = passports.length;
	if (currentPassportID) {
		idInput.value = currentPassportID;
		toHtml(passports[currentPassportID-1]);
	};
	console.log('Паспорта получены');
});
let passports;

const $ = a => body.querySelector(a);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

// Получение DOM-элементов
const body = document.body;
const [prevBtn, rotateBtn, idBtn, nextBtn] = body.querySelectorAll('.p_btn');
const papers = body.querySelectorAll('.paper');
const idForm = $('#id-form');
const idInput = $('#id-input');
const book = $('#book');

const countries = [
//	[название гос-ва,			цвет,		код,	стандартное фото]
	['Республика Гусляндия',	'#332266',	'gsld',	'goose.svg'],
	['Республика Неогусляндия',	'#55bb33',	'ngld',	'goose.svg'],
	['Утиное Государство',		'#ee8844',	'duck',	'duck.png' ]
];
let currentPassportID = +location.search.split('id=')[1] || false;

// Присвоение положения страницам и цвета обложке
for (let i=0; i < papers.length; i++) {
	papers[i].style.zIndex = papers.length - i;
	if (papers[i].querySelector('.list')) papers[i].style.visibility = 'hidden';
};
body.style.setProperty('--p_color', '#999999');

const maxLoc = papers.length + 1;
let currLoc = 1;
let pageFlip = false;
let currCountry;

// Триггеры
book.addEventListener('click', e => {
	if (e.target.closest('.back'))
		goPage(false);
	else if (!e.target.closest('#copy'))
		goPage(true);
	else if (currentPassportID)
		navigator.clipboard.writeText('https://gooseob.github.io/passports/?id='+currentPassportID);
});
const pageHandler = e => goPage(e.target === nextBtn);
prevBtn.addEventListener('click', pageHandler);
nextBtn.addEventListener('click', pageHandler);
rotateBtn.addEventListener('click', rotateBook);
idBtn.addEventListener('click', getPassport);
document.addEventListener('keydown', e => {
	if (getSelection().anchorNode === idForm) return; 
	switch (e.key) {
		case 'ArrowRight': goPage(true); return;
		case 'ArrowLeft': goPage(false); return;
	};
	if (+e.key) idInput.select();
});
idInput.addEventListener('keydown', e => e.key === 'Enter' && getPassport());
idInput.addEventListener('input', function() {
	this.value = +this.value > this.max
		? this.max
		: this.value.replace(/^[-0]+/g, '');
});

function getPassport() {
	if (
		idInput.value > 0 &&
		idInput.value != currentPassportID
	) toHtml(passports[idInput.value-1]);
}

function toHtml(data) {
	const [name, surname, sex, countryI, nationality, id, dob, doi, photo, isTrue, marrys] = data;
	const country = countries[countryI];
	currentPassportID = idInput.value;
	if (currCountry !== country[0]) {
		$('#country_and_herb').innerHTML = `
		<h2 id='country-name' style='font-size: ${countryI === 1 ? '20' : '24'}px'>${country[0]}</h2>
		<img src='./${country[2]}/herb.svg' id='herb'>
		`;
		editColor(
			getComputedStyle(body).getPropertyValue('--p_color'),
			country[1]
		);
		book.style.setProperty('--herb_url', `url('./${country[2]}/herb.svg')`);
		currCountry = country[0];
	};
	const f3 = $('#f3');
	f3.querySelector('.main-content').innerHTML = `
	<span id='u_flag-container' style='${
		countryI === 2
		? 'text-align: center; background: #8ce; width: 80%'
		: 'text-align: none; background: none; width: none'
	}'>
		<img src='./${country[2]}/${countryI === 2 ? 'herb' : 'flag'}.svg' alt='Флаг' id='u_flag'
			style='float: ${countryI === 2 ? 'none' : 'left'}'>
	</span>
	<h2 id='u_country'>${country[0]}</h2>
	<img src='${photo || './standard-image/' + country[3]}' alt='Фото' id='u_photo'>
	<span class='u_title'>Имя</span>
	<span class='u_title'>ID VK</span>
	<span class='u_output' id='u_name'>${name}</span>
	<span class='u_output' id='u_id'>${id}</span>
	<span class='u_title'>Фамилия</span>
	<span class='u_title'>Дата рождения</span>
	<span class='u_output' id='u_surname'>${surname}</span>
	<span class='u_output' id='u_DoB'>${dob}</span>
	<span class='u_title u_sex'>Пол</span>
	<span class='u_title'>Национальность</span>
	<span class='u_title'>Дата выдачи</span>
	<span class='u_output u_sex' id='u_sex'>${sex}</span>
	<span class='u_output' id='u_nationality'>${nationality}</span>
	<span class='u_output' id='u_DoI'>${doi}</span>
	<span class='u_title' id='u_pdep'>Паспортный департамент ОСИГ</span>
	`;
	const print = f3.querySelector('#u_print');
	switch (isTrue) {
		case 1: if (print.textContent !== 'Аннулировано') break;
			print.style.visibility = 'visible';
			print.innerHTML = $('#osis').innerHTML;
			print.style.width = '130px';
			print.style.transform = 'rotate(-90deg) translate(100%, 400%)';
			break;
		case -1:
			print.style.visibility = 'visible';
			print.textContent = 'Аннулировано';
			print.style.width = '90%';
			print.style.transform = 'rotate(-90deg) translateY(200%)';
			break;
		default:
			print.style.visibility = 'hidden';
	};
	const f4 = $('#f4');
	const trs = Array.from(f4.querySelectorAll('tr')).slice(2);
	for (let i=0; trs[i].querySelectorAll('td')[1].textContent; i++)
		trs[i].innerHTML = '<tr><td>&nbsp</td><td></td><td></td></tr>';
	if (!marrys) return;
	for (let i=0; i < marrys.length; i++) {
		const [date, name, type] = marrys[i];
		trs[i].innerHTML = `
		<td>${date}</td>
		<td>${name}</td>
		<td>${+type ? 'Заключ' : 'Расторж'}</td>
		`;
	};
	const getHeight = el => f4.querySelector(el).offsetHeight;
	for (let i = trs.length-1; getHeight('.list')-30 < getHeight('table'); i--)
		trs[i].style.display = 'none';
}

function editColor(currHEX, finalHEX, animDuration=1000, animFrames=60) {
	const toRGB = str => [
		parseInt(str[1]+str[2], 16),
		parseInt(str[3]+str[4], 16),
		parseInt(str[5]+str[6], 16)
	];
	
	let currRGB = toRGB(currHEX);
	const finalRGB = toRGB(finalHEX);
	const arr = [
		(currRGB[0]-finalRGB[0])/animFrames,
		(currRGB[1]-finalRGB[1])/animFrames,
		(currRGB[2]-finalRGB[2])/animFrames
	];

	const interval = setInterval(() => {
		currHEX = '#' +
		Math.round(currRGB[0] -= arr[0]).toString(16) +
		Math.round(currRGB[1] -= arr[1]).toString(16) +
		Math.round(currRGB[2] -= arr[2]).toString(16);
		body.style.cssText = '--p_color:' + currHEX;
		if (currHEX === finalHEX) clearInterval(interval);
	}, animDuration/animFrames);
}

function openBook() {
	book.style.transform = 'translateX(50%)';
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
	for (let i=0; i < papers.length; i++)
		if (papers[i].querySelector('.list')) papers[i].style.visibility = 'visible';
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
		for (let i=0; i < papers.length; i++)
			if (papers[i].querySelector('.list')) papers[i].style.visibility = 'hidden';
	}, 250);
	transformBtns(0);
}

function goPage(page) {
	if (pageFlip) return;

	if (typeof page !== 'boolean') {
		if (isNaN(page)) return;
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

	let i, shadowList, getIndex, editCurrLoc, handleBook;
	if (page) {
		if (currLoc === maxLoc) return;
		shadowList = 'b2';
		getIndex = () => currLoc - papers.length;
		editCurrLoc = () => currLoc++;
		handleBook = [openBook, closeBook];
	} else {
		if (currLoc === 1) return;
		shadowList = 'f4';
		getIndex = () => papers.length - i;
		editCurrLoc = () => currLoc--;
		handleBook = [closeBook, openBook];
	};

	pageFlip = true;
	const pNum = +page;
	i = currLoc + pNum - 2;
	const paper = papers[i];
	if (!i) handleBook[0]()
	else if (currLoc === maxLoc-pNum) handleBook[1]();
	paper.classList.toggle('flipped');
	const listId = paper.querySelector('#f4')?.id || paper.querySelector('#b2')?.id;
	if (listId) {
		const list = paper.querySelector(`#${listId} > .list`);
		list.style.boxShadow = 'none';
		if (listId === shadowList) setTimeout(() => {
			list.style.boxShadow = (listId==='b2' ? '-' : '') + '5px 0 5px #0005';
		}, 250);
	};
	setTimeout(() => {
		paper.style.zIndex =
		paper.querySelector('.front').style.zIndex = getIndex();
	}, pNum*250);
	setTimeout(() => pageFlip = false, 250);
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