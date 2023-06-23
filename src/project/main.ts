import { SimulationConfig } from "./classes/SimulationConfig";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { RAE } from "./classes/RAE";
import { SimulationResultsOutput } from "./classes/SimulationResultsOutput";

const rl = readline.createInterface({ input, output });

export async function main() {
  const simulationConfig = new SimulationConfig();

  const answer: number = await readLine(simulationConfig.allAgentsNumber);
  simulationConfig.sAgentNumber = answer;

  for (let x = 1; x <= 5; x++) {
    for (let y = 1; y <= 5; y++) {
      for (let z = 1; z <= 5; z++) {
        simulationConfig.x = 0.2 * x;
        simulationConfig.y = 0.2 * y;
        simulationConfig.z = 0.2 * z;
        console.log(simulationConfig.toString());
        makeSimulation(simulationConfig);
      }
    }
  }
}

const readLine = async (max: number): Promise<number> => {
  const resultStr = await rl.question(
    `Please enter number of strategic agents (<${max}): `
  );
  const resultNumber = parseInt(resultStr, 10);

  if (resultNumber >= max) {
    console.log("Strategic agents number must be less than 1000");
    return readLine(max);
  }

  return resultNumber;
};

const makeSimulation = (simulationConfig: SimulationConfig): void => {
  const rae = new RAE(
    simulationConfig.hAgentN,
    simulationConfig.allAgentsNumber,
    simulationConfig.agentConfig,
    simulationConfig.iterations
  );
  const result = rae.simulate();
  const resultOutput = new SimulationResultsOutput(result, simulationConfig);
  resultOutput.saveChartsToFiles();
  // resultOutput.saveToCSVFile();
  // console.log("resultOutput", resultOutput);
};
