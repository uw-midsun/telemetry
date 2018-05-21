// Simple class for returning a time a window to use for a domain. Caches the
// value from the last call to domain if all calls need to be synced to the same
// time.
export class TimeWindow {
  public cached: any[];
  public windowMillis: number;

  constructor(windowMillis: number) {
    this.windowMillis = windowMillis;
    this.domain();
  }

  public domain(): any[] {
    const now = Date.now();
    this.cached = [ now - this.windowMillis, now ];
    return this.cached;
  }

  // Method to make getting the beginning nicer.
  public begin(): number { return this.cached[0]; }

  // Method to make getting the end nicer.
  public end(): number { return this.cached[1]; }
}

export class StreamingDataSet {
  private dataset: any[];

  // Return or update the data owned by the dataset.
  public data(): any[];
  public data(data: any[]): this;
  public data(data?: any[]): this|any[] {
    if (data) {
          
    }
    return this.dataset;
  }
} 
