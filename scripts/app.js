const { KMeans } = require("density-clustering");

class AgentConfig {
    constructor(good_will_r_z, mode, service_quality_q, service_cost_c, trust_level_V, min_service_time, max_service_time, min_response_time, max_response_time) {
      this.good_will_r_z = good_will_r_z;
      this.mode = mode;
      this.service_quality_q = service_quality_q;
      this.service_cost_c = service_cost_c;
      this.trust_level_V = trust_level_V;
      this.min_service_time = min_service_time;
      this.max_service_time = max_service_time;
      this.min_response_time = min_response_time;
      this.max_response_time = max_response_time;
    }
  }
  
  class RAEAgentReportEntry {
    constructor(suplier_number, receiver_number, reception_rate, service_answer_P) {
      this.suplier_number = suplier_number;
      this.receiver_number = receiver_number;
      this.reception_rate = reception_rate;
      this.service_answer_P = service_answer_P;
    }
  }
  
  class RAEAgentReport {
    constructor() {
      this.entries = [];
    }
  
    add_entry(entry) {
      this.entries.push(entry);
    }
  }
  
  const AgentMode = {
    HONEST: 'HONEST',
    STRATEGIC: 'STRATEGIC'
  };
  
  class Agent {
    constructor(number, config) {
      this.number = number;
      this.config = config;
      this.trust_level_V = config.trust_level_V;
    }
  
    do_service(receiver) {
      const service_time = Math.random() * (this.config.max_service_time - this.config.min_service_time) + this.config.min_service_time;
      const response_time = Math.random() * (receiver.config.max_response_time - receiver.config.min_response_time) + receiver.config.min_response_time;
      const total_time = service_time + response_time;
      const service_quality_q = this.config.service_quality_q;
      const service_cost_c = this.config.service_cost_c;
      const trust_level_V = this.trust_level_V;
  
      const service_answer_P = (service_quality_q * trust_level_V) / (service_cost_c * total_time);
      return service_answer_P;
    }
  
    _count_service_reception_rate_honest(service_answer_P) {
      const service_cost_c = this.config.service_cost_c;
      const total_time = this.config.min_service_time + this.config.min_response_time;
      const honest_service_answer_P = (this.config.service_quality_q) / (service_cost_c * total_time);
      const reception_rate = service_answer_P / honest_service_answer_P;
      return reception_rate;
    }
  
    _reception_rate_p(service_answer_P) {
      if (this.config.mode === AgentMode.HONEST) {
        return this._count_service_reception_rate_honest(service_answer_P);
      }
      if (this.config.mode === AgentMode.STRATEGIC) {
        return this._count_service_reception_rate_honest(service_answer_P) * this.config.good_will_r_z;
      }
      throw new Error('Invalid agent mode');
    }
  
    update_trust_level(new_reception_trust_R) {
      const diff = new_reception_trust_R - this.trust_level_V;
      this.trust_level_V += diff;
    }
  }
  
  function generateAgents(agentConfigs) {
    const agents = [];
    for (let i = 0; i < agentConfigs.length; i++) {
      const agent = new Agent(i, agentConfigs[i]);
      agents.push(agent);
    }
    return agents;
  }
  
  function generateAgentReports(agents, iterations) {
    const reports = [];
    for (let i = 0; i < iterations; i++) {
      const report = new RAEAgentReport();
      for (let j = 0; j < agents.length; j++) {
        const suplier = agents[j];
        for (let k = 0; k < agents.length; k++) {
          const receiver = agents[k];
          const service_answer_P = suplier.do_service(receiver);
          const reception_rate = suplier._reception_rate_p(service_answer_P);
          const entry = new RAEAgentReportEntry(j, k, reception_rate, service_answer_P);
          report.add_entry(entry);
        }
      }
      reports.push(report);
    }
    return reports;
  }
  
  function calculateTrustLevels(agents, reports) {
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      for (let j = 0; j < report.entries.length; j++) {
        const entry = report.entries[j];
        const suplier = agents[entry.suplier_number];
        const receiver = agents[entry.receiver_number];
        const new_reception_trust_R = (suplier.config.trust_level_V + receiver.config.trust_level_V) / 2;
        suplier.update_trust_level(new_reception_trust_R);
      }
    }
  }
  
  const agentConfigs = [
    new AgentConfig(0.5, AgentMode.HONEST, 0.8, 1.2, 0.5, 1, 3, 0.5, 1),
    new AgentConfig(0.8, AgentMode.STRATEGIC, 1.5, 0.7, 0.8, 2, 4, 0.5, 1),
    new AgentConfig(0.7, AgentMode.HONEST, 1.2, 0.9, 0.7, 1, 3, 0.5, 1),
  ];
  
  const agents = generateAgents(agentConfigs);
  const reports = generateAgentReports(agents, 10);
  calculateTrustLevels(agents, reports);
  
  for (let i = 0; i < agents.length; i++) {
    console.log(`Agent ${i}: Trust Level = ${agents[i].trust_level_V}`);
  }
  