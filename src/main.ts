import { SmoothColorUpdater } from "./color-updater";
import { countries } from "./countries";
import { parseRGB, setNodesContent } from "./lib";
import { createMarriageCard } from "./marriage-card";
import { QR } from "./qr";
import type { Passport, PassportStatusCode, Country } from "./types";
import passportsPromise from "@passports";

passportsPromise.then(({ response }) => {
  passports = response;
  body.classList.remove("loading");
  idInput.max = passports.length.toString();
  if (currPassportId) {
    idInput.value = currPassportId.toString();
    toHtml(passports[currPassportId - 1]);
  }
  console.log("Passports have been loaded");
});

let passports: readonly Passport[], currCountry: Country;
let currLoc = 1;
const urlParams = new URLSearchParams(location.search);
let currPassportId = ((id) => (id ? +id : id))(
  urlParams.get("id") as `${number}` | null,
);
const initialPage = urlParams.get("page");
const initialRotated = urlParams.get("rotated") === "";

const { protocol, host, pathname } = location;
const BASE_URL = protocol + "//" + host + pathname;
const getPassportUrl = (id: string | number | null): string =>
  BASE_URL + (id ? "?id=" + id : "");

const $ = <T = HTMLElement>(id: string) => document.getElementById(id) as T;
const transformBtns = (num: string | number) => {
  prevBtn.style.transform = `translateX(-${num}px)`;
  nextBtn.style.transform = `translateX(${num}px)`;
};

const bookTranslateX = (value: string) => {
  book.style.transform = `translateX(${value})`;
};

type SpreadElement = HTMLDivElement & {
  isCover: boolean;
  isFirst: boolean;
};

// DOM-elements
const body = document.body as HTMLBodyElement;
const spreads = Array.from(body.querySelectorAll<SpreadElement>(".spread"));
const rotateBtn = $<HTMLButtonElement>("rotate-btn");
const prevBtn = $<HTMLButtonElement>("prev");
const nextBtn = $<HTMLButtonElement>("next");
const idBtn = $<HTMLButtonElement>("id-btn");
const idForm = $<HTMLFormElement>("id-form");
const idInput = $<HTMLInputElement>("id-input");
const book = $<HTMLDivElement>("book");
const marriageList = $<HTMLDivElement>("marriages");
const qrContainer = $<HTMLDivElement>("qr");

const stampStatuses = {
  "-1": ["null", document.createTextNode("Аннулировано")],
  "0": ["no", document.createTextNode("")],
  "1": ["normal", $("osis").cloneNode(true)],
} satisfies Record<
  PassportStatusCode,
  readonly [HTMLElement["className"], Node]
>;

const idPage = {
  name: $("u_name"),
  flagCont: $("u_flag-container"),
  flag: $("u_flag"),
  country: $("u_country"),
  photo: {
    element: $<HTMLImageElement>("u_photo"),
    set textContent(value: string) {
      this.element.src = value;
    },
  },
  id: $("u_id"),
  surname: $("u_surname"),
  dob: $("u_DoB"),
  doi: $("u_DoI"),
  sex: $("u_sex"),
  nationality: $("u_nationality"),
  stamp: {
    element: $("u_stamp"),
    _value: Infinity as PassportStatusCode,
    set textContent(value: PassportStatusCode) {
      if (this._value !== value) {
        const [className, contentNode] =
          stampStatuses[value] || stampStatuses[0];
        this.element.className = className;
        this.element.replaceChildren(contentNode);
        this._value = value;
      }
    },
  },
};

const setBodyVar = (name: string, value: string) => {
  body.style.setProperty("--" + name, value);
};

const frontCover = {
  country: $("country-name"),
};

const qr = new QR($("qr-canvas"), getPassportUrl(currPassportId));

// Set page positions & cover color
for (let i = 0; i < spreads.length; i++)
  spreads[i].style.zIndex = (spreads.length - i).toString();

const [firstSpread, secondSpread] = spreads;
const [lastSpread /*, preLastSpread*/] = spreads.toReversed();
firstSpread.isCover =
  lastSpread.isCover =
  firstSpread.isFirst =
  secondSpread.isFirst =
    true;

const maxLoc = spreads.length + 1;

const updatePassport = () => {
  const id = +idInput.value;
  if (id > 0 && id !== currPassportId) {
    currPassportId = id;
    const passportUrl = getPassportUrl(id);
    history.pushState({ id }, "", passportUrl);
    qr.setUrl(passportUrl);
    toHtml(passports[id - 1]);
  }
};

window.addEventListener("popstate", ({ state }: { state: { id?: number } }) => {
  const id = state.id;
  if (id) {
    idInput.value = id.toString();
    currPassportId = id;
    toHtml(passports[id - 1]);
  } else {
    location.reload();
  }
});
idPage.photo.element.addEventListener("error", function () {
  this.src = currCountry.standardImage;
});

const toHtml = ([
  name,
  surname,
  sex,
  countryId,
  nationality,
  id,
  dob,
  doi,
  photoUrl,
  passportStatus,
  marriages,
]: Passport) => {
  const country = countries[countryId];
  book.dataset.code = country.code;
  if (currCountry !== country) {
    book.className = "";
    frontCover.country.textContent = idPage.country.textContent = country.name;
    colorUpdater.set(country.color);
    currCountry = country;
  }
  setNodesContent(idPage, {
    name,
    surname,
    dob,
    sex,
    nationality,
    doi,
    id: id.toString(),
    stamp: passportStatus,
    photo: photoUrl || country.standardImage,
  });

  marriageList.replaceChildren(
    ...(marriages ? marriages.map(createMarriageCard) : []),
  );
};

const colorUpdater = new SmoothColorUpdater(
  parseRGB(getComputedStyle(body).getPropertyValue("--p_color")),
  (colorHEX) => {
    setBodyVar("p_color", colorHEX);
    qr.setColor(colorHEX);
  },
);

const openBook = () => {
  bookTranslateX("50%");
  transformBtns(180);
  prevBtn.style.visibility = nextBtn.style.visibility = "visible";
  prevBtn.style.opacity = nextBtn.style.opacity = "100";
};

const closeBook = () => {
  let btn: HTMLButtonElement;
  if (currLoc === 2) {
    bookTranslateX("0");
    btn = prevBtn;
  } else {
    bookTranslateX("100%");
    btn = nextBtn;
  }
  btn.style.opacity = "0";
  setTimeout(() => {
    if (btn.style.opacity === "0") btn.style.visibility = "hidden";
  }, 250);
  transformBtns(0);
};

type IndexGetter = () => number;
type BookHandlers = readonly [() => void, () => void];
type PageControllerParams = {
  readonly getIndex: IndexGetter;
  readonly bookHandlers: BookHandlers;
};
type PageController = {
  readonly next: () => void;
  readonly prev: () => void;
  readonly goTo: (loc: number) => void;
  _isFlipping: boolean;
  readonly _nextParams: PageControllerParams;
  readonly _prevParams: PageControllerParams;
  readonly _flip: (
    isNext: boolean,
    obj: {
      getIndex: IndexGetter;
      bookHandlers: BookHandlers;
    },
  ) => boolean;
};

let spreadI: number;
const FLIP_TIME = 250;

const getLocByPage = (page: number): number =>
  page < 1 ? 1 : page > 6 ? maxLoc : Math.floor(page / 2) + 2;

const pageController: PageController = {
  next() {
    if (currLoc === maxLoc) return;
    if (this._flip(true, this._nextParams)) ++currLoc;
  },
  prev() {
    if (currLoc === 1) return;
    if (this._flip(false, this._prevParams)) --currLoc;
  },
  goTo(loc) {
    if (loc === currLoc) return;
    const isNext = loc > currLoc;
    const params = isNext ? this._nextParams : this._prevParams;
    const mod = isNext ? 1 : -1;
    const interval = setInterval(() => {
      if (this._flip(isNext, params)) {
        currLoc += mod;
        if (currLoc === loc) clearInterval(interval);
      }
    }, FLIP_TIME);
  },
  _isFlipping: false,
  _nextParams: {
    getIndex: () => currLoc - spreads.length,
    bookHandlers: [openBook, closeBook],
  },
  _prevParams: {
    getIndex: () => spreads.length - spreadI,
    bookHandlers: [closeBook, openBook],
  },
  _flip(isNext: boolean, { bookHandlers, getIndex }) {
    if (this._isFlipping) return false;
    this._isFlipping = true;

    const nextMod = +isNext;
    spreadI = currLoc + nextMod - 2;
    const spread = spreads[spreadI];
    const { isCover, isFirst } = spread;
    spread.classList.toggle("flipped");
    if (isCover) bookHandlers[isFirst ? 0 : 1]();
    setTimeout(() => {
      spread.style.zIndex = spread.querySelector<HTMLDivElement>(
        ".front",
      )!.style.zIndex = getIndex().toString();
    }, nextMod * 250);
    setTimeout(() => {
      this._isFlipping = false;
    }, FLIP_TIME);
    return true;
  },
};
if (initialPage) pageController.goTo(getLocByPage(+initialPage));

const rotateBook = () => {
  const isMaxLoc = currLoc === maxLoc;
  const isMinLoc = currLoc === 1;
  const isRotated = ~book.style.transform.indexOf("rotate");
  if (isRotated) {
    bookTranslateX((isMinLoc ? 0 : isMaxLoc ? 100 : 50) + "%");
    transformBtns(isMinLoc || isMaxLoc ? 0 : 180);
    return;
  }
  book.style.transform = `rotate(90deg) translateX(${isMaxLoc ? 120 : 20}%)`;
  transformBtns(80);
};
if (initialRotated)
  setTimeout(() => {
    rotateBook();
  }, 250);

// Listeners
book.addEventListener("click", (e) => {
  const el = e.target as HTMLElement;
  if (el.closest(".front")) pageController.next();
  else pageController.prev();
});
qrContainer.addEventListener("click", (e) => {
  navigator.clipboard.writeText(location.href);
  e.preventDefault();
  e.stopPropagation();
});
prevBtn.addEventListener("click", () => {
  pageController.prev();
});
nextBtn.addEventListener("click", () => {
  pageController.next();
});
rotateBtn.addEventListener("click", rotateBook);
idBtn.addEventListener("click", updatePassport);
document.addEventListener("keydown", ({ key }) => {
  if (getSelection()!.anchorNode === idForm) return;
  if (+key) {
    idInput.select();
  } else {
    switch (key) {
      case "ArrowRight":
        pageController.next();
        break;
      case "ArrowLeft":
        pageController.prev();
    }
  }
});
idInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") updatePassport();
});
idInput.addEventListener("input", function () {
  this.value =
    +this.value > passports.length
      ? this.max
      : this.value.replace(/^[-0]+/g, "");
});
