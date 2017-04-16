// A simple class for returning time a window of time to use for a domain.
// Caches the value from the last call to domain if all calls need to be synced
// to the same time.
export class TimeWindow {
  public cached: any[];
  constructor(public windowMillis: number) { this.domain(); }

  domain(): any[] {
    const now = Date.now();
    this.cached = [ now - this.windowMillis, now ];
    return this.cached;
  }

  // Decorator to make getting the beginning nicer.
  begin(): number { return this.cached[0]; }

  // Decorator to make getting the end nicer.
  end(): number { return this.cached[1]; }
}

// Adaptor class to make a Plottable.Scale have dynamically updating domain.
export class WindowedScale {
  private _scale: Plottable.Scale<any, any>;

  constructor(scale: Plottable.Scale<any, any>,
              public domainUpdater: (domain: any[]) => any[]) {
    this._scale = scale;
  }

  // Returns a copy of the scale that is updated to the latest domain.
  getScale(): Plottable.Scale<any, any> {
    if (this.domainUpdater) {
      this._scale.domain(this.domainUpdater(this._scale.domain()));
    }
    return this._scale;
  }
}

// Adaptor class to make a Plottable.Dataset compatible with streaming data by
// providing concise windowing and add data functions.
export class StreamingDataset {
  private _dataset: Plottable.Dataset;
  private _filter: (data: any[]) => any[];
  public dataUpdate: () => void;

  constructor(data: any[], metadata: any) {
    this._dataset = new Plottable.Dataset(data, metadata);
  }

  // Return or update the data owned by the dataset.
  data(): any[];
  data(data: any[]): this;
  data(data?: any[]): this|any[] {
    if (data) {
      this._dataset.data(data);
      if (this.dataUpdate) {
        this.dataUpdate();
      }
      return this;
    }
    return this._dataset.data();
  }

  // Return or update the metadata owned by the dataset.
  metadata(): any;
  metadata(metadata: any[]): this;
  metadata(metadata?: any[]): this|any {
    if (metadata) {
      this._dataset.metadata(metadata);
      return this;
    }
    return this._dataset.metadata();
  }

  // Append a single datum to the dataset.
  addData(datum: any): void {
    const data = this._dataset.data();
    data.push(datum);
    this._dataset.data(data);
    if (this.dataUpdate) {
      this.dataUpdate();
    }
  }

  // Filter the dataset to remove any points outside the window to display.
  // Mainly for memory conservation.
  setFilter(filter: (dataset: any[]) => any[] | null) { this._filter = filter; }

  // Return a Plottable.Dataset object. The filter is applied prior to
  // returning.
  getDataset(): Plottable.Dataset {
    if (this._filter) {
      this._dataset.data(this._filter(this._dataset.data()));
    }
    return this._dataset;
  }
};

// Adaptor class to make streaming Plottable.Plots.Area easier. For ease of use
// and configuration the plot is not private or protected.
//
// DO NOT SET THESE FIELDS ON THE plot PROPERTY DIRECTLY:
// - x
// - datasets
// TODO(ckitagawa): Generalize this to line plots at some point and consider
// adding protection to the plot property.
export class StreamingPlot {
  private _datasets: StreamingDataset[];
  private _scale: WindowedScale;
  private _xCallback: (data: any) => number;
  constructor(public plot: Plottable.Plots.Area<any>) {
    this.plot.datasets([]);
  }

  // Sets the datasets on the chart using streaming datasets.
  datasets(): StreamingDataset[];
  datasets(datasets: StreamingDataset[]): this;
  datasets(datasets?: StreamingDataset[]): this|StreamingDataset[] {
    if (datasets) {
      this._datasets = datasets;
      this.datasetUpdate();
      return this;
    }
    return this._datasets;
  }

  // Updates all the datasets.
  private datasetUpdate(): void {
    if (this._datasets) {
      let raw_datasets: Plottable.Dataset[] = [];
      for (let dataset of this._datasets) {
        raw_datasets.push(dataset.getDataset());
      }
      this.plot.datasets(raw_datasets);
    }
  }

  // Set the x scale and callback using a streaming scale.
  x(callback: (data: any) => number, scale: WindowedScale): void {
    this._scale = scale;
    this._xCallback = callback;
    this.xUpdate();
  }

  // Update the x component.
  private xUpdate(): void {
    this.plot.x(this._xCallback, this._scale.getScale());
  }

  // Redraws the graph calling updates on the streaming elements beforehand.
  redraw(): void {
    this.datasetUpdate();
    this.xUpdate();
    this.plot.redraw();
  }
}
