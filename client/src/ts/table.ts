// This module creates a table.
export class TableComponent {
  private _table: HTMLTableElement;
  private _fields: string[];
  private _numFields: number;
  private _header : HTMLTableRowElement;
  private _body : HTMLTableSectionElement;

  constructor(table: HTMLTableElement, fields: string[]) {
    this._table = table;
    this._fields = fields;
    this._numFields = fields.length;
    this._header = table.createTHead().insertRow();
    this._body = table.appendChild(document.createElement('tbody'));
            
    for (let field of fields) {
      let cell  = this._header.insertCell();
      let text  = document.createTextNode(field);
      cell.appendChild(text);
    }
  }

  public addRow(data:Array<any>): number {
    if (!(data.length == this._numFields)) {
      return -1;
    }
    let row = this._body.insertRow();
    for (let field of data) {
      let cell  = row.insertCell();
      let text  = document.createTextNode(field);
      cell.appendChild(text);
    }
  }
}
