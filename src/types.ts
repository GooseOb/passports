type Marriage = readonly [date: string, name: string, divorceDate?: string | 0];

export type PassportStatusCode = -1 | 0 | 1;
export type Passport = readonly [
  name: string,
  surname: string,
  sex: string,
  countryId: number,
  nationality: string,
  id: number,
  dob: string,
  doi: string,
  photoUrl: string,
  passportStatus: PassportStatusCode,
  marriages: Marriage[] | "",
];

export type PassportResponse = { response: Passport[] };

export type RGB = [number, number, number];
export type ReadonlyRGB = Readonly<RGB>;

export type Country = {
  readonly code: string;
  readonly name: string;
  readonly color: ReadonlyRGB;
  readonly standardImage: string;
};
