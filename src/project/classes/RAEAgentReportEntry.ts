export class RAEAgentReportEntry {
  supplierN: number;
  receiverN: number;
  receptionRate: number;
  serviceAnswerP: number;

  constructor(
    supplierN: number,
    receiverN: number,
    receptionRate: number,
    serviceAnswerP: number
  ) {
    this.supplierN = supplierN;
    this.receiverN = receiverN;
    this.receptionRate = receptionRate;
    this.serviceAnswerP = serviceAnswerP;
  }
}
