const { Enum } = require("enum");

class RAEAgentReportEntry {
  constructor(
    supplier_number,
    receiver_number,
    reception_rate,
    service_answer_P
  ) {
    this.supplier_number = supplier_number;
    this.receiver_number = receiver_number;
    this.reception_rate = reception_rate;
    this.service_answer_P = service_answer_P;
  }
}

class RAEAgentReport {
  constructor() {
    this.entries = [];
  }

  addEntry(entry) {
    this._entries.push(entry);
  }

  get entries() {
    return this._entries;
  }
}

const AgentMode = new Enum(["HONEST", "STRATEGIC"], {
  ignoreCase: true,
  freeze: true,
});

AgentMode.HONEST = 0;
AgentMode.STRATEGIC = 1;

class AgentConfig {
  constructor(start_trust, mode, x, y, z, expoA, expoG, kmin, kmax) {
    this.start_trust_level_V = start_trust.level;
    this.mode = mode;
    this.good_will_honest_x = x;
    this.good_will_p_y = y;
    this.good_will_r_z = z;
    this.expoA = expoA;
    this.expoG = expoG;
    this.min_suppliers_number_kmin = kmin;
    this.max_suppliers_number_kmax = kmax;
  }
}

class Agent {
    constructor(number, config) {
}
