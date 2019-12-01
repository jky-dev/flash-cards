import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  questionsMap: Map<string, Question[]>;
  readonly refId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';
  dbRef: firebase.database.Reference;
  categories: string[] = [];
  showAnswer = false;
  loaded = false;
  currentIndex = 0;
  displayIndex = 0;
  displayLength = 0;

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
      // this.categories = this.crud.getCategories();
      this.questionsMap = this.crud.getMap();
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
      this.calculateDisplayIndexes(true);
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
    this.calculateDisplayIndexes(true);
  }

  disableNextButton() {
    if (this.displayLength === 0) {
      return true;
    }

    if (this.displayIndex > this.displayLength) {
      return true;
    }

    // for the case where its the second last question (e.g. 1/2), and we mark it correct
    // it becomes 1/1 but theres another question ahead
    if (this.displayIndex === this.displayLength) {
      if (this.skipCorrectQuestions && this.shuffledQs[this.currentIndex].correct) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  }

  disablePrevButton() {
    if (this.displayIndex === 1 || this.displayIndex === 0) {
      return true;
    }
    return false;
  }

  markCorrect() {
    this.shuffledQs[this.currentIndex].correct = true;
    if (this.correctQuestions.has(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category)) {
      console.log('already exists');
    } else {
      this.correctQuestions.add(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category);
      this.syncCorrectAnswersToDB();
      this.displayLength--;
      if (this.displayIndex === 1 && this.displayLength === 0) {
        this.displayIndex = 0;
      }
    }
  }

  markIncorrect() {
    this.shuffledQs[this.currentIndex].correct = false;
    if (this.correctQuestions.delete(this.shuffledQs[this.currentIndex].question + '__' + this.shuffledQs[this.currentIndex].category)) {
      console.log('Deleted from correct set');
      this.displayLength++;
      this.syncCorrectAnswersToDB();
    } else {
      console.log('Did not exist');
    }
  }

  calculateDisplayIndexes(justShuffled: boolean) {
    let tempIndex = 0;
    let totalQuestions = 0;
    let firstActualIndex = -1;
    let displayIndex = 0;
    let findOriginalQuestion = false;
    // if not part of a skip category, and is not correct with skip
    if (!this.skipMap.get(this.shuffledQs[this.currentIndex].category) &&
     !(this.shuffledQs[this.currentIndex].correct && this.skipCorrectQuestions)) {
      findOriginalQuestion = true;
    }
    while (tempIndex !== this.shuffledQs.length) {
      // if its skipped, dont add to total questions
      if (this.skipMap.get(this.shuffledQs[tempIndex].category)) {
        tempIndex++;
        continue;
      }

      // question is not part of the skip categories
      // add question to list if we are not skipping it due to being correct
      if (!this.shuffledQs[tempIndex].correct || !this.skipCorrectQuestions) {
        totalQuestions++;
        if (findOriginalQuestion && !justShuffled) {
          if (tempIndex <= this.currentIndex) {
            displayIndex++;
            firstActualIndex = tempIndex;
          }
        } else {
          if (firstActualIndex === -1) {
            firstActualIndex = tempIndex;
            displayIndex = 1;
          }
        }

      }
      tempIndex++;
    }
    this.displayLength = totalQuestions;
    this.displayIndex = displayIndex;
    this.currentIndex = firstActualIndex === -1 ? 0 : firstActualIndex;
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
    // if it was marked correct, dont increment the display index, as we are decrementing the total quesitons left
    if (!this.shuffledQs[this.currentIndex].correct || this.shuffledQs[this.currentIndex].correct && !this.skipCorrectQuestions) {
      this.displayIndex++;
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
    this.displayIndex--;
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
    this.questionsMap.forEach((questions, category) => {
      this.skipMap.set(category, false);
    })
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
      this.calculateDisplayIndexes(false);
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
    console.log('got ' + this.correctQuestions.size + ' correct questions');
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
