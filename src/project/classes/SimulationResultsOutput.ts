import { SimulationConfig } from "./SimulationConfig";
import { SimulationResults } from "./SimulationResult";
import * as fs from "fs";
const { createCanvas } = require("canvas");
// const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";
import { ChartData } from "../interfaces/ChartData";

export class SimulationResultsOutput {
  result: SimulationResults;
  simulationConfig: SimulationConfig;
  fileName: string;
  trustData = {
    sAgents: [],
    sHonest: [],
  } as any;

  influenceData = {
    data: [],
  };

  constructor(result: SimulationResults, simulationConfig: SimulationConfig) {
    this.result = result;
    this.simulationConfig = simulationConfig;
    this.fileName = `${this.simulationConfig
      .toString()
      .replace(/(, )|(: ) /gm, "_")
      .replace(": ", "_")}`;
  }

  private getTrajectoryIterationData(): Partial<ChartData> {
    if (
      this.result.avgHAgentsTrust.length !== this.result.avgSAgentsTrust.length
    ) {
      return {
        avgS: [],
        avgH: [],
      }; // Jeśli warunek nie jest spełniony, kończymy funkcję bez generowania wykresu
    }

    return {
      avgS: this.result.avgSAgentsTrust,
      avgH: this.result.avgHAgentsTrust,
    };
  }

  private getInfluenceIterationData(): Partial<ChartData> {
    return {
      avgI: this.result.avgHonestServicesInfluenceOnStrategicAgentF,
    };
  }

  getChartIterationData(): ChartData {
    const { avgS, avgH } = this.getTrajectoryIterationData();
    const { avgI } = this.getInfluenceIterationData();
    return {
      avgS: avgS || [],
      avgH: avgH || [],
      avgI: avgI || [],
    };
  }

  saveToCSVFile(): void {
    if (
      this.result.avgHAgentsTrust.length !==
        this.result.avgSAgentsTrust.length ||
      this.result.avgHAgentsTrust.length !==
        this.result.avgHonestServicesInfluenceOnStrategicAgentF.length
    ) {
      return;
    }

    const file = `${__dirname}/../../../results/csv/result_${this.fileName}.csv`;

    for (let i = 0; i < this.result.avgHAgentsTrust.length; i++) {
      fs.appendFileSync(
        file,
        `${i};${this.result.avgHAgentsTrust[i]};${this.result.avgSAgentsTrust[i]};${this.result.avgHonestServicesInfluenceOnStrategicAgentF[i]}\n`
      );
    }
  }
}
