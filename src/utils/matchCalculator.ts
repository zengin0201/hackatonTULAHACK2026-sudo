import { Pet } from '../types/pet';

export const calculateMatch = (pet: Pet, userAnswers: any): number => {
  if (!userAnswers) return 80 + Math.floor(Math.random() * 15);

  let match = 100;

  if (pet.attributes?.requires_space && userAnswers.housing === 'apartment') {
    match -= 35;
  }

  if (pet.attributes?.cat_friendly === false && userAnswers.other_pets === 'yes') {
    match -= 45;
  }

  match -= Math.floor(Math.random() * 15);
  return Math.max(match, 15);
};