import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(value: string) {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function keywordScore(text: string, keywords: string[]) {
  const haystack = text.toLowerCase();
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}
