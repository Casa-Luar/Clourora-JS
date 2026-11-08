/** Languages Clourora translates public content into. Anything else falls back to Spanish on the server. */
export type Lang = 'es' | 'en' | 'fr';

export const LANGS: readonly Lang[] = ['es', 'en', 'fr'];

/** Statuses a published pet can have. Drafts and adopted pets are never public. */
export type AdoptionStatus = 'available' | 'reserved';

export type PetSex = 'male' | 'female';

export type PetSize = 'small' | 'medium' | 'large';

export interface AdoptionPhoto {
  /** Public HTTPS URL (WebP, already resized by Clourora) */
  url: string;
  width: number | null;
  height: number | null;
}

/** One pet a business published for adoption, as GET /publicapi/v1/adoption/pets returns it. */
export interface AdoptionPet {
  id: number;
  name: string;
  status: AdoptionStatus;
  /** Species in the requested language, e.g. "Perro" / "Dog" */
  species: string | null;
  /** Primary breed in the requested language */
  breed: string | null;
  sex: PetSex | null;
  /** Whole months since birth, null when the birthdate is unknown */
  age_months: number | null;
  /** "YYYY-MM" */
  birth_month: string | null;
  size: PetSize | null;
  color: string | null;
  sterilized: boolean;
  vaccinated: boolean;
  /** null = the business didn't say */
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  /** In the requested language, else the first language that has one */
  bio: string | null;
  traits: string[];
  /** Cover first */
  photos: AdoptionPhoto[];
  /** UTC, "YYYY-MM-DD HH:MM:SS" */
  published_at: string | null;
  updated_at: string | null;
}

export interface AdoptionList {
  location: { name: string | null };
  /** The language the texts came back in */
  lang: Lang;
  pets: AdoptionPet[];
}

export interface AdoptionListParams {
  lang?: Lang;
  /** Default: both available and reserved */
  status?: AdoptionStatus | AdoptionStatus[];
  /** Species title in any language ("perro", "dog") or its numeric id */
  species?: string | number;
  signal?: AbortSignal;
}

export interface AdoptionGetParams {
  lang?: Lang;
  signal?: AbortSignal;
}

/** Texts of one pet in one language (see adoptions.listInLanguages) */
export interface AdoptionPetTexts {
  bio: string | null;
  traits: string[];
  species: string | null;
  breed: string | null;
}

/** A pet with its translatable texts in several languages at once */
export interface LocalizedAdoptionPet extends AdoptionPet {
  texts: Partial<Record<Lang, AdoptionPetTexts>>;
}

/** Error codes the public API answers with */
export type ClouroraErrorCode =
  | 'invalid_key'
  | 'origin_not_allowed'
  | 'scope_not_allowed'
  | 'module_off'
  | 'not_found'
  | 'rate_limited'
  | 'network_error'
  | 'invalid_response'
  | 'http_error';
