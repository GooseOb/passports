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
const transformBtns = (num: string) => {
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
const minLoc = 1;

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

// CLOSED_FRONT = "0";
// OPEN = "50%";
// CLOSED_BACK = "100%";

const FLIP_TIME = 250;
const afterFlip = (cb: () => void) => setTimeout(cb, FLIP_TIME);

const openBook = () => {
  bookTranslateX("50%");
  transformBtns("180");
  prevBtn.style.visibility = nextBtn.style.visibility = "visible";
  prevBtn.style.opacity = nextBtn.style.opacity = "100";
};

const closeBook = (isFront: boolean) => {
  const [btnToHide, x] = isFront ? [prevBtn, "0"] : [nextBtn, "100%"];
  bookTranslateX(x);
  btnToHide.style.opacity = "0";
  afterFlip(() => {
    if (btnToHide.style.opacity === "0") {
      btnToHide.style.visibility = "hidden";
    }
  });
  transformBtns("0");
};

const rotateBook = () => {
  const isMaxLoc = currLoc === maxLoc;
  const isMinLoc = currLoc === minLoc;
  const isRotated = book.style.transform.includes("rotate");
  if (isRotated) {
    bookTranslateX(isMinLoc ? "0" : isMaxLoc ? "100%" : "50%");
    transformBtns(isMinLoc || isMaxLoc ? "0" : "180");
  } else {
    book.style.transform = `rotate(90deg) translateX(${isMaxLoc ? "120" : "20"}%)`;
    transformBtns("80");
  }
};
if (initialRotated) afterFlip(rotateBook);

const getLocByPage = (page: number): number =>
  page < 1 ? 1 : page > 6 ? maxLoc : Math.floor(page / 2) + 2;

const pageController = {
  next() {
    if (this._isFlipping || currLoc === maxLoc) return;
    this._isFlipping = true;
    const setSpreadZIndex = this._getSpreadZIndexSetter(currLoc - 1);
    const oldLoc = currLoc;
    ++currLoc;
    if (oldLoc === minLoc) {
      openBook();
    } else if (currLoc === maxLoc) {
      closeBook(false);
    }
    afterFlip(() => {
      setSpreadZIndex(currLoc - spreads.length);
      this._isFlipping = false;
    });
  },
  prev() {
    if (this._isFlipping || currLoc === minLoc) return;
    this._isFlipping = true;
    this._getSpreadZIndexSetter(currLoc - 2)(spreads.length - currLoc + 2);
    const oldLoc = currLoc;
    --currLoc;
    if (oldLoc === maxLoc) {
      openBook();
    } else if (currLoc === minLoc) {
      closeBook(true);
    }
    afterFlip(() => {
      this._isFlipping = false;
    });
  },
  goTo(loc: number) {
    if (loc === currLoc) return;
    const go = (loc > currLoc ? this.next : this.prev).bind(this);
    const interval = setInterval(() => {
      go();
      if (loc === currLoc) {
        clearInterval(interval);
      }
    }, FLIP_TIME);
  },
  _isFlipping: false,
  _getSpreadZIndexSetter(spreadI: number) {
    const spread = spreads[spreadI];
    spread.classList.toggle("flipped");
    return (value: number) => {
      spread.style.zIndex = spread.querySelector<HTMLDivElement>(
        ".front",
      )!.style.zIndex = value.toString();
    };
  },
};
if (initialPage) pageController.goTo(getLocByPage(+initialPage));

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
