import QRCode, {QRCodeRenderersOptions} from 'qrcode'
import passportsPromise from '@passports'
import sprite from './sprite.svg'
import {Passport, PassportStatusCode} from './types';

passportsPromise.then(({response}) => {
    passports = response;
    body.classList.remove('loading');
    idInput.max = passports.length.toString();
    if (currPassportId) {
        idInput.value = currPassportId.toString();
        toHtml(passports[currPassportId-1]);
    }
    console.log('Passports have been loaded');
});

let passports: readonly Passport[], currCountry: Country, colorChanging: number;
let currPassportId = +location.search.split('id=')[1] || null;
let currLoc = 1;

const {protocol, host, pathname} = location;
const BASE_URL = protocol + "//" + host + pathname;
const getPassportUrl = (id: string | number | null): string =>
    BASE_URL + (id ? '?id=' + id : '');

const $ = <T = HTMLElement>(id: string) => document.getElementById(id) as T;
const transformBtns = (num: string | number) => {
    prevBtn.style.transform = `translateX(-${num}px)`;
    nextBtn.style.transform = `translateX(${num}px)`;
};

const bookTranslateX = (value: string) => {
    book.style.transform = `translateX(${value})`;
};

type SpreadElement = HTMLDivElement & {
    isCover: boolean,
    isFirst: boolean
}

// DOM-elements
const body = document.body as HTMLBodyElement;
const spreads = Array.from(body.querySelectorAll<SpreadElement>('.spread'));
const rotateBtn = $<HTMLButtonElement>('rotate-btn');
const prevBtn = $<HTMLButtonElement>('prev');
const nextBtn = $<HTMLButtonElement>('next');
const idBtn = $<HTMLButtonElement>('id-btn');
const idForm = $<HTMLFormElement>('id-form');
const idInput = $<HTMLInputElement>('id-input');
const book = $<HTMLDivElement>('book');
const pageF4 = $<HTMLDivElement>('marriages');

const proxyDOM = <T extends Record<string, any>>(rootId: string, prefix: string, getObj: (arg: Record<string, any>) => T) => new Proxy(
    getObj(new Proxy($(rootId), {
        get: (target, name: string) => target.querySelector(prefix + name)
    })), {
        set(target, name, value: string) {
            target[name as keyof T].textContent = value;
            return true;
        }
    }
);

const stampStatuses = {
    '-1': ['null', 'Аннулировано'] as const,
    '0' : ['no', ''] as const,
    '1' : ['normal', `<svg class='osis'><use href='${sprite}#osis'></use></svg>`] as const
} satisfies Record<PassportStatusCode, readonly [HTMLElement['className'], HTMLElement['innerHTML']]>;

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
    stamp: Object.assign(u.stamp, {
        _statuses: stampStatuses,
        setStatus(code: PassportStatusCode) {
            const [className, innerHTML] = this._statuses[code] || this._statuses[0];
            Object.assign(this, {className, innerHTML});
        }
    }),
}));

const frontCover = proxyDOM('country_and_herb', '#', cah => ({
    countryName: cah['country-name'],
    herb: cah.herb,
}));

type RGB = [number, number, number];
type ReadonlyRGB = Readonly<RGB>;

type Country = {
    readonly code: string,
    readonly name: string,
    readonly color: ReadonlyRGB,
    readonly standardImage: string
};

const countries = ([
    ['gsld', [51, 34, 102], 'Республика Гусляндия', 'goose.svg'],
    ['ngld', [85, 187, 51], 'Республика Неогусляндия', 'goose.svg'],
    ['duck', [238, 136, 68], 'Утиное Государство', 'duck.png']
] as const).map(([code, color, name, stdImg]) => ({
    code, name, color,
    standardImage: './standard-image/' + stdImg
}));

const rgbToHex = (rgb: ReadonlyRGB): string =>
    rgb.reduce((acc, c) => acc + (c > 15 ? '' : '0') + c.toString(16), '#');

const qr = {
    updateUrl(url: string) {
        this._url = url;
        return this._render();
    },
    updateColor(color: string) {
        this._options.color.dark = color;
        return this._render();
    },
    _render() {
        return QRCode.toCanvas(this._canvas, this._url, this._options);
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
    } satisfies QRCodeRenderersOptions,
    _canvas: $<HTMLCanvasElement>('qr-canvas')
};
qr._render();

// Set page positions & cover color
for (let i = 0; i < spreads.length; i++)
    spreads[i].style.zIndex = (spreads.length - i).toString();

const [lastSpread/*, preLastSpread*/] = spreads.reverse();
const [firstSpread, secondSpread] = spreads.reverse();
firstSpread.isCover = firstSpread.isFirst =
    lastSpread.isCover = secondSpread.isFirst = true;

const maxLoc = spreads.length + 1;

function updatePassport() {
    const id = +idInput.value;
    if (
        id > 0 &&
        id !== currPassportId
    ) {
        currPassportId = id;
        const passportUrl = getPassportUrl(id);
        history.pushState({id}, '', passportUrl);
        qr.updateUrl(passportUrl);
        toHtml(passports[id-1]);
    }
}

onpopstate = ({state}: {state: {id?: number}}) => {
    const id = state.id;
    if (id) {
        idInput.value = id.toString();
        currPassportId = id;
        toHtml(passports[id-1]);
    } else {
        location.reload();
    }
};

mainPage.photo.onerror = function (this: HTMLImageElement) {
    this.src = currCountry.standardImage;
};
function toHtml(data: Passport) {
    const [name, surname, sex, countryId, nationality, id, dob, doi, photoUrl, passportStatus, marriages] = data;
    const country = countries[countryId];
    book.dataset.code = country.code;
    if (currCountry !== country) {
        book.className = '';
        frontCover.countryName = country.name;
        updateColor(country.color);
        currCountry = country;

        mainPage.country = country.name;
    }
    mainPage.photo.src = photoUrl || country.standardImage;
    Object.assign(mainPage, {name, id, surname, dob, sex, nationality, doi});
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

let currColor = getComputedStyle(body).getPropertyValue('--p_color')
    .match(/\d+/g)!.map(Number) as RGB;
function updateColor(target: ReadonlyRGB, duration = 1000, frames = 60) {
    clearInterval(colorChanging);

    const delta: RGB = [0, 0, 0];
    for (let i = 0; i < 3; i++)
        delta[i] = (currColor[i]-target[i])/frames;

    const targetHEX = rgbToHex(target);

    colorChanging = window.setInterval(() => {
        for (let i = 0; i < 3; i++) currColor[i] -= delta[i];
        const currHEX = rgbToHex(currColor.map((num) => Math.round(num)) as RGB);
        if (currHEX === targetHEX) clearInterval(colorChanging);
        qr.updateColor(currHEX);
        body.style.setProperty('--p_color', currHEX);
    }, duration/frames);
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

type IndexGetter = () => number;
type BookHandlers = readonly [() => void, () => void];
type PageControllerParams = {
    readonly getIndex: IndexGetter,
    readonly bookHandlers: BookHandlers
}
type PageController = {
    readonly next: () => void,
    readonly prev: () => void,
    _isFlipping: boolean,
    readonly _nextParams: PageControllerParams,
    readonly _prevParams: PageControllerParams,
    readonly _flip: (isNext: boolean, obj: {
        getIndex: IndexGetter
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
                spread.querySelector<HTMLDivElement>('.front')!.style.zIndex =
                    getIndex().toString();
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
idBtn.addEventListener('click', updatePassport);
const keyEvents = {
    ArrowRight() {pageController.next()},
    ArrowLeft() {pageController.prev()}
};
document.addEventListener('keydown', ({key}) => {
    if (getSelection()!.anchorNode === idForm) return;
    if (+key) {
        idInput.select();
    } else {
        keyEvents[key as keyof typeof keyEvents]?.();
    }
});
idInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') updatePassport();
});
idInput.addEventListener('input', function() {
    this.value = +this.value > +this.max
        ? this.max
        : this.value.replace(/^[-0]+/g, '');
});