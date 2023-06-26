import { SimulationConfig } from "./classes/SimulationConfig";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { RAE } from "./classes/RAE";
import { SimulationResultsOutput } from "./classes/SimulationResultsOutput";
import { Chart } from "chart.js";
import { Charts } from "./classes/Charts";
import { ChartData } from "./interfaces/ChartData";

const rl = readline.createInterface({ input, output });

export async function main() {
  const simulationConfig = new SimulationConfig();

  const answer: number = await readLine(simulationConfig.allAgentsNumber);
  simulationConfig.sAgentNumber = answer;

  const graphs = new Charts(simulationConfig);

  for (let x = 1; x <= 5; x++) {
    for (let y = 1; y <= 5; y++) {
      for (let z = 1; z <= 5; z++) {
        simulationConfig.x = 0.2 * x;
        simulationConfig.y = 0.2 * y;
        simulationConfig.z = 0.2 * z;
        console.log(simulationConfig.toString());
        graphs.gatherData(makeSimulation(simulationConfig));
      }
    }
  }
  graphs.drawCharts();

  await menuLine();
}

const readLine = async (max: number): Promise<number> => {
  const resultStr = await rl.question(
    `\nPlease enter number of strategic agents (<${max}): `
  );
  const resultNumber = parseInt(resultStr, 10);

  if (resultNumber >= max) {
    console.log("\nStrategic agents number must be less than 1000");
    return readLine(max);
  }

  return resultNumber;
};

const menuLine = async (): Promise<any> => {
  const resultStr = await rl.question(
    `\nDo You want to start new simulation (Y/N): `
  );

  if (resultStr.toLowerCase() === "y") {
    return main();
  } else if (resultStr.toLowerCase() === "n") {
    process.exit(1);
  } else {
    return menuLine();
  }
};

const makeSimulation = (simulationConfig: SimulationConfig): ChartData => {
  const rae = new RAE(
    simulationConfig.hAgentN,
    simulationConfig.allAgentsNumber,
    simulationConfig.agentConfig,
    simulationConfig.iterations
  );
  const result = rae.simulate();
  const resultOutput = new SimulationResultsOutput(result, simulationConfig);
  return resultOutput.getChartIterationData();
};
