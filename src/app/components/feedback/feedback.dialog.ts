import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'feedback-dialog',
  templateUrl: 'feedback.dialog.html',
  styleUrls: ['feedback.dialog.css']
})
export class FeedbackDialog {
  name: string = '';
  email: string = '';
  feedback: string = '';
  constructor(
    public dialogRef: MatDialogRef<FeedbackDialog>) {}

  submit() {
    let array = [this.name, this.email, this.feedback];
    if (this.feedback !== '') {
      this.dialogRef.close(array);
    } else {
      this.dialogRef.close();
    }
  }
}