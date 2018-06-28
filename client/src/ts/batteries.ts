import d3 = require('d3');

export class BatteryModuleData {
  module_id: number;
  voltage: number;
  temperature: number;
}

export class BatteryStatus {
  readonly MODULES_IN_ROW: number = 3;
  readonly ROWS_IN_BOX: number = 6;
  _batteryBox1: BatteryModuleData[][];
  _batteryBox2: BatteryModuleData[][];
  private _container: any;

  constructor(container: HTMLElement) {
    this._batteryBox1 = this._populateBox(0);
    this._batteryBox2 = this._populateBox(this.ROWS_IN_BOX);
    this._container = d3.select(container);
  }

  public draw() {
    let batteryBox1Container = this._container
      .append("div")
      .attr("id","box-1");
    batteryBox1Container
      .append("p")
      .text("Battery Box 1") ;
    let batteryBox2Container = this._container
      .append("div")
      .attr("id","box-2");
    batteryBox2Container
      .append("p")
      .text("Battery Box 2") ;

    this._drawBatteryBox(batteryBox1Container, this._batteryBox1);
    this._drawBatteryBox(batteryBox2Container, this._batteryBox2);
  }

  public update(datum: BatteryModuleData) {
    let cell = d3.select("#module-" + datum.module_id)
      .datum(datum)
      .attr("class", this._setStatus);
    let tooltip = cell.select('.module-cell-tooltip');
    tooltip.select(".voltage")
      .text(this._textGenerator("Voltage"));
    tooltip.select(".temperature")
      .text(this._textGenerator("Temperature"));
  }

  _setStatus(d: any) {
    let c =  "module-cell ";
    c += (d.voltage < 4200) && (d.temperature < 45) ?
            "status-ok" : "status-not-ok";
    return c;
  }

  _drawBatteryBox(container: any, data: any) {
    let cells = this._drawCells(container, data);
    this._drawTooltipText(cells, "Voltage");
    this._drawTooltipText(cells, "Temperature");
    this._drawTooltipText(cells, "ID");
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

  _drawTooltipText(container: any, text: string) {
    container
      .append("p")
      .attr("class", text.toLowerCase())
      .text(this._textGenerator(text));
  }

  _textGenerator(text: string) {
    return (d:any) => {
        return text + ": " + d[text];
    }
  }

  _populateBox(start_id: number) {
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
