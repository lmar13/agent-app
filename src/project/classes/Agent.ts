import { AgentMode } from "../interfaces/AgentMode";
import { AgentConfig } from "./AgentConfig";
import { RAEAgentReport } from "./RAEAgentReport";
import { RAEAgentReportEntry } from "./RAEAgentReportEntry";

export class Agent {
  number: number;
  config: AgentConfig;
  trustLevelV: number;
  newReceptionTrustR: number = 0;

  constructor(number: number, config: AgentConfig) {
    this.number = number;
    this.config = { ...config };
    this.trustLevelV = config.startTrustLevelV;
  }

  private randomizeAPartA(): number {
    return Math.pow(Math.random(), 1 / this.config.expoA);
  }

  private countHonestP(receiver: Agent): number {
    if (receiver.trustLevelV >= 1 - this.config.goodWillHonesX) {
      return this.randomizeAPartA();
    }
    return 0;
  }

  private countStrategicP(receiver: Agent): number {
    return Math.min(this.config.goodWillPY, this.countHonestP(receiver));
  }

  private service(receiver: Agent): number {
    if (this.config.mode === AgentMode.HONEST) {
      return this.countHonestP(receiver);
    }
    if (
      this.config.mode === AgentMode.STRATEGIC &&
      receiver.config.mode === AgentMode.STRATEGIC
    ) {
      return this.countHonestP(receiver);
    }
    if (this.config.mode === AgentMode.STRATEGIC) {
      this.countStrategicP(receiver);
    }
    return 0;
  }

  private randomizeGPartA(): number {
    return Math.pow(Math.random(), 1 / this.config.expoG);
  }

  private countServiceReceptionRateStrategic(serviceAnswerP: number): number {
    return Math.min(
      this.config.goodWillRZ,
      this.countServiceReceptionRateHonest(serviceAnswerP)
    );
  }

  private countServiceReceptionRateHonest(serviceAnswerP: number): number {
    if (this.trustLevelV >= 1 - this.config.goodWillHonesX) {
      return this.randomizeGPartA() * serviceAnswerP;
    }
    return 0;
  }

  private countServiceReceptionRateR(
    agent: Agent,
    serviceAnswerP: number
  ): number {
    if (this.config.mode === AgentMode.HONEST) {
      return this.countServiceReceptionRateHonest(serviceAnswerP);
    }
    if (
      this.config.mode === AgentMode.STRATEGIC &&
      agent.config.mode === AgentMode.STRATEGIC
    ) {
      return this.countServiceReceptionRateHonest(serviceAnswerP);
    }
    if (this.config.mode === AgentMode.STRATEGIC) {
      return this.countServiceReceptionRateStrategic(serviceAnswerP);
    }
    return 0;
  }

  doWork(agents: Agent[]): RAEAgentReport {
    const chosenAgents = this.getRandomAgents(
      agents,
      this.config.minSuppliersNumberKMin,
      this.config.maxSuppliersNumberKMax
    );

    const report = new RAEAgentReport();

    for (let agent of chosenAgents) {
      const serviceAnswerP = agent.service(agent);
      const serviceReceptionRate = this.countServiceReceptionRateR(
        agent,
        serviceAnswerP
      );
      report.addEntry(
        new RAEAgentReportEntry(
          agent.number,
          this.number,
          serviceReceptionRate,
          serviceAnswerP
        )
      );
    }

    return report;
  }

  private getRandomAgents(agents: Agent[], min: number, max: number) {
    return agents
      .filter((x) => x.number !== this.number)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * (max - min + 1)) + min);
  }
}
