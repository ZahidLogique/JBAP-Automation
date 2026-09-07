export interface AuctionFormData {
  location?: string;
  no?: string;
  start?: string;
  end?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDateTime(d: Date): string {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nextMonday(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function nextValidAuctionDates(): { start: string; end: string } {
  const start = new Date();
  const day = start.getDay();
  if (day < 1 || day > 4) {
    while (start.getDay() !== 1) start.setDate(start.getDate() + 1);
  }
  const now = new Date();
  start.setHours(now.getHours() - 1, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(now.getHours() + 3, 0, 0, 0);

  return { start: formatDateTime(start), end: formatDateTime(end) };
}

// The server rejects an Auction No longer than 3 digits (existing production data
// is sequential in the low 200s), so pick from the 700-999 range to keep collisions
// with real data unlikely while staying test-run-to-test-run unique enough.
export function generateAuctionNo(): string {
  return (700 + (Date.now() % 300)).toString();
}

export function generateAuctionData(location: string = "JBAP"): AuctionFormData {
  const { start, end } = nextValidAuctionDates();
  return {
    location,
    no: generateAuctionNo(),
    start,
    end,
  };
}

function parseFormatted(s: string): Date {
  const [datePart, timePart] = s.split(" ");
  const [mm, dd, yyyy] = datePart.split("/").map(Number);
  const [hh, min] = timePart.split(":").map(Number);
  return new Date(yyyy, mm - 1, dd, hh, min);
}

// The server rejects changing the Start date on edit ("the auction start date
// not same with existing") — only End is actually editable. Keeps End on the
// same day (start+2, Wed) as the original and only shifts the time, since
// changing the day (e.g. to Thu) triggers an unrelated-looking server error
// ("the auction end date is less than today") despite the date being valid.
export function nextValidEditEnd(currentStart: string): string {
  const start = parseFormatted(currentStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(16, 30, 0, 0);
  return formatDateTime(end);
}
