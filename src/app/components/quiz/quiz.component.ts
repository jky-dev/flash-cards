import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  // db url : https://flashcards-68d42.firebaseio.com/
  questions: Question[] = [];
  shuffledQs: Question[] = [];
  readonly refId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';
  dbRef: firebase.database.Reference;
  categories: string[] = [];
  showAnswer = false;
  loaded = false;
  currentIndex = 0;

  // Preferences
  skipMap = new Map<string, boolean>();
  alwaysShow = false;
  skipCorrectQuestions = false;

  user = null;
  correctQuestions = new Set<string>();

  authObs;

  constructor(private crud: CrudService, private dialog: MatDialog, private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    if (!this.crud.questionsLoaded) {
      this.router.navigateByUrl('/');
    } else {
      this.questions = this.crud.getQuestions();
      this.shuffledQs = this.crud.getShuffled();
      this.categories = this.crud.getCategories();
      this.initSkipMap();
      this.syncPreferencesFromDB();
      this.syncCorrectAnswersFromDB();
      this.authObs = this.authService.getAuthStateObservable().subscribe(user => {
        if (user) {
          this.user = user;
          localStorage.setItem('user', JSON.stringify(this.user));
          console.log('[Quiz] Set LS User: ' + this.user.uid);
        } else {
          this.user = null;
          localStorage.removeItem('user');
          console.log('[Quiz] Removed user');
        }
      });
      if (this.skipMap.get(this.shuffledQs[0].category)) {
        this.nextQuestion();
      }
    }
  }

  ngOnDestroy() {
    if (this.authObs) {
      this.authObs.unsubscribe();
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

  markCorrect() {
    this.shuffledQs[this.currentIndex].correct = true;
    if (this.correctQuestions.has(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category)) {
      console.log('already exists');
    } else {
      this.correctQuestions.add(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category);
      this.syncCorrectAnswersToDB();
    }
  }

  markIncorrect() {
    this.shuffledQs[this.currentIndex].correct = false;
    if (this.correctQuestions.delete(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category)) {
      console.log('Deleted from correct set');
      this.syncCorrectAnswersToDB();
    } else {
      console.log('Did not exist');
    }
  }

  nextQuestion(): boolean {
    let tempIndex = this.currentIndex + 1;
    while (this.skipMap.get(this.shuffledQs[tempIndex].category) ||
    this.shuffledQs[tempIndex].correct === true && this.skipCorrectQuestions) {
      if (tempIndex === this.shuffledQs.length - 1) {
        return false;
      }
      tempIndex++;
    }
    this.currentIndex = tempIndex;
    this.showAnswer = false;
    return true;
  }

  previousQuestion(): boolean {
    let tempIndex = this.currentIndex - 1;
    while (this.skipMap.get(this.shuffledQs[tempIndex].category) ||
    this.shuffledQs[tempIndex].correct === true && this.skipCorrectQuestions) {
      if (tempIndex === 0) {
        return false;
      }
      tempIndex--;
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
      data: { map: this.skipMap, alwaysShow: this.alwaysShow, skipCorrectQuestions: this.skipCorrectQuestions }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.alwaysShow = dialogRef.componentInstance.data.alwaysShow;
      this.skipCorrectQuestions = dialogRef.componentInstance.data.skipCorrectQuestions;
      this.syncPreferencesToDB();
    });
  }

  // updates preferences from the database
  syncPreferencesFromDB() {
    console.log('Syncing preferences from crud');
    this.crud.getSkipCategories().forEach(element => {
      this.skipMap.set(element, true);
    });
    this.alwaysShow = this.crud.getAlwaysShowAnswer();
    this.skipCorrectQuestions = this.crud.getSkipCorrectAnswers();
  }

  // writes preferences to database
  syncPreferencesToDB() {
    console.log('sync to crud');
    const temp = [];
    this.skipMap.forEach((skip: boolean, category: string) => {
      if (skip) {
        temp.push(category);
      }
    });
    if (this.user === null) {
      this.crud.setPreferences(null, temp, this.alwaysShow, this.skipCorrectQuestions);
    } else {
      this.crud.setPreferences(this.user.uid, temp, this.alwaysShow, this.skipCorrectQuestions);
    }
  }

  // syncs correct questions to our shuffled list
  syncCorrectAnswersFromDB() {
    console.log('Syncing answers from crud');
    this.correctQuestions = this.crud.getCorrectQuestions();
    this.shuffledQs.forEach(question => {
      if (this.correctQuestions.has(question.question + '__' + question.category)) {
        question.correct = true;
      }
    });
  }

  // syncs correct questions to our shuffled list
  syncCorrectAnswersToDB() {
    console.log('Syncing answers to crud');
    if (this.user === null) {
      console.log('not logged in');
      this.crud.setCorrectQuestions(null, this.correctQuestions);
    } else {
      console.log('logged in ' + this.user.uid);
      this.crud.setCorrectQuestions(this.user.uid, this.correctQuestions);
    }
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
