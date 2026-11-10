const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return "No date";
  }

  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length !== 3) {
    return dateStr;
  }

  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return dateStr;
  }

  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    return `${SHORT_MONTHS[monthIdx]} ${day}`;
  }

  return `${SHORT_MONTHS[monthIdx]} ${day}, ${year}`;
}

export function formatVietnameseDate(dateStr: string | null | undefined): string {
  return formatShortDate(dateStr);
}

export function isDateOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) {
    return false;
  }

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return dateStr.slice(0, 10) < todayStr;
}
