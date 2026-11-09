export function formatVietnameseDate(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return "Chưa đặt";
  }

  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length !== 3) {
    return dateStr;
  }

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
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
