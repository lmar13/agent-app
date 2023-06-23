import fs from "fs";
const skmeans = require("skmeans");
import { plot, Plot } from "nodeplotlib";

interface RAEAgentReportEntry {
  supplier_number: number;
  receiver_number: number;
  reception_rate: number;
  service_answer_P: number;
}

class RAEAgentReport {
  _entries: RAEAgentReportEntry[];
  constructor() {
    this._entries = [];
  }

  addEntry(entry: RAEAgentReportEntry): void {
    this._entries.push(entry);
  }

  get entries(): RAEAgentReportEntry[] {
    return this._entries;
  }
}

enum AgentMode {
  HONEST,
  STRATEGIC,
}

class AgentConfig {
  start_trust_level_V: number;
  mode: AgentMode;
  good_will_honest_x: number;
  good_will_p_y: number;
  good_will_r_z: number;
  expoA: number;
  expoG: number;
  min_suppliers_number_kmin: number;
  max_suppliers_number_kmax: number;

  constructor(
    start_trust: number,
    mode: AgentMode,
    x: number,
    y: number,
    z: number,
    expoA: number,
    expoG: number,
    kmin: number,
    kmax: number
  ) {
    this.start_trust_level_V = start_trust;
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
  number: number;
  config: AgentConfig;
  trust_level_V: number;
  new_reception_trust_R: number;

  constructor(number: number, config: AgentConfig) {
    this.number = number;
    this.config = { ...config };
    this.trust_level_V = config.start_trust_level_V;
    this.new_reception_trust_R = 0;
  }

  _randomize_A(): number {
    return Math.pow(Math.random(), 1 / this.config.expoA);
  }

  _count_honest_p(receiver: Agent): number {
    if (receiver.trust_level_V >= 1 - this.config.good_will_honest_x) {
      return this._randomize_A();
    }
    return 0;
  }

  _count_strategic_p(receiver: Agent): number {
    return Math.min(this.config.good_will_p_y, this._count_honest_p(receiver));
  }

  do_service(receiver: Agent): number {
    if (this.config.mode === AgentMode.HONEST) {
      return this._count_honest_p(receiver);
    }
    if (
      this.config.mode === AgentMode.STRATEGIC &&
      receiver.config.mode === AgentMode.STRATEGIC
    ) {
      return this._count_honest_p(receiver);
    }
    if (this.config.mode === AgentMode.STRATEGIC) {
      return this._count_strategic_p(receiver);
    }
    throw new Error("Invalid mode - do_service");
  }

  _randomize_G(): number {
    return Math.pow(Math.random(), 1 / this.config.expoG);
  }

  _count_service_reception_rate_honest(service_answer_P: number): number {
    if (this.trust_level_V >= 1 - this.config.good_will_honest_x) {
      return this._randomize_G() * service_answer_P;
    }
    return 0;
  }

  _count_service_reception_rate_strategic(service_answer_P: number): number {
    return Math.min(
      this.config.good_will_r_z,
      this._count_service_reception_rate_honest(service_answer_P)
    );
  }

  _count_service_reception_rate_R(
    agent: Agent,
    service_answer_P: number
  ): number {
    if (this.config.mode === AgentMode.HONEST) {
      return this._count_service_reception_rate_honest(service_answer_P);
    }
    if (
      this.config.mode === AgentMode.STRATEGIC &&
      agent.config.mode === AgentMode.STRATEGIC
    ) {
      return this._count_service_reception_rate_honest(service_answer_P);
    }
    if (this.config.mode === AgentMode.STRATEGIC) {
      return this._count_service_reception_rate_strategic(service_answer_P);
    }
    throw new Error("Invalid mode");
  }

  do_work(agents_list: Agent[]): RAEAgentReport {
    const chosen_agents = agents_list
      .filter((agent) => agent.number !== this.number)
      .slice(
        0,
        Math.floor(
          Math.random() *
            (this.config.max_suppliers_number_kmax -
              this.config.min_suppliers_number_kmin +
              1)
        ) + this.config.min_suppliers_number_kmin
      );

    const report = new RAEAgentReport();
    chosen_agents.forEach((agent) => {
      const service_answer_P = agent.do_service(this);
      const service_reception_rate = this._count_service_reception_rate_R(
        agent,
        service_answer_P
      );
      report.addEntry({
        supplier_number: agent.number,
        receiver_number: this.number,
        service_answer_P,
        reception_rate: service_reception_rate,
      });
    });

    // console.log(this.new_reception_trust_R);
    // this.trust_level_V += this.new_reception_trust_R;
    // console.log("do_work", this.trust_level_V);
    // this.new_reception_trust_R = 0;

    return report;
  }
}

class SimulationResults {
  avg_strategic_agents_trust: number[] = [];
  avg_honest_agents_trust: number[] = [];
  avg_honest_services_influence_on_strategic_agents_F: number[] = [];

  constructor() {
    this.avg_strategic_agents_trust = [];
    this.avg_honest_agents_trust = [];
    this.avg_honest_services_influence_on_strategic_agents_F = [];
  }

  count_statistics(
    agents_list: Agent[],
    reports_entries: RAEAgentReportEntry[]
  ) {
    let honest_agents_trust_sum = 0;
    let honest_agents_number = 0;
    let strategic_agents_trust_sum = 0;
    let strategic_agents_number = 0;

    for (let agent of agents_list) {
      if (agent.config.mode === AgentMode.HONEST) {
        honest_agents_trust_sum += agent.trust_level_V;
        honest_agents_number++;
      } else if (agent.config.mode === AgentMode.STRATEGIC) {
        strategic_agents_trust_sum += agent.trust_level_V;
        strategic_agents_number++;
      } else {
        throw new Error("Invalid mode - count_statistics");
      }
    }

    const avg_F = this._count_avg_F(agents_list, reports_entries);
    this._add_iteration_values(
      strategic_agents_trust_sum / strategic_agents_number,
      honest_agents_trust_sum / honest_agents_number,
      avg_F
    );
  }

  _count_avg_F(agents_list: Agent[], reports_entries: RAEAgentReportEntry[]) {
    let service_answer_when_honest_provide_to_strategic_sum = 0;
    let service_answer_when_strategic_provider_to_honest_sum = 0;
    let number_of_honest_provide_to_strategic = 0;
    let number_of_strategic_provide_to_honest = 0;

    for (let report_entry of reports_entries) {
      if (
        agents_list[report_entry.supplier_number].config.mode ===
          AgentMode.HONEST &&
        agents_list[report_entry.receiver_number].config.mode ===
          AgentMode.STRATEGIC
      ) {
        service_answer_when_honest_provide_to_strategic_sum +=
          report_entry.service_answer_P;
        number_of_honest_provide_to_strategic++;
      } else if (
        agents_list[report_entry.supplier_number].config.mode ===
          AgentMode.STRATEGIC &&
        agents_list[report_entry.receiver_number].config.mode ===
          AgentMode.HONEST
      ) {
        service_answer_when_strategic_provider_to_honest_sum +=
          report_entry.service_answer_P;
        number_of_strategic_provide_to_honest++;
      }
    }

    return (
      service_answer_when_honest_provide_to_strategic_sum /
        number_of_honest_provide_to_strategic -
      service_answer_when_strategic_provider_to_honest_sum /
        number_of_strategic_provide_to_honest
    );
  }

  _add_iteration_values(
    avg_strategic_agents_trust: number,
    avg_honest_agents_trust: number,
    avg_F: number
  ) {
    this.avg_strategic_agents_trust.push(avg_strategic_agents_trust);
    this.avg_honest_agents_trust.push(avg_honest_agents_trust);
    this.avg_honest_services_influence_on_strategic_agents_F.push(avg_F);
  }
}

class RAE {
  agents: Agent[];
  iterations_number: number;

  constructor(
    honest_agents_number: number,
    all_agents_number: number,
    agent_config: AgentConfig,
    iterations_number: number
  ) {
    this.agents = RAE._create_agents(
      honest_agents_number,
      all_agents_number,
      agent_config
    );
    this.iterations_number = iterations_number;
  }

  do_simulation(): SimulationResults {
    const simulation_result: SimulationResults = new SimulationResults();
    for (
      let iteration_number = 0;
      iteration_number < this.iterations_number;
      iteration_number++
    ) {
      console.log(iteration_number);
      this._iteration_action(simulation_result);
    }
    return simulation_result;
  }

  _iteration_action(simulation_result: SimulationResults): void {
    let reports_entries: RAEAgentReportEntry[] = [];
    for (let agent of this.agents) {
      reports_entries = reports_entries.concat(
        agent.do_work(this.agents).entries
      );
    }
    this._count_new_reception_trust_R_base_on_reports(reports_entries);
    this._assigne_new_trust_levels();
    simulation_result.count_statistics(this.agents, reports_entries);
  }

  _count_new_reception_trust_R_base_on_reports(
    reports_entries: RAEAgentReportEntry[]
  ): void {
    for (let agent of this.agents) {
      let regarding_entries = reports_entries.filter(
        (entry) => entry.supplier_number == agent.number
      );
      let sum = 0;
      for (let entry of regarding_entries) {
        sum +=
          this.agents[entry.receiver_number].trust_level_V *
          entry.reception_rate;
      }

      agent.new_reception_trust_R = sum / regarding_entries.length;
    }
  }

  _assigne_new_trust_levels(): void {
    const clusters_boundary = this._get_clusters_boundary();
    const low_set_trust_level =
      this._count_low_set_trust_level(clusters_boundary);
    console.log("low_set_trust_level", low_set_trust_level);
    for (let agent of this.agents) {
      if (agent.new_reception_trust_R < clusters_boundary) {
        agent.trust_level_V = low_set_trust_level;
      } else {
        agent.trust_level_V = 1;
      }
    }
  }

  _get_clusters_boundary(): number {
    const receptionTrustR = this.agents.map(
      (agent) => agent.new_reception_trust_R
    );
    const receptionTrustRArray = receptionTrustR.map((value) => [value]);
    const { centroids } = skmeans(receptionTrustRArray, 2);
    console.log(centroids);

    return (centroids[0][0] + centroids[1][0]) / 2;
  }

  _count_low_set_trust_level(clusters_boundary: number): number {
    let high_set_sum = 0;
    let high_set_size = 0;

    let low_set_sum = 0;
    let low_set_size = 0;

    for (let agent of this.agents) {
      if (agent.new_reception_trust_R < clusters_boundary) {
        low_set_sum += agent.new_reception_trust_R;
        low_set_size += 1;
      } else {
        high_set_sum += agent.new_reception_trust_R || 1;
        high_set_size += 1;
      }
    }

    console.log(`low_set_size = ${low_set_size}`);
    console.log(`low_set_sum = ${low_set_sum}`);
    console.log(`high_set_size = ${high_set_size}`);
    console.log(`high_set_sum = ${high_set_sum}`);

    return low_set_size === 0
      ? 0
      : low_set_sum / low_set_size / (high_set_sum / high_set_size);
  }

  static _create_agents(
    honest_agents_number: number,
    all_agents_number: number,
    agent_config: AgentConfig
  ): Agent[] {
    agent_config.mode = AgentMode.HONEST;
    const honest_agents: Agent[] = [];
    for (let i = 0; i < honest_agents_number; i++) {
      honest_agents.push(new Agent(i, agent_config));
    }

    agent_config.mode = AgentMode.STRATEGIC;
    const strategic_agents: Agent[] = [];
    for (let i = 0; i < all_agents_number - honest_agents_number; i++) {
      strategic_agents.push(new Agent(i + honest_agents_number, agent_config));
    }

    return [...honest_agents, ...strategic_agents];
  }
}

class SimulationConfig {
  start_trust: number = 1;
  x: number = 0.5;
  y: number = 0.5;
  z: number = 0.5;
  expoA: number = 1;
  expoG: number = 1;
  kmin: number = 50;
  kmax: number = 150;
  all_agents_number: number = 200;
  strategic_agents_number: number = 50;
  honest_agents_number: number =
    this.all_agents_number - this.strategic_agents_number;
  iterations_number: number = 15;

  get agent_config(): AgentConfig {
    return new AgentConfig(
      this.start_trust,
      AgentMode.HONEST,
      this.x,
      this.y,
      this.z,
      this.expoA,
      this.expoG,
      this.kmin,
      this.kmax
    );
  }

  toString(): string {
    return `PARAMS: N = ${this.all_agents_number}, S = ${this.strategic_agents_number}, expoA = ${this.expoA}, expoG = ${this.expoG}, x = ${this.x}, y = ${this.y}, z = ${this.z}, V_0 = ${this.start_trust}`;
  }
}

class SimulationResultsOutput {
  result: SimulationResults;
  simulation_config: SimulationConfig;

  constructor(result: SimulationResults, simulation_config: SimulationConfig) {
    this.result = result;
    this.simulation_config = simulation_config;
  }

  _draw_trust_trajectory_chart(): void {
    if (
      this.result.avg_honest_agents_trust.length !==
      this.result.avg_strategic_agents_trust.length
    ) {
      throw new Error(
        "Lengths of honest agents trust and strategic agents trust arrays are different."
      );
    }

    console.log("draw_trust_trajectory_chart");

    const x_series = Array.from(
      { length: this.result.avg_honest_agents_trust.length },
      (_, index) => index
    );

    const chartData: Plot[] = [
      {
        x: x_series,
        y: this.result.avg_honest_agents_trust,
        type: "scatter",
        mode: "lines",
        name: "honest agents",
        line: { color: "blue" },
      },
      {
        x: x_series,
        y: this.result.avg_strategic_agents_trust,
        type: "scatter",
        mode: "lines",
        name: "strategic agents",
        line: { color: "red" },
      },
    ];

    const layout = {
      title: {
        text: this.simulation_config.toString(),
      },
      xaxis: {
        title: {
          text: "Iterations",
        },
      },
      yaxis: {
        title: {
          text: "Trust trajectory",
        },
        range: [0, 1],
      },
    };

    // plot(chartData, layout);

    // chart.canvas.toBuffer((buffer: Buffer) => {
    //   fs.writeFileSync("./results/trust_chart.png", buffer);
    // });
  }

  _draw_service_influence_chart(): void {
    console.log("draw_influence_chart");
    const x_series = Array.from(
      {
        length:
          this.result.avg_honest_services_influence_on_strategic_agents_F
            .length,
      },
      (_, index) => index
    );

    const chartData: Plot[] = [
      {
        x: x_series,
        y: this.result.avg_honest_services_influence_on_strategic_agents_F,
        type: "scatter",
        mode: "lines",
        name: "honest agents",
        line: { color: "green" },
      },
    ];

    const layout = {
      title: {
        text: this.simulation_config.toString(),
      },
      xaxis: {
        title: {
          text: "Iterations",
        },
      },
      yaxis: {
        title: {
          text: "Honest agents service influence on strategic agents",
        },
        range: [-1, 1],
      },
    };

    // plot(chartData, layout);

    // chart.canvas.toBuffer((buffer: Buffer) => {
    //   fs.writeFileSync("./results/influence-chart.png", buffer);
    // });
  }

  saveChartToFiles() {
    this._draw_trust_trajectory_chart();
    this._draw_service_influence_chart();
  }

  saveResultToCsv(): void {
    if (
      this.result.avg_honest_agents_trust.length ===
        this.result.avg_strategic_agents_trust.length &&
      this.result.avg_honest_agents_trust.length ===
        this.result.avg_honest_services_influence_on_strategic_agents_F.length
    ) {
      let csvData =
        "iteration;avg_honest_agents_trust;avg_strategic_agents_trust;avg_honest_services_influence_on_strategic_agents_F\r\n";

      for (let i = 0; i < this.result.avg_honest_agents_trust.length; i++) {
        csvData += `${i};${this.result.avg_honest_agents_trust[i]};${this.result.avg_strategic_agents_trust[i]};${this.result.avg_honest_services_influence_on_strategic_agents_F[i]}\r\n`;
      }

      fs.writeFileSync(
        `./results/result_${this.simulation_config
          .toString()
          .replace(/, /g, "_")
          .replace(/: /g, "_")}.csv`,
        csvData
      );
    } else {
      throw new Error("Lengths do not match.");
    }
  }
}

function makeSimulation(simulation_config: SimulationConfig): void {
  const rae = new RAE(
    simulation_config.honest_agents_number,
    simulation_config.all_agents_number,
    simulation_config.agent_config,
    simulation_config.iterations_number
  );

  console.log("start simulation");
  const result = rae.do_simulation();
  console.log("stop simulation");
  const result_output = new SimulationResultsOutput(result, simulation_config);

  //   result_output.saveChartToFiles();
  //   result_output.saveResultToCsv();
}

function main() {
  const simulation_config = new SimulationConfig();
  for (let x = 1; x <= 5; x++) {
    for (let y = 1; y <= 5; y++) {
      for (let z = 1; z <= 5; z++) {
        simulation_config.x = 0.2 * x;
        simulation_config.y = 0.2 * y;
        simulation_config.z = 0.2 * z;
        console.log(simulation_config.toString());
        makeSimulation(simulation_config);
      }
    }
  }
}

main();
