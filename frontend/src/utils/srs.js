import { addDays } from "./dates";

export const RATINGS = {
  easy: "Легко",
  normal: "Норм",
  hard: "Сложно",
  again: "Не знал"
};

export function ratingLabel(value) {
  return RATINGS[value] || value;
}

export function calculateNextReview(card, rating) {
  const currentInterval = Number(card.interval_days || 1);
  const currentEase = Number(card.ease_factor || 2.5);
  let intervalDays = currentInterval;
  let easeFactor = currentEase;

  if (rating === "easy") {
    intervalDays = currentInterval * currentEase;
    easeFactor = currentEase + 0.15;
  }

  if (rating === "normal") {
    intervalDays = currentInterval * currentEase;
  }

  if (rating === "hard") {
    intervalDays = currentInterval;
    easeFactor = currentEase - 0.15;
  }

  if (rating === "again") {
    intervalDays = 1;
    easeFactor = currentEase - 0.25;
  }

  easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));
  intervalDays = Math.max(1, Math.round(intervalDays));

  return {
    interval_days: intervalDays,
    ease_factor: easeFactor,
    next_review_at: addDays(new Date(), intervalDays).toISOString()
  };
}
