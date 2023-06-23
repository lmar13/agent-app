import { AgentMode } from "../interfaces/AgentMode";

export class AgentConfig {
  startTrustLevelV: number;
  mode: AgentMode;
  goodWillHonesX: number;
  goodWillPY: number;
  goodWillRZ: number;
  expoA: number;
  expoG: number;
  minSuppliersNumberKMin: number;
  maxSuppliersNumberKMax: number;

  constructor(
    startTrust: number,
    mode: AgentMode,
    x: number,
    y: number,
    z: number,
    expoA: number,
    expoG: number,
    kMin: number,
    kMax: number
  ) {
    this.startTrustLevelV = startTrust;
    this.mode = mode;

    this.goodWillHonesX = x;
    this.goodWillPY = y;
    this.goodWillRZ = z;

    this.expoA = expoA;
    this.expoG = expoG;

    this.minSuppliersNumberKMin = kMin;
    this.maxSuppliersNumberKMax = kMax;
  }
}
