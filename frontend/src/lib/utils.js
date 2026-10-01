import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function currency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function monthLabel(month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year);
  if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12 || !Number.isInteger(numericYear) || numericYear < 1 || numericYear > 9999) return 'Unknown month';
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(numericYear, numericMonth - 1, 1));
}

export function shortDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date) : 'Date unavailable';
}

export function parseDate(value) {
  if (value == null || value === '') return null;
  const normalized = typeof value === 'string' ? value.trim().replace(' ', 'T') : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function transactionDate(value, options) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('en-IN', options).format(date) : 'Date unavailable';
}
