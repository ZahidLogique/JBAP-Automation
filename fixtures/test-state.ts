import fs from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), ".test-state.json");

interface TestState {
  createdVcn?: string;
  createdVid?: number;
  [key: string]: any;
}

export function saveState(data: Partial<TestState>) {
  const existing = loadState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
}

export function loadState(): TestState {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

export function clearState() {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}
