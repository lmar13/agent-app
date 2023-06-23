import { AgentMode } from "../interfaces/AgentMode";
import { Agent } from "./Agent";
import { AgentConfig } from "./AgentConfig";
import { RAEAgentReportEntry } from "./RAEAgentReportEntry";
import { SimulationResults } from "./SimulationResult";
const skmeans = require("skmeans");

export class RAE {
  agents: Agent[] = [];
  iterations: number = 0;

  constructor(
    hAgentN: number,
    allAgentsNumber: number,
    agentConfig: AgentConfig,
    iterations: number
  ) {
    this.agents = RAE.createAgents(hAgentN, allAgentsNumber, agentConfig);
    this.iterations = iterations;
  }

  simulate(): SimulationResults {
    const result = new SimulationResults();
    for (let i = 0; i < this.iterations; i++) {
      console.log(i);
      this.iterationAction(result);
    }
    return result;
  }

  private iterationAction(result: SimulationResults): void {
    let reportEntries: RAEAgentReportEntry[] = [];
    for (let agent of this.agents) {
      reportEntries = reportEntries.concat(agent.doWork(this.agents).entries);
    }
    this.countNewReceptionTrustRBaseOnReports(reportEntries);
    this.assignNewTrustLevels();
    result.countStatistics(this.agents, reportEntries);
  }

  private countNewReceptionTrustRBaseOnReports(
    reportEntries: RAEAgentReportEntry[]
  ): void {
    for (let agent of this.agents) {
      const regardingEntries = reportEntries.filter(
        (entry) => entry.supplierN === agent.number
      );
      let sum = 0;
      regardingEntries.forEach(
        (entry) =>
          (sum +=
            (this.agents[entry.receiverN].trustLevelV || 0) *
            entry.receptionRate)
      );
      agent.newReceptionTrustR = sum / regardingEntries.length;
    }
  }

  private assignNewTrustLevels(): void {
    const clustersBoundary = this.getClustersBoundary();
    const lowSetTrustLevel = this.countLowSetTrustLevel(clustersBoundary);
    console.log(lowSetTrustLevel);
    for (let agent of this.agents) {
      if (agent.newReceptionTrustR < clustersBoundary) {
        agent.trustLevelV = lowSetTrustLevel;
      } else {
        agent.trustLevelV = 1;
      }
    }
  }

  private getClustersBoundary(): number {
    const receptionTrustR = [];
    for (let agent of this.agents) {
      receptionTrustR.push(agent.newReceptionTrustR);
    }

    const receptionTrustRArray = receptionTrustR.map((value) => [value]);
    const { centroids } = skmeans(receptionTrustRArray, 2);
    console.log(centroids);
    return (centroids[0][0] + centroids[1][0]) / 2;
  }

  private countLowSetTrustLevel(clustersBoundary: number): number {
    let highSum = 0;
    let highSize = 0;

    let lowSum = 0;
    let lowSize = 0;

    for (let agent of this.agents) {
      if (agent.newReceptionTrustR < clustersBoundary) {
        lowSum += agent.newReceptionTrustR || 0;
        lowSize++;
      } else {
        highSum += agent.newReceptionTrustR || 0;
        highSize++;
      }
    }

    console.log("lowSetSize: ", lowSize);
    console.log("lowSetSum: ", lowSum);
    console.log("highSetSize: ", highSize);
    console.log("highSetSum: ", highSum);

    if (lowSize === 0 || highSize === 0 || highSum / highSize) {
      return 0;
    }
    return lowSum / lowSize / (highSum / highSize);
  }

  static createAgents(
    hAgentN: number,
    allAgentsNumber: number,
    agentConfig: AgentConfig
  ): any[] {
    agentConfig.mode = AgentMode.HONEST;
    const honestAgents = Array.from({ length: hAgentN }).map(
      (val, i) => new Agent(i, agentConfig)
    );
    agentConfig.mode = AgentMode.STRATEGIC;
    const strategicAgents = Array.from({
      length: allAgentsNumber - hAgentN,
    }).map((val, i) => new Agent(i + hAgentN, agentConfig));
    return [...honestAgents, ...strategicAgents];
  }
}
