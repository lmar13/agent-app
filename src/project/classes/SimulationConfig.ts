import { AgentMode } from "../interfaces/AgentMode";
import { AgentConfig } from "./AgentConfig";

export class SimulationConfig {
  startTrust: number = 1;
  x: number = 0.5;
  y: number = 0.5;
  z: number = 0.5;
  expoA: number = 1;
  expoG: number = 1;
  kMin: number = 1;
  kMax: number = 1;
  allAgentsNumber: number = 1000;
  iterations: number = 8;
  hAgentN: number = 0;
  sAgentN: number = 0;

  get sAgentNumber(): number {
    return this.sAgentN;
  }

  set sAgentNumber(value: number) {
    if (value >= this.allAgentsNumber) {
      return;
    }
    this.sAgentN = value;
    this.hAgentN = this.allAgentsNumber - this.sAgentN;
  }

  get agentConfig(): AgentConfig {
    return new AgentConfig(
      this.startTrust,
      AgentMode.HONEST,
      this.x,
      this.y,
      this.z,
      this.expoA,
      this.expoG,
      this.kMin,
      this.kMax
    );
  }

  toString(): string {
    return `PARAMS: N=${this.allAgentsNumber}, S=${this.sAgentN}, expoA=${this.expoA}, expoG=${this.expoG}, x=${this.x}, y=${this.y}, z=${this.z}, V_0=${this.startTrust}`;
  }
}
