import QRCode, {QRCodeRenderersOptions} from 'qrcode'
import passportsPromise from '@getPassports'
import sprite from './sprite.svg'

passportsPromise.then(({response}: Response) => {
    passports = response;
    body.classList.remove('loading');
    idInput.max = String(passports.length);
    if (currPassportId) {
        idInput.value = String(currPassportId);
        toHtml(passports[currPassportId-1]);
    }
    console.log('Passports have been loaded');
});

type Marriage = [
    date: string,
    name: string,
    divorceDate?: string
];

type Passport = [
    name: string,
    surname: string,
    sex: string,
    countryId: number,
    nationality: string,
    id: string,
    dob: string,
    doi: string,
    photoUrl: string,
    passportStatus: PassportStatusCode,
    marriages: Marriage[]
];

type Response = {response: Passport[]};

let passports: Passport[], currCountry: Country, colorChanging: number;
let currPassportId = +location.search.split('id=')[1] || null;
let currLoc = 1;

const {protocol, host, pathname} = location;
const BASE_URL = protocol + "//" + host + pathname;
const getPassportUrl = (id: string | number | null): string =>
    BASE_URL + (id ? '?id=' + id : '');

const {assign} = Object;

const $ = <T = HTMLElement>(id: string) => document.getElementById(id) as T;
const transformBtns = (num: string | number) => {
    prevBtn.style.transform = `translateX(-${num}px)`;
    nextBtn.style.transform = `translateX(${num}px)`;
};

const bookTranslateX = (value: string) => {
    book.style.transform = `translateX(${value})`;
}

interface SpreadElement extends HTMLDivElement {
    isCover: boolean,
    isFirst: boolean
}

// DOM-elements
const body = document.body as HTMLBodyElement;
const spreads = Array.from(body.querySelectorAll('.spread')) as SpreadElement[];
const rotateBtn = $<HTMLButtonElement>('rotate-btn');
const prevBtn = $<HTMLButtonElement>('prev');
const nextBtn = $<HTMLButtonElement>('next');
const idBtn = $<HTMLButtonElement>('id-btn');
const idForm = $<HTMLFormElement>('id-form');
const idInput = $<HTMLInputElement>('id-input');
const book = $<HTMLDivElement>('book');
const pageF4 = $<HTMLDivElement>('marriages');

const proxyDOM = (rootId: string, prefix: string, getObj: (arg: any)=>any) => new Proxy(
    getObj(new Proxy($(rootId), {
        get: (target, name: string) => target.querySelector(prefix + name)
    })),
    {set: (target, name, value) => target[name].textContent = value}
);

type PassportStatusCode = '-1' | '0' | '1';
type StampStatuses = Record<PassportStatusCode, [className: string, innerHTML: string]>;
const stampStatuses: StampStatuses = {
    '-1': ['null', 'Аннулировано'],
    '0' : ['no', ''],
    '1' : ['normal', `<svg class='osis'><use href='${sprite}#osis'></use></svg>`]
};

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
        _statuses: stampStatuses,
        setStatus(code: PassportStatusCode) {
            const [className, innerHTML] = this._statuses[code] || this._statuses[0];
            assign(this, {className, innerHTML});
        }
    }),
}));

const frontCover = proxyDOM('country_and_herb', '#', cah => ({
    countryName: cah['country-name'],
    herb: cah.herb,
}));

type RGB = [number, number, number];

interface Country {
    code: string,
    name: string,
    color: RGB,
    standardImage: string
}

const countries: Country[] = [
    ['gsld', '326', 'Республика Гусляндия', 'goose.svg'],
    ['ngld', '5b3', 'Республика Неогусляндия', 'goose.svg'],
    ['duck', 'e84', 'Утиное Государство', 'duck.png']
].map(([code, colorHEX, name, stdImg]) => ({
    code, name,
    color: colorHEX.match(/./g)!.map(n => parseInt(n+n, 16)) as RGB,
    standardImage:  './standard-image/' + stdImg
}));

const rgbToHex = (rgb: RGB): string =>
    '#' + rgb.map(c => (c > 15 ? '' : '0') + c.toString(16)).join('');

const qr = {
    setUrl(url: string) {
        this._url = url;
    },
    render() {
        QRCode.toCanvas(this._canvas, this._url, this._options);
    },
    changeColor(color: string) {
        this._options.color!.dark = color;
        this.render();
    },
    _url: getPassportUrl(currPassportId),
    _options: {
        color: {
            dark: '#888',
            light: '#0000'
        },
        width: 256,
        margin: 0,
        errorCorrectionLevel: 'L'
    } as QRCodeRenderersOptions,
    _canvas: $<HTMLCanvasElement>('qr-canvas')
}
qr.render();

// Set page positions & cover color
for (let i = 0; i < spreads.length; i++)
    spreads[i].style.zIndex = String(spreads.length - i);

const [lastSpread/*, preLastSpread*/] = spreads.reverse();
const [firstSpread, secondSpread] = spreads.reverse();
firstSpread.isCover = firstSpread.isFirst =
    lastSpread.isCover = secondSpread.isFirst = true;

const maxLoc = spreads.length + 1;

function getPassport() {
    const id = +idInput.value;
    if (
        id > 0 &&
        id !== currPassportId
    ) {
        currPassportId = id;
        const passportUrl = getPassportUrl(id);
        history.pushState({id}, null!, passportUrl);
        qr.setUrl(passportUrl);
        qr.render();
        toHtml(passports[id-1]);
    }
}

onpopstate = ({state}) => {
    const id = state?.id || false;
    if (id) {
        idInput.value = currPassportId = id;
        toHtml(passports[id-1]);
    } else location.reload();
};

mainPage.photo.onerror = (e: Event) => {
    const el = e.target as HTMLImageElement;
    el.src = currCountry.standardImage;
}
function toHtml(data: Passport) {
    const [name, surname, sex, countryId, nationality, id, dob, doi, photoUrl, passportStatus, marriages] = data;
    const country = countries[countryId];
    book.dataset.code = country.code;
    if (currCountry !== country) {
        book.className = '';
        frontCover.countryName = country.name;
        changeColor(
            getComputedStyle(body).getPropertyValue('--p_color'),
            country.color
        );
        currCountry = country;

        mainPage.country = country.name;
    }
    mainPage.photo.src = photoUrl || country.standardImage;
    assign(mainPage, {name, id, surname, dob, sex, nationality, doi});
    mainPage.stamp.setStatus(passportStatus);
    pageF4.innerHTML = '';
    if (!marriages) return;
    for (let i = 0; i < marriages.length; i++) {
        const [date, name, divorceDate = false] = marriages[i];
        const divorce = divorceDate
            ? `<div class='divorce'> Расторгнут ${divorceDate} </div>`
            : '';
        pageF4.innerHTML += `
		<div class='card'>
			<div class='data'>
				<span>${name}</span>
				<span class='date'>${date}</span>
			</div>
			${divorce}
		</div>`;
    }
}

function changeColor(currRGB: string, final: RGB, animDuration = 1000, animFrames = 60) {
    clearInterval(colorChanging);

    const curr = currRGB.match(/\d+/g)!.map(Number) as RGB;
    const arr = Array(3) as RGB;
    for (let i = 0; i < 3; i++)
        arr[i] = (curr[i]-final[i])/animFrames;

    const finalRGB = `rgb(${final})`;

    colorChanging = window.setInterval(() => {
        for (let i = 0; i < 3; i++) curr[i] -= arr[i];
        const currArrRGB = curr.map((num: number) => Math.round(num)) as RGB;
        qr.changeColor(rgbToHex(currArrRGB));
        currRGB = `rgb(${currArrRGB})`;
        body.style.setProperty('--p_color', currRGB);
        if (currRGB === finalRGB) clearInterval(colorChanging);
    }, animDuration/animFrames);
}

function openBook() {
    bookTranslateX('50%');
    transformBtns(180);
    prevBtn.style.visibility = nextBtn.style.visibility = 'visible';
    prevBtn.style.opacity = nextBtn.style.opacity = '100';
}

function closeBook() {
    let btn: HTMLButtonElement;
    if (currLoc === 2) {
        bookTranslateX('0');
        btn = prevBtn;
    } else {
        bookTranslateX('100%');
        btn = nextBtn;
    }
    btn.style.opacity = '0';
    setTimeout(() => {
        if (btn.style.opacity === '0') btn.style.visibility = 'hidden';
    }, 250);
    transformBtns(0);
}

type GetIndex = () => number;
type BookHandlers = [typeof openBook, typeof closeBook] | [typeof closeBook, typeof openBook];
interface PageControllerParams {
    getIndex: GetIndex,
    bookHandlers: BookHandlers
}
interface PageController {
    next: () => void,
    prev: () => void,
    _isFlipping: boolean,
    _nextParams: PageControllerParams,
    _prevParams: PageControllerParams,
    _flip: (isNext: boolean, obj: {
        getIndex: GetIndex
        bookHandlers: BookHandlers
    }) => boolean
}

let spreadI: number;

const pageController: PageController = {
    next() {
        if (currLoc === maxLoc) return;
        if (this._flip(true, this._nextParams))
            ++currLoc;
    },
    prev() {
        if (currLoc === 1) return;
        if (this._flip(false, this._prevParams))
            --currLoc;
    },
    _isFlipping: false,
    _nextParams: {
        getIndex: () => currLoc - spreads.length,
        bookHandlers: [openBook, closeBook],
    },
    _prevParams: {
        getIndex: () => spreads.length - spreadI,
        bookHandlers: [closeBook, openBook]
    },
    _flip(isNext: boolean, {bookHandlers, getIndex}) {
        if (this._isFlipping) return false;
        this._isFlipping = true;

        const nextMod = +isNext;
        spreadI = currLoc + nextMod - 2;
        const spread = spreads[spreadI];
        const {isCover, isFirst} = spread;
        spread.classList.toggle('flipped');
        if (isCover) bookHandlers[isFirst ? 0 : 1]();
        setTimeout(() => {
            spread.style.zIndex =
                (spread.querySelector('.front') as HTMLDivElement).style.zIndex =
                    String(getIndex());
        }, nextMod*250);
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
    }
    book.style.transform = `rotate(90deg) translateX(${isMaxLoc ? 120 : 20}%)`;
    transformBtns(80);
}

// Listeners
book.addEventListener('click', e => {
    const el = e.target as HTMLElement;
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
    if (getSelection()!.anchorNode === idForm) return;
    if (+key) idInput.select();
    else keyEvents[(key as keyof typeof keyEvents)]?.();
});
idInput.addEventListener('keydown', e => e.key === 'Enter' && getPassport());
idInput.addEventListener('input', e => {
    const el = e.target as typeof idInput;
    el.value = +el.value > +el.max
        ? el.max
        : el.value.replace(/^[-0]+/g, '');
});

export {};