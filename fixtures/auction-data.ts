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

// Start must be Mon-Thu, end must be Tue-Fri and within the same week as start
// (app disables other weekdays client-side). Mirrors the Mon->Wed pattern seen
// in real production data. Deterministic (always "next Monday") rather than
// randomized: the CRUD suite deletes the auction it creates before finishing
// (see 04-delete-auction.spec.ts), so the slot is free again for the next run.
export function nextValidAuctionDates(): { start: string; end: string } {
  const start = nextMonday(new Date());
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(15, 0, 0, 0);

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
