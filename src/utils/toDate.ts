export function toDate(timestamp: number | Date) {
  if (typeof timestamp !== "number") return timestamp;

  const MAX_SECONDS = 4102444800;
  if (timestamp <= MAX_SECONDS) {
    return new Date(timestamp * 1000);
  }

  return new Date(timestamp);
}

export function toDiscordTimestamp(date: Date, format = "R") {
  const unixTimestamp = Math.floor(date.getTime() / 1000);
  return `<t:${unixTimestamp}:${format}>`;
}
