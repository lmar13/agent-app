import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";
import { writeFileSync } from "fs";
import { SimulationConfig } from "./SimulationConfig";
import { ChartData } from "../interfaces/ChartData";

export class Charts {
  simulationConfig: SimulationConfig;
  //   chartData: ChartData = {} as ChartData;
  allChartData:  any = {
    avgS: [],
    avgH: [],
    avgI: [],
  };

  constructor(simulationConfig: SimulationConfig) {
    this.simulationConfig = simulationConfig;
  }

  gatherData(data: ChartData): void {
    this.allChartData.avgS.push(data.avgS);
    this.allChartData.avgH.push(data.avgH);
    this.allChartData.avgI.push(data.avgI);
  }

  drawCharts(): void {
    const data = this.countAvg();
    console.log("data", data);
    this.drawTrajectoryGraph(data);
    this.drawInfluenceGraph(data);
  }

  private drawTrajectoryGraph(data: ChartData) {
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
        labels: Array.from({ length: data.avgH.length }, (_, i) => i),
        datasets: [
          {
            label: "Honest Agents",
            data: data.avgH,
            borderColor: "blue",
            fill: false,
          },
          {
            label: "Strategic Agents",
            data: data.avgS,
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
    writeFileSync(`./results/graphs/trust_trajectory_chart.png`, buffer);
  }

  private drawInfluenceGraph(data: ChartData) {
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
            length: data.avgI.length,
          },
          (_, i) => i
        ),
        datasets: [
          {
            label: "Honest agents",
            data: data.avgI,
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

    const buffer = chartJSNodeCanvas.renderToBufferSync(configuration);
    writeFileSync("./results/graphs/service_influence_chart.png", buffer);
  }

  private countAvg = (): ChartData => {
    const avgS: number[] = this.allChartData.avgS
      .reduce((acc: number[], row: number[]) => {
        row.forEach((value, col) => {
          acc[col] = (acc[col] || 0) + value;
        });
        return acc;
      }, [])
      .map((v: number) => v / this.allChartData.avgS.length);

    const avgH: number[] = this.allChartData.avgH
      .reduce((acc: number[], row: number[]) => {
        row.forEach((value, col) => {
          acc[col] = (acc[col] || 0) + value;
        });
        return acc;
      }, [])
      .map((v: number) => v / this.allChartData.avgH.length);

    const avgI: number[] = this.allChartData.avgI
      .reduce((acc: number[], row: number[]) => {
        row.forEach((value, col) => {
          acc[col] = (acc[col] || 0) + value;
        });
        return acc;
      }, [])
      .map((v: number) => v / this.allChartData.avgI.length);

    return {
      avgS,
      avgH,
      avgI,
    };
  };
}
