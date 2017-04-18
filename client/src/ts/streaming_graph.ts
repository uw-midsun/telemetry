// simple class for returning a time a window to use for a domain. Caches the
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

  // decorator to make getting the beginning nicer.
  public begin(): number { return this.cached[0]; }

  // decorator to make getting the end nicer.
  public end(): number { return this.cached[1]; }
}

// adapter class to make a Plottable.Scale have dynamically updating domain.
export class WindowedScale {
  public domainUpdater: (domain: any[]) => any[];
  private _scale: Plottable.Scale<any, any>;

  constructor(scale: Plottable.Scale<any, any>,
              domainUpdater: (domain: any[]) => any[]) {
    this.domainUpdater = domainUpdater;
    this._scale = scale;
  }

  // returns a copy of the scale that is updated to the latest domain.
  public getScale(): Plottable.Scale<any, any> {
    if (this.domainUpdater) {
      this._scale.domain(this.domainUpdater(this._scale.domain()));
    }
    return this._scale;
  }
}

// adapter class to make a Plottable.Dataset compatible with streaming data by
// providing concise windowing and add data functions.
export class StreamingDataset {
  public dataUpdate: () => void;
  private _dataset: Plottable.Dataset;
  private _filter: (data: any[]) => any[];

  constructor(data: any[], metadata: any) {
    this._dataset = new Plottable.Dataset(data, metadata);
  }

  // return or update the data owned by the dataset.
  public data(): any[];
  public data(data: any[]): this;
  public data(data?: any[]): this|any[] {
    if (data) {
      this._dataset.data(data);
      if (this.dataUpdate) {
        this.dataUpdate();
      }
      return this;
    }
    return this._dataset.data();
  }

  // return or update the metadata owned by the dataset.
  public metadata(): any;
  public metadata(metadata: any[]): this;
  public metadata(metadata?: any[]): this|any {
    if (metadata) {
      this._dataset.metadata(metadata);
      return this;
    }
    return this._dataset.metadata();
  }

  // append a single datum to the dataset.
  public addData(datum: any): void {
    const data = this._dataset.data();
    data.push(datum);
    this._dataset.data(data);
    if (this.dataUpdate) {
      this.dataUpdate();
    }
  }

  // filter the dataset to remove any points outside the window to display.
  // mainly for memory conservation.
  public setFilter(filter: (dataset: any[]) => any[] | null): void {
    this._filter = filter;
  }

  // return a Plottable.Dataset object. The filter is applied prior to
  // returning.
  public getDataset(): Plottable.Dataset {
    if (this._filter) {
      this._dataset.data(this._filter(this._dataset.data()));
    }
    return this._dataset;
  }
}

// adapter class to make streaming Plottable.Plots.Area easier. For ease of use
// and configuration the plot is not private or protected.
//
// _ DO NOT SET THESE FIELDS ON THE plot PROPERTY DIRECTLY:
// - x
// - datasets
// TODO(ckitagawa): Generalize this to line plots at some point and consider
// adding protection to the plot property.
export class StreamingPlot {
  public plot: Plottable.Plots.Area<any>;
  private _datasets: StreamingDataset[];
  private _scale: WindowedScale;
  private _xCallback: (data: any) => number;

  constructor(plot: Plottable.Plots.Area<any>) {
    this.plot = plot;
    this.plot.datasets([]);
  }

  // sets the datasets on the chart using streaming datasets.
  public datasets(): StreamingDataset[];
  public datasets(datasets: StreamingDataset[]): this;
  public datasets(datasets?: StreamingDataset[]): this|StreamingDataset[] {
    if (datasets) {
      this._datasets = datasets;
      this.datasetUpdate();
      return this;
    }
    return this._datasets;
  }

  // set the x scale and callback using a streaming scale.
  public x(callback: (data: any) => number, scale: WindowedScale): void {
    this._scale = scale;
    this._xCallback = callback;
    this.xUpdate();
  }

  // redraws the graph calling updates on the streaming elements beforehand.
  public redraw(): void {
    this.datasetUpdate();
    this.xUpdate();
    this.plot.redraw();
  }

  // updates all the datasets.
  private datasetUpdate(): void {
    if (this._datasets) {
      const raw_datasets: Plottable.Dataset[] = [];
      for (const dataset of this._datasets) {
        raw_datasets.push(dataset.getDataset());
      }
      this.plot.datasets(raw_datasets);
    }
  }

  // update the x component.
  private xUpdate(): void {
    this.plot.x(this._xCallback, this._scale.getScale());
  }
}
