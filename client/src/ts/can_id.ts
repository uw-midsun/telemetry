
export class CanId {
  private rawId: number;

  public constructor(rawId: number) {
    this.rawId = rawId;
  }

  public sourceId(): number {
    return this.rawId & 0xF;
  }

  public msgType(): number {
    return (this.rawId >> 4) & 0x1;
  }

  public msgId(): number {
    return (this.rawId >> 5) & 0x3F;
  }
}
