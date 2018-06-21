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

// Decorator class to make a Plottable.Scale have dynamically updating domain.
export class WindowedScale extends Plottable.Scales.Linear {
  public domainUpdater: (domain: any[]) => number[];

  constructor(domainUpdater: (domain: any[]) => any[]) {
    super();
    this.domainUpdater = domainUpdater;
  }

  // Updates the domain.
  public domain(): number[];
  public domain(domain: any[]): Plottable.QuantitativeScale<number>;
  public domain(domain?: any[]): number[]|Plottable.QuantitativeScale<number> {
    if (domain) {
      return super.domain(domain);
    } else if (this.domainUpdater) {
      super.domain(this.domainUpdater(super.domain()));
    }
    return super.domain();
  }
}

// Decorator class to make a Plottable.Dataset compatible with streaming data by
// providing concise windowing and add data functions.
export class StreamingDataset extends Plottable.Dataset {
  public dataUpdate: () => void;

  constructor(data: any[], metadata: any) {
    super(data, metadata);
  }

  // Return or update the data owned by the dataset.
  public data(): any[];
  public data(data: any[]): this;
  public data(data?: any[]): this|any[] {
    if (data) {
      super.data(this._filter(data));
      if (this.dataUpdate) {
        this.dataUpdate();
      }
      return this;
    }
    return super.data();
  }

  // Append a single datum to the dataset.
  public addData(datum: any): void {
    super.data(this._filter(super.data()));
    const data = super.data();
    data.push(datum);
    super.data(data);
    if (this.dataUpdate) {
      this.dataUpdate();
    }
  }

  // Filter the dataset to remove any points outside the window to display.
  // mainly for memory conservation.
  // TODO(ckitagawa): Consider making the identity function more aggressive in
  // filtering.
  public filter(filter: (dataset: any[]) => any[]): void {
    this._filter = filter;
  }

  private _filter: (data: any[]) => any[] = (data: any[]) => data;
}
