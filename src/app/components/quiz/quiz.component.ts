import { Component, OnInit, Inject } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  // db url : https://flashcards-68d42.firebaseio.com/
  questions: Question[] = [];
  shuffledQs: Question[] = [];
  readonly refId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';
  dbRef: firebase.database.Reference;
  categories: string[] = [];
  showAnswer = false;
  loaded = false;
  currentIndex = 0;
  skipMap = new Map<string, boolean>();
  alwaysShow = false;
  user = null;

  constructor(private crud: CrudService, public dialog: MatDialog) {
    this.questions = crud.getQuestions();
    this.shuffledQs = crud.getShuffled();
    this.categories = crud.getCategories();
    this.initSkipMap();
  }

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.user = JSON.parse(localStorage.getItem('user'));
      this.syncPreferencesFromDB();
    } else {
      this.user = null;
    }
  }

  shuffle(): void {
    if (this.shuffledQs.length !== this.questions.length) {
      this.shuffledQs = [...this.questions];
    }
    const array = this.shuffledQs;
    let length = array.length;
    let i: number;
    let temp: Question;
    while (length) {
      i = Math.floor(Math.random() * length--);
      temp = array[length];
      array[length] = array[i];
      array[i] = temp;
    }
  }

  nextQuestion(): boolean {
    let tempIndex = this.currentIndex;
    while (this.skipMap.get(this.shuffledQs[++tempIndex].category)) {
      if (tempIndex === this.shuffledQs.length - 1) {
        return false;
      }
    }
    this.currentIndex = tempIndex;
    this.showAnswer = false;
    return true;
  }

  previousQuestion(): boolean {
    let tempIndex = this.currentIndex;
    while (this.skipMap.get(this.shuffledQs[--tempIndex].category)) {
      if (tempIndex === 0) {
        return false;
      }
    }
    this.currentIndex = tempIndex;
    this.showAnswer = false;
    return true;
  }

  toggleShowAnswer() {
    this.showAnswer = !this.showAnswer;
  }

  reset() {
    this.currentIndex = 0;
    this.showAnswer = false;
    this.shuffle();
    if (this.skipMap.get(this.shuffledQs[this.currentIndex].category)) {
      this.nextQuestion();
    }
  }

  initSkipMap() {
    this.categories.forEach((category: string) => {
      this.skipMap.set(category, false);
    });
  }

  updateCheck(category: string) {
    this.skipMap.set(category, !this.skipMap.get(category));
  }

  openDialog() {
    const dialogRef = this.dialog.open(PreferencesDialog, {
      data: { map: this.skipMap, alwaysShow: this.alwaysShow }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.alwaysShow = dialogRef.componentInstance.data.alwaysShow;
      if (this.user) {
        this.syncPreferencesToDB();
      }
    });
  }

  // updates preferences from the database
  syncPreferencesFromDB() {
    this.crud.getSkipCategories().forEach(element => {
      this.skipMap.set(element, true);
    });
    this.alwaysShow = this.crud.getAlwaysShowAnswer();
  }

  // writes preferences to database
  syncPreferencesToDB() {
    const temp = [];
    this.skipMap.forEach((skip: boolean, category: string) => {
      if (skip) {
        temp.push(category);
      }
    });
    this.crud.setPreferences(this.user.uid, temp, this.alwaysShow);
  }
}

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
