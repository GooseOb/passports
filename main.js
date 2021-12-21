// Запрос паспорта
fetch('https://script.google.com/macros/s/AKfycbybniugM8wK3-QLOPQ51AJ6jgHrZOfTJ6JSmXDMoT3T8AA3YSLTsVh1893t62zhQTJlFA/exec')
.then(data => data.text())
.then(data => {
	passports = JSON.parse(data).response;
	idInput.max = passports.length;
	if (currentPassportID) {
		idInput.value = currentPassportID;
		toHtml(passports[currentPassportID-1]);
	};
	console.log('Паспорта получены');
});
let passports;

const $ = a => document.querySelector(a);
const transformBtns = num => {
	prevBtn.style.transform = `translateX(-${num}px)`;
	nextBtn.style.transform = `translateX(${num}px)`;
};

// Получение DOM-элементов
const [prevBtn, rotateBtn, idBtn, nextBtn] = document.querySelectorAll('.p_btn');
const papers = document.querySelectorAll('.paper');
const idInput = $('#id-input');
const book = $('#book');
const copy = $('#copy');

const countries = [
	// [название гос-ва, цвет, герб, флаг, стандартное фото]
	['Республика Гусляндия', '#4488ee', 'gooselande/herb.svg', 'gooselande/flag.svg', 'standard-image/goose.svg'],
	['Республика Неогусляндия', '#55bb33', 'newgooselande/herb.svg', 'newgooselande/flag.svg', 'standard-image/goose.svg'],
	['Утиное Государство', '#ee8844', 'duck-state/herb.svg', 'duck-state/herb.svg', 'standard-image/duck.png']
];
let currentPassportID = +location.search.split('id=')[1] || false;

// Присвоение положения страницам и цвета обложке
for (i=0; i < papers.length; i++) {
	papers[i].style.zIndex = papers.length - i
	if (papers[i].querySelector('.list')) papers[i].style.visibility = 'hidden';
};
$('body').style.setProperty('--p_color', '#999999');

const maxLoc = papers.length + 1;
let currLoc = 1;
let pageFlip = false;

// Триггеры
const fronts = document.querySelectorAll('.front');
for (let i=0; i < fronts.length; i++)
	fronts[i].addEventListener('click', e => {
		if (e.target.closest('#copy') != copy) goPage(true);
		else if (currentPassportID) navigator.clipboard.writeText('https://gooseob.github.io/passports/?id='+currentPassportID);
	});
const backs = document.querySelectorAll('.back');
for (let i=0; i < backs.length; i++) backs[i].addEventListener('click', () => goPage(false));
prevBtn.addEventListener('click', () => goPage(false));
nextBtn.addEventListener('click', () => goPage(true));
rotateBtn.addEventListener('click', rotateBook);
idBtn.addEventListener('click', getPassport);
document.addEventListener('keydown', e => {
	if (getSelection().anchorNode === $('#id-form')) return; 
	switch (e.key) {
		case 'ArrowRight': goPage(true); return;
		case 'ArrowLeft': goPage(false); return;
	};
	if (+e.key) idInput.select();
});
idInput.addEventListener('keydown', e => {
	if (e.key == 'Enter') getPassport();
});
idInput.addEventListener('input', function() {
	this.value = this.value.replace(/^[-0]+/g, '');
	if (+this.value > this.max) this.value = this.max;
});

function getPassport() {
	if (
		idInput.value > 0 &&
		idInput.value != currentPassportID
	) toHtml(passports[idInput.value-1]);
}

function toHtml(data) {
	currentPassportID = idInput.value;
	$('#u_name').textContent = data[0];
	$('#u_surname').textContent = data[1];
	$('#u_sex').textContent = data[2];
	if ($('#u_country').textContent != countries[data[3]][0]) {
		$('#country-name').textContent = countries[data[3]][0].toUpperCase();
		$('#u_country').textContent = countries[data[3]][0];
		editColor(
			getComputedStyle($('body')).getPropertyValue('--p_color'),
			countries[data[3]][1]
		);
		book.style.setProperty('--herb_url', `url('./${countries[data[3]][2]}')`);
		$('#herb').src = './' + countries[data[3]][2];
		$('#u_flag').src = './' + countries[data[3]][3];
	}
	if (data[3] == 1) {
		$('#country-name').style.fontSize = '20px';
	} else $('#country-name').style.fontSize = '24px';
	const flagCont = $('#u_flag-container');
	if (data[3] == 2) {
		flagCont.style.textAlign = 'center';
		flagCont.style.background = '#88ccee';
		flagCont.style.width = '80%';
		$('#u_flag').style.float = 'none';
	} else {
		flagCont.style.textAlign =
		flagCont.style.background =
		flagCont.style.width = 'none';
		$('#u_flag').style.float = 'left';
	};
	$('#u_nationality').textContent = data[4]; 
	$('#u_id').textContent = data[5]; 
	$('#u_DoB').textContent = data[6];
	$('#u_DoI').textContent = data[7];
	$('#u_photo').src = data[8] || './' + countries[data[3]][4];
	const print = $('#u_print');
	switch (data[9]) {
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
	const trs = Array.from(document.querySelectorAll('#f4 tr')).slice(2);
	for (let i=0; trs[i].querySelectorAll('td')[1].textContent; i++) {
		const marry = trs[i].querySelectorAll('td');
		marry[0].innerHTML = '&nbsp';
		marry[1].textContent =
		marry[2].textContent = '';
	};
	if (!data[10]) return;
	for (let i=0; i < data[10].length; i++) {
		const dataI = data[10][i];
		const marry = trs[i].querySelectorAll('td');
		marry[0].textContent = dataI[0];
		marry[1].textContent = dataI[1];
		marry[2].textContent = +dataI[2] ? 'Заключ' : 'Расторж';
	};
	const bRow = trs.reverse();
	let i = 0;
	while ($('#f4 > .list').offsetHeight-30 < $('table').offsetHeight) bRow[i++].style.display = 'none';
}

async function editColor(currHEX, finalHEX, animDuration=1000, animFrames=60) {
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

	let body = $('body');
	const interval = setInterval(() => {
		currRGB = [
			currRGB[0]-arr[0],
			currRGB[1]-arr[1],
			currRGB[2]-arr[2],
		];
		currHEX = '#' +
		Math.round(currRGB[0]).toString(16) +
		Math.round(currRGB[1]).toString(16) +
		Math.round(currRGB[2]).toString(16);

		body.style.setProperty('--p_color', currHEX);
		if (currHEX == finalHEX) clearInterval(interval);
	}, animDuration/animFrames);
}

async function openBook() {
	book.style.transform = 'translateX(50%)';
	transformBtns(180);
	prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
	prevBtn.style.opacity = nextBtn.style.opacity = 100;
	for (i=0; i < papers.length; i++) {
		if (papers[i].querySelector('.list')) papers[i].style.visibility = 'visible';
	};
}

async function closeBook() {
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
		if (btn.style.opacity == 0) btn.style.visibility = 'hidden';
		for (i=0; i < papers.length; i++) {
			if (papers[i].querySelector('.list')) papers[i].style.visibility = 'hidden';
		};
	}, 250);
	transformBtns(0);
}

function goPage(page) {
	if (pageFlip) return;
	console.time('all');
	let i, shadowList, getIndex, editCurrLoc;
	const notBoolean = typeof page !== 'boolean';

	if (notBoolean && typeof +page === 'number') {
		const maxPage = maxLoc*2-5;
		if (page < 1) page = -1
		else if (maxPage < page) page = maxPage+1;
		const interval = setInterval(() => {
			const currPage = currLoc*2-3;
			if (currPage==page || currPage-1==page) clearInterval(interval)
			else goPage(currPage < page);
		}, 270);
		return;
	};

	if (notBoolean) return;
	if (page) {
		if (currLoc === maxLoc) return;
		shadowList = 'b2';
		getIndex = () => currLoc - papers.length;
		editCurrLoc = () => currLoc++;
	} else {
		if (currLoc === 1) return;
		shadowList = 'f4';
		getIndex = () => papers.length - i;
		editCurrLoc = () => currLoc--;
	};

	pageFlip = true;
	const pNum = +page;
	i = currLoc + pNum - 2;
	const paper = papers[i];
	if (!i) [closeBook, openBook][pNum]()
	else if (currLoc === maxLoc-pNum) [openBook, closeBook][pNum]();
	paper.classList.toggle('flipped');
	const listId = paper.querySelector('#f4')?.id || paper.querySelector('#b2')?.id;
	if (listId) {
		paper.querySelector(`#${listId} > .list`).style.boxShadow = 'none';
		if (listId === shadowList) setTimeout(() =>
			paper.querySelector(`#${listId} > .list`).style.boxShadow = (listId==='b2' ? '-' : '') + '5px 0 5px #00000055'
		, 250);
	};
	setTimeout(() => {
		paper.style.zIndex =
		paper.querySelector('.front').style.zIndex = getIndex();
	}, pNum*250);
	setTimeout(() => pageFlip = false, 250);
	editCurrLoc();
	console.timeEnd('all');
}

function rotateBook() {
	if (!/rotate/.test(book.style.transform)) {
		book.style.transform = `rotate(90deg) translateX(${currLoc===maxLoc ? 120 : 20}%)`;
		transformBtns(80);
		return;
	}
	book.style.transform = `translateX(${currLoc===1 ? 0 : currLoc===maxLoc ? 100 : 50}%)`;
	transformBtns(currLoc===1 || currLoc===maxLoc ? 0 : 180);
}