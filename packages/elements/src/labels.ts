import type { Lang } from '@clourora/sdk';

export interface Labels {
  reserved: string;
  vaccinated: string;
  sterilized: string;
  kids: string;
  dogs: string;
  cats: string;
  male: string;
  female: string;
  small: string;
  medium: string;
  large: string;
  empty: string;
  error: string;
  loading: string;
  cta: string;
}

export const LABELS: Record<Lang, Labels> = {
  es: {
    reserved: 'Reservado',
    vaccinated: 'Vacunado',
    sterilized: 'Esterilizado',
    kids: 'Convive con niños',
    dogs: 'Convive con perros',
    cats: 'Convive con gatos',
    male: 'Macho',
    female: 'Hembra',
    small: 'Chico',
    medium: 'Mediano',
    large: 'Grande',
    empty: 'Por ahora no hay mascotas en adopción.',
    error: 'No se pudieron cargar las mascotas.',
    loading: 'Cargando…',
    cta: 'Me interesa'
  },
  en: {
    reserved: 'Reserved',
    vaccinated: 'Vaccinated',
    sterilized: 'Spayed/neutered',
    kids: 'Good with kids',
    dogs: 'Good with dogs',
    cats: 'Good with cats',
    male: 'Male',
    female: 'Female',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    empty: 'No pets up for adoption right now.',
    error: "The pets couldn't be loaded.",
    loading: 'Loading…',
    cta: "I'm interested"
  },
  fr: {
    reserved: 'Réservé',
    vaccinated: 'Vacciné',
    sterilized: 'Stérilisé',
    kids: 'Ok avec les enfants',
    dogs: 'Ok avec les chiens',
    cats: 'Ok avec les chats',
    male: 'Mâle',
    female: 'Femelle',
    small: 'Petit',
    medium: 'Moyen',
    large: 'Grand',
    empty: "Aucun animal à l'adoption pour le moment.",
    error: 'Impossible de charger les animaux.',
    loading: 'Chargement…',
    cta: 'Je suis intéressé'
  }
};
