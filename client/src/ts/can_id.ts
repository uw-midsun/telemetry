
export class CanId {
  private rawId: number;

  public constructor(rawId: number) {
    this.rawId = rawId;
  }
  
  public sourceId() {
    return this.rawId & 0xF;
  }

  public msgType() {
    return (this.rawId >> 4) & 0x1;
  }

  public msgId() {
    return (this.rawId >> 5) & 0x3F;
  }
}
