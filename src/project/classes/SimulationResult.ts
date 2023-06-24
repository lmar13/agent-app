import { AgentMode } from "../interfaces/AgentMode";
import { Agent } from "./Agent";
import { RAEAgentReportEntry } from "./RAEAgentReportEntry";

export class SimulationResults {
  avgSAgentsTrust: number[] = [];
  avgHAgentsTrust: number[] = [];
  avgHonestServicesInfluenceOnStrategicAgentF: number[] = [];

  countStatistics(agents: Agent[], reportEntries: RAEAgentReportEntry[]): void {
    let hAgentsTrustSum = 0;
    let hAgentsNum = 0;
    let sAgentsTrustSum = 0;
    let sAgentsNum = 0;

    for (let agent of agents) {
      if (agent.config.mode === AgentMode.HONEST) {
        hAgentsTrustSum += agent.trustLevelV;
        hAgentsNum++;
      } else if (agent.config.mode === AgentMode.STRATEGIC) {
        sAgentsTrustSum += agent.trustLevelV;
        sAgentsNum++;
      }
    }

    const avgF = this.countAvgF(agents, reportEntries);
    this.addIterationValues(
      sAgentsTrustSum / sAgentsNum || 0,
      hAgentsTrustSum / hAgentsNum || 0,
      avgF
    );
  }

  private countAvgF(
    agents: Agent[],
    reportEntries: RAEAgentReportEntry[]
  ): number {
    let serviceAnswerWhenHonestProvideToStrategicSum = 0;
    let serviceAnswerWhenStrategicProviderToHonestSum = 0;

    let numberOfHonestProvideToStrategic = 0;
    let numberOfStrategicProvideToHonest = 0;

    for (let entry of reportEntries) {
      if (
        agents[entry.supplierN].config.mode === AgentMode.HONEST &&
        agents[entry.receiverN].config.mode === AgentMode.STRATEGIC
      ) {
        serviceAnswerWhenHonestProvideToStrategicSum += entry.serviceAnswerP;
        numberOfHonestProvideToStrategic++;
      } else if (
        agents[entry.supplierN].config.mode === AgentMode.STRATEGIC &&
        agents[entry.receiverN].config.mode === AgentMode.HONEST
      ) {
        serviceAnswerWhenStrategicProviderToHonestSum += entry.serviceAnswerP;
        numberOfStrategicProvideToHonest++;
      }
    }

    const honestSum =
      serviceAnswerWhenHonestProvideToStrategicSum /
        numberOfHonestProvideToStrategic || 0;
    const strategicSum =
      serviceAnswerWhenStrategicProviderToHonestSum /
        numberOfStrategicProvideToHonest || 0;
    return honestSum - strategicSum;
  }

  private addIterationValues(
    avgSAgentsTrust: number,
    avgHAgentsTrust: number,
    avgF: number
  ): void {
    this.avgSAgentsTrust.push(avgSAgentsTrust);
    this.avgHAgentsTrust.push(avgHAgentsTrust);
    this.avgHonestServicesInfluenceOnStrategicAgentF.push(avgF);
  }
}
