import { SimulationConfig } from "./SimulationConfig";
import { SimulationResults } from "./SimulationResult";
import * as fs from "fs";
const { createCanvas } = require("canvas");
// const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

export class SimulationResultsOutput {
  result: SimulationResults;
  simulationConfig: SimulationConfig;
  fileName: string;

  constructor(result: SimulationResults, simulationConfig: SimulationConfig) {
    this.result = result;
    this.simulationConfig = simulationConfig;
    this.fileName = `${this.simulationConfig
      .toString()
      .replace(/(, )|(: ) /gm, "_")
      .replace(": ", "_")}`;
  }

  private drawTrustTrajectoryChart(): void {
    if (
      this.result.avgHAgentsTrust.length !== this.result.avgSAgentsTrust.length
    ) {
      return; // Jeśli warunek nie jest spełniony, kończymy funkcję bez generowania wykresu
    }

    const width = 800;
    const height = 600;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "white",
    });

    const configuration: ChartConfiguration = {
      type: "line",
      data: {
        labels: Array.from(
          { length: this.result.avgHAgentsTrust.length },
          (_, i) => i
        ),
        datasets: [
          {
            label: "Honest Agents",
            data: this.result.avgHAgentsTrust,
            borderColor: "blue",
            fill: false,
          },
          {
            label: "Strategic Agents",
            data: this.result.avgSAgentsTrust,
            borderColor: "red",
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Iterations",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Trust trajectory",
            },
            suggestedMin: 0,
            suggestedMax: 1,
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.simulationConfig.toString(),
          },
          legend: {
            display: true,
            position: "bottom",
          },
        },
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          },
        },
      },
    };

    const buffer = chartJSNodeCanvas.renderToBufferSync(configuration);
    fs.writeFileSync(`./results/graphs/trust_trajectory_chart.png`, buffer);
  }

  private drawServiceInfluenceChart(): void {
    const width = 800;
    const height = 600;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: "white",
    });

    const configuration: ChartConfiguration = {
      type: "line",
      data: {
        labels: Array.from(
          {
            length:
              this.result.avgHonestServicesInfluenceOnStrategicAgentF.length,
          },
          (_, i) => i
        ),
        datasets: [
          {
            label: "Honest agents",
            data: this.result.avgHonestServicesInfluenceOnStrategicAgentF,
            borderColor: "blue",
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Iterations",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Honest agents service influence on strategic agents",
            },
            suggestedMin: -1,
            suggestedMax: 1,
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.simulationConfig.toString(),
          },
          legend: {
            display: true,
            position: "bottom",
          },
        },
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          },
        },
      },
    };

    const image = chartJSNodeCanvas.renderToBufferSync(configuration);
    fs.writeFileSync("./results/graphs/service_influence_chart.png", image);
  }

  saveChartsToFiles(): void {
    this.drawTrustTrajectoryChart();
    // this.saveCurrentChartToFile(`trust_${this.fileName}`);
    this.drawServiceInfluenceChart();
    // this.saveCurrentChartToFile(`influence_${this.fileName}`);
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
