import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PreferencesDialog } from './preferences/preferences.dialog';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {
  // db url : https://flashcards-68d42.firebaseio.com/
  loggerString = '[QUIZ]';
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
  userAnswer = '';
  percentageCorrect = -1;
  markedFinalQuestion = false;

  // Preferences
  skipMap = new Map<string, boolean>();
  alwaysShow = false;
  skipCorrectQuestions = false;

  user = null;
  correctQuestions = new Set<string>();

  authObs;

  constructor(
    private crud: CrudService,
    private dialog: MatDialog,
    private authService: AuthenticationService,
    private router: Router,
    private logger: NGXLogger,
    private snackbar: MatSnackBar) {}

  ngOnInit() {
    if (!this.crud.questionsLoaded) {
      this.logger.debug(this.loggerString, 'Returning to home');
      this.router.navigateByUrl('/');
    } else {
      this.authObs = this.authService.getAuthStateObservable().subscribe(user => {
        if (user) {
          this.logger.debug(this.loggerString, 'Got user');
          this.user = user;
          localStorage.setItem('user', JSON.stringify(this.user));
        } else {
          this.logger.debug(this.loggerString, 'No user');
          this.user = null;
          localStorage.removeItem('user');
          this.snackbar.open('Make sure to log in to save your progress', 'Dismiss', {
            duration: 2000
          });
        }
      });
      this.logger.debug(this.loggerString, 'Init');
      this.questions = this.crud.getQuestions();
      this.shuffledQs = this.crud.getShuffled();
      this.questionsMap = this.crud.getMap();
      this.initSkipMap();
      this.syncPreferencesFromDB();
      this.syncCorrectAnswersFromDB();
      this.calculateDisplayIndexes(true);
    }
  }

  ngOnDestroy() {
    this.logger.debug(this.loggerString, 'Destroying');
    if (this.authObs) {
      this.authObs.unsubscribe();
    }
  }

  shuffle(): void {
    this.logger.debug(this.loggerString, 'Shuffling');
    if (this.shuffledQs.length !== this.questions.length) {
      this.logger.warn(this.loggerString, 'Shuffled length was not same as questions length');
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
    this.userAnswer = '';
    this.percentageCorrect = -1;
    this.calculateDisplayIndexes(true);
    this.markedFinalQuestion = false;
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

    // case where we mark last question as incorrect again, causing it to go from 0/0 to 0/1,
    // but still on the same question
    if (this.displayIndex === 0 && this.displayLength) {
      return true;
    }

    return false;
  }

  disablePrevButton() {
    if (this.displayIndex === 1 || this.displayIndex === 0) {
      return true;
    }
    return false;
  }

  markAnswer() {
    const correctAnswer = this.shuffledQs[this.currentIndex].answer;
    const correctSet = new Set<string>();
    correctAnswer.split(' ').forEach((word) => {
      correctSet.add(word.toLowerCase().replace(/[^a-zA-Z ]/g, ''));
    });
    const userAnswerSet = new Set<string>();
    this.userAnswer.split(' ').forEach((word) => {
      userAnswerSet.add(word.toLowerCase().replace(/[^a-zA-Z ]/g, ''));
    });
    const totalWords = correctSet.has('') ? correctSet.size - 1 : correctSet.size;
    let matchingWords = 0;
    correctSet.forEach((word) => {
      if (userAnswerSet.has(word)) {
        if (word === '') {
          return;
        }
        this.logger.debug(this.loggerString, word, 'matched');
        matchingWords++;
      }
    });
    this.percentageCorrect = Math.round(((matchingWords / totalWords) * 10000) / 100);
    if (this.percentageCorrect > 50) {
      this.markCorrect();
    } else {
      this.markIncorrect();
    }
    this.showAnswer = true;
    this.logger.debug(this.loggerString, this.percentageCorrect);
  }

  markCorrect() {
    const q = this.shuffledQs[this.currentIndex];
    q.correct = true;
    if (this.correctQuestions.has(q.question + '__' + q.category)) {
      this.logger.warn(this.loggerString, q.question, 'already marked as correct');
    } else {
      this.correctQuestions.add(q.question + '__' + q.category);
      this.logger.debug(this.loggerString, 'Added', q.question, 'to correctQuestions');
      this.syncCorrectAnswersToDB();
      this.displayLength--;
      if (this.displayLength === 0) {
        this.displayIndex = 0;
        this.markedFinalQuestion = true;
        this.showFinishedNotification();
      }
    }
  }

  markIncorrect() {
    const q = this.shuffledQs[this.currentIndex];
    q.correct = false;
    if (this.correctQuestions.delete(q.question + '__' + q.category)) {
      this.logger.debug(this.loggerString, 'Removing', q.question, 'from correctQuestions');
      this.displayLength++;
      this.syncCorrectAnswersToDB();
      // when re-marking final question in category as incorrect
      if (this.displayIndex === 0) {
        this.markedFinalQuestion = false;
      }
    } else {
      this.logger.warn(this.loggerString, q.question, 'Not found in correctQuestions');
    }
  }

  showFinishedNotification() {
    this.snackbar.open('No more questions left! Change the preferences to get new questions and continue on :)', 'Dismiss', {
      duration : 5000
    });
  }

  calculateDisplayIndexes(justShuffled: boolean) {
    this.logger.debug(this.loggerString, 'Calculating display indexes');
    this.markedFinalQuestion = false;
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
    this.logger.debug(this.loggerString, 'Finding next question');
    this.userAnswer = '';
    this.percentageCorrect = -1;
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
    this.logger.debug(this.loggerString, 'Finding prev question');
    this.userAnswer = '';
    this.percentageCorrect = -1;
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
    this.logger.debug(this.loggerString, 'Resetting');
    this.currentIndex = 0;
    this.showAnswer = false;
    this.shuffle();
    if (this.skipMap.get(this.shuffledQs[this.currentIndex].category)) {
      this.nextQuestion();
    }
  }

  initSkipMap() {
    this.logger.debug(this.loggerString, 'Initializing skip categories');
    this.questionsMap.forEach((questions, category) => {
      this.skipMap.set(category, false);
    });
  }

  updateCheck(category: string) {
    this.logger.debug(this.loggerString, 'Updating skip category', category, 'to', !this.skipMap.get(category));
    this.skipMap.set(category, !this.skipMap.get(category));
  }

  openDialog() {
    this.logger.debug(this.loggerString, 'Opening settings');
    const dialogRef = this.dialog.open(PreferencesDialog, {
      data: { map: this.skipMap, alwaysShow: this.alwaysShow, skipCorrectQuestions: this.skipCorrectQuestions },
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      this.logger.debug(this.loggerString, 'Closed settings');
      this.alwaysShow = dialogRef.componentInstance.data.alwaysShow;
      this.skipCorrectQuestions = dialogRef.componentInstance.data.skipCorrectQuestions;
      this.syncPreferencesToDB();
      this.calculateDisplayIndexes(false);
    });
  }

  // updates preferences from the database
  syncPreferencesFromDB() {
    this.logger.debug(this.loggerString, 'Syncing settings from CRUD service');
    this.crud.getSkipCategories().forEach(element => {
      this.skipMap.set(element, true);
    });
    this.alwaysShow = this.crud.getAlwaysShowAnswer();
    this.skipCorrectQuestions = this.crud.getSkipCorrectAnswers();
  }

  // writes preferences to database
  syncPreferencesToDB() {
    this.logger.debug(this.loggerString, 'Syncing settings to CRUD service');
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
    this.logger.debug(this.loggerString, 'Syncing correct answers from CRUD service');
    this.correctQuestions = this.crud.getCorrectQuestions();
    this.logger.debug(this.loggerString, this.correctQuestions.size, 'correct questions');
    this.shuffledQs.forEach(question => {
      if (this.correctQuestions.has(question.question + '__' + question.category)) {
        question.correct = true;
      }
    });
  }

  // syncs correct questions to our shuffled list
  syncCorrectAnswersToDB() {
    this.logger.debug(this.loggerString, 'Syncing correct answers to CRUD service');
    if (this.user === null) {
      this.crud.setCorrectQuestions(null, this.correctQuestions);
    } else {
      this.crud.setCorrectQuestions(this.user.uid, this.correctQuestions);
    }
  }
}
