import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'preferences-dialog',
  templateUrl: './preferences.dialog.html',
  styleUrls: ['./preferences.dialog.css']
})
// tslint:disable-next-line: component-class-suffix
export class PreferencesDialog {

  constructor(
    public dialogRef: MatDialogRef<PreferencesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  // ngModel didnt like to work so using this
  updateCheck(category: string): void {
    this.data.map.set(category, !this.data.map.get(category));
  }
}