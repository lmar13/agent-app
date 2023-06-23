import { RAEAgentReportEntry } from "./RAEAgentReportEntry";

export class RAEAgentReport {
  private _entries: RAEAgentReportEntry[] = [];

  addEntry(entry: RAEAgentReportEntry) {
    this._entries.push(entry);
  }

  get entries(): RAEAgentReportEntry[] {
    return this._entries;
  }
}
