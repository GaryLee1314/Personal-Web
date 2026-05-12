export type MBTIDimension = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export class ScoringEngine {
  private mbtiScores: Record<MBTIDimension, number> = {
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0
  };

  public recordAnswer(mbtiWeight: Partial<Record<MBTIDimension, number>>) {
    for (const [dim, weight] of Object.entries(mbtiWeight)) {
      if (weight) {
        this.mbtiScores[dim as MBTIDimension] += weight;
      }
    }
  }

  public getResultMBTI(): string {
    const res = [
      this.mbtiScores.E >= this.mbtiScores.I ? 'E' : 'I',
      this.mbtiScores.N >= this.mbtiScores.S ? 'N' : 'S',
      this.mbtiScores.T >= this.mbtiScores.F ? 'T' : 'F',
      this.mbtiScores.J >= this.mbtiScores.P ? 'J' : 'P'
    ].join('');
    return res;
  }

  public getRawScores() {
    return { ...this.mbtiScores };
  }
}
