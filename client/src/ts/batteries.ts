import d3 = require('d3');

export class BatteryModuleData {
  module_id: number;
  voltage: number;
  temperature: number;
}

export class BatteryStatus {
  readonly MODULES_IN_ROW: number = 3;
  readonly ROWS_IN_BOX: number = 6;
  _batteryCells: BatteryModuleData[];
  private _container: any;

  constructor(container: HTMLElement) {
    this._initCells();
    this._container = d3.select(container);
  }

  public draw() {
    let batteryBox1Container = this._container
      .append("div")
      .attr("id","box-1");
    batteryBox1Container
      .append("p")
      .text("Battery Box 1") ;
    batteryBox1Container
      .append("p")
      .attr("id", "avg-vol-1")
      .text("Avg V: 0");
    let batteryBox2Container = this._container
      .append("div")
      .attr("id","box-2");
    batteryBox2Container
      .append("p")
      .text("Battery Box 2") ;
    batteryBox2Container
      .append("p")
      .attr("id", "avg-vol-2")
      .text("Avg V: 0") ;

    let box1 = this._populateBox(0);
    let box2 = this._populateBox(this.ROWS_IN_BOX);

    this._drawBatteryBox(batteryBox1Container, box1);
    this._drawBatteryBox(batteryBox2Container, box2);
  }

  public update(datum: BatteryModuleData) {
    let cell = d3.select("#module-" + datum.module_id)
      .datum(datum)
      .attr("class", this._setStatus);
    let tooltip = cell.select('.module-cell-tooltip');
    tooltip.select(".voltage")
      .text(this._textGenerator("Voltage", "voltage", "V", 10000));
    tooltip.select(".temperature")
      .text(this._textGenerator("Temperature", "temperature", "C", 10000));
    this._updateCells(datum);
    this._updateAvg();
  }

  _updateAvg() {
    d3.select("#avg-vol-1")
      .text(`Avg V: ${this._computeAvg(0)}`);
    d3.select("#avg-vol-2")
      .text(`Avg V: ${this._computeAvg(this.MODULES_IN_ROW * this.ROWS_IN_BOX)}`);
  }

  private _updateCells(datum: any) {
    this._batteryCells[datum.module_id] = datum;
  }

  private _computeAvg(index: number): number {
    let sum = 0;
    let len = this.MODULES_IN_ROW * this.ROWS_IN_BOX;
    for (let i = index; i < (index + len); i++) {
      sum += this._batteryCells[i].voltage;
    }
    let avg = sum/len;
    // converting to voltage:
    avg = avg / 10000;
    return Math.round(avg * 10000) / 10000;
  }

  _setStatus(d: any) {
    let c =  "module-cell ";
    c += (d.voltage < 42000) && (d.temperature < 25000) ?
            "status-ok" : "status-not-ok";
    return c;
  }

  private _tooltipFields = [
    {
      title: "Voltage",
      field: "voltage",
      unit: "V",
      conversion: 10000
    },
    {
      title: "Temperature",
      field: "temperature",
      unit: "C",
      conversion: 10000
    },
    {
      title: "ID",
      field: "module_id",
      unit: "",
      conversion: 1
    }
  ]

  _drawBatteryBox(container: any, data: any) {
    let cells = this._drawCells(container, data);
    this._tooltipFields.forEach((tooltip: any) => {
      this._drawTooltipText(cells, tooltip.title, tooltip.field,
        tooltip.unit, tooltip.conversion);
    });
  }

  _drawCells(container: any, data: any) {
    return container
      .selectAll("div")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "module-cell-row")
      .selectAll("div")
      .data((d:any) => d)
      .enter()
      .append("div")
      .attr("class", "status-ok module-cell")
      .attr("id", (d : BatteryModuleData) => { return "module-" +  d.module_id })
      .append("div")
      .attr("class", "module-cell-tooltip");
  }

  _drawTooltipText(container: any, title: string, field: string,
                   unit: string, conversion: number) {
    container
      .append("p")
      .attr("class", field)
      .text(this._textGenerator(title, field, unit, conversion));
  }

  _textGenerator(title: string, field: string, unit: string, conversion: number) {
    return (d:any) => {
        return title + ": " + d[field]/conversion + unit;
    }
  }

  private _initCells() {
    this._batteryCells = [];
    for (let i = 0; i < 2 * this.MODULES_IN_ROW * this.ROWS_IN_BOX; i++) {
      this._batteryCells.push({
          module_id: i, 
          voltage: 0,
          temperature: 0
        });
    }
  }

  private _populateBox(start_id: number) {
    let box = [];
    for (let i = start_id; i < start_id + this.ROWS_IN_BOX; i++) {
      let module_row = [];
      for (let j = 0; j < this.MODULES_IN_ROW; j++) {
        module_row.push({
          module_id: 3*i + j, 
          voltage: 0,
          temperature: 0
        });
      }
      box.push(module_row);
    }
    return box;
  }
}
