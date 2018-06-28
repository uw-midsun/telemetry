import d3 = require('d3');

export class Margin {
  public top : number;
  public bottom : number;
  public left : number;
  public right : number;
}

export class DualChartSettings {
  public width : number;
  public height : number;
  public margin : Margin;
  public y0Domain : number[];
  public y1Domain : number[];
  public leftAxisTitle: string;
  public rightAxisTitle: string;
}

export class DualBarChart {
  private _margin : Margin;
  private _width : number ;
  private _height : number ;
  private _xScale : any;
  private _y0Scale : any;
  private _y1Scale : any;
  private _xAxis : any;
  private _yAxisLeft : any;
  private _yAxisRight : any;
  private _svg : any;
  private _left_axis_title: string;
  private _right_axis_title: string;

  constructor(svg : any, settings : DualChartSettings) {
    this._margin = settings.margin;
    this._width = settings.width - this._margin.left - this._margin.right;
    this._height = settings.height - this._margin.top - this._margin.bottom;
    this._xScale = d3.scaleBand()
        .rangeRound([0, this._width])
        .padding(0.1);
    this._y0Scale = d3.scaleLinear()
                      .domain(settings.y0Domain)
                      .range([this._height, 0]),
    this._y1Scale = d3.scaleLinear()
                      .domain(settings.y1Domain)
                      .range([this._height, 0]);

    this._xAxis = d3.axisBottom(this._xScale)

    // Create left yAxis.
    this._yAxisLeft = d3.axisLeft(this._y0Scale)
                        .ticks(5);
    this._left_axis_title = settings.leftAxisTitle;

    // Create right yAxis.
    this._yAxisRight = d3.axisRight(this._y1Scale)
                        .ticks(6);

    this._right_axis_title = settings.rightAxisTitle;

    this._svg = d3.select(svg)
        .attr("width", this._width + this._margin.left + this._margin.right)
        .attr("height", this._height + this._margin.top + this._margin.bottom)
        .append("g")
        .attr("class", "graph")
        .attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
  }

  public update(data: any) {
  
  
  
  }

  public draw(data: any) {
    this._xScale.domain(data.map(function(d : any) { return d.id; }));
    this._y0Scale.domain([0, d3.max(data, function(d : any) { return d.field_1; })]);
    this._init_x_axis();
    this._init_y_axis_left();
    this._init_y_axis_right();
    this._init_bars(data);
    //let bars = this._svg.selectAll(".bar").data(data).enter();
  }

  private _init_x_axis() {
    this._svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this._height + ")")
        .call(this._xAxis);
  }

  private _init_y_axis_left() {
    this._svg.append("g")
  	  .attr("class", "y axis axisLeft")
  	  .attr("transform", "translate(0,0)")
  	  .call(this._yAxisLeft)
  	  .append("text")
  	  .attr("y", 6)
  	  .attr("dy", "-2em")
  	  .style("text-anchor", "end")
  	  .style("text-anchor", "end")
  	  .text(this._left_axis_title);
  }

  private _init_y_axis_right() {
    this._svg.append("g")
  	  .attr("class", "y axis axisRight")
  	  .attr("transform", "translate(" + this._width + ",0)")
  	  .call(this._yAxisRight)
  	  .append("text")
  	  .attr("y", 6)
  	  .attr("dy", "-2em")
  	  .attr("dx", "2em")
  	  .style("text-anchor", "end")
  	  .text(this._right_axis_title);
  }

  private _init_bars(data : any) {
    let bars = this._svg.selectAll(".bar").data(data).enter();

    bars.append("rect")
        .attr("class", "bar1")
        .attr("x", (d : any) => { return this._xScale(d.id); })
        .attr("width", this._xScale.bandwidth()/2)
        .attr("y", (d : any) => { return this._y0Scale(d.field_1); })
  	    .attr("height", (d : any, i : any, j : any) => {
          return this._height - this._y0Scale(d.field_1);
        }); 
    bars.append("rect")
        .attr("class", "bar2")
        .attr("x", (d : any) => {
          return this._xScale(d.id) + this._xScale.bandwidth()/2;
        })
        .attr("width", this._xScale.bandwidth() / 2)
        .attr("y", (d : any) => {
          return this._y1Scale(d.field_2);
        })
  	    .attr("height", (d : any, i : any, j : any) => {
          return this._height - this._y1Scale(d.field_2);
        });
  }
}

