import type { FoodLog } from "@/types/food-log";

const pad = (value: number) => String(value).padStart(2, "0");

export const formatDateInput = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

export const isValidDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const getVisitedOn = (log: FoodLog) => {
  if (log.visitedOn && isValidDateInput(log.visitedOn)) {
    return log.visitedOn;
  }

  return formatDateInput(new Date(log.createdAt));
};

export const formatDisplayDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const getMonthDays = (year: number, monthIndex: number) => {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<{ key: string; day?: number }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ key: `empty-start-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${day}`, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}` });
  }

  return cells;
};
