import { Injectable } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase } from '@angular/fire/database';
import { DataSnapshot } from '@angular/fire/database/interfaces';
import { Subject } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  loggerString = "[CRUD]";
  questions: Question[] = [];
  shuffledQs: Question[] = [];
  correctQuestions: Set<string> = new Set();
  skipCategories: string[] = [];
  alwaysShowAnswer = false;
  skipCorrectAnswers = false;
  user = null;
  questionsLoaded = false;
  isReady: Subject<boolean> = new Subject();
  map = new Map<string, Question[]>();
  correctQuestionsMap = new Map<string, Set<string>>();
  readonly questionsRefId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';

  constructor(private db: AngularFireDatabase, private logger: NGXLogger) {}

  initialize() {
    if (this.questionsLoaded) {
      this.logger.debug(this.loggerString, 'INIT questions already loaded');
      this.isReady.next(this.questionsLoaded);
      return;
    } else {
      this.initQuestions();
    }
  }

  initQuestions() {
    // init questions
    this.questionsLoaded = false;
    this.isReady.next(this.questionsLoaded);
    this.logger.debug(this.loggerString, 'Init questions, and question map');
    this.db.database.ref(this.questionsRefId).once('value').then((snapshot: DataSnapshot) => {
      this.logger.debug(this.loggerString, 'Got questions from DB');
      this.questions = [];
      this.shuffledQs = [];
      snapshot.forEach(element => {
        element.val().forEach(q => {
          if (q.question.length === 0) {
            return;
          }
          const question: Question = { category: element.key, question: q.question.trim(), answer: q.answer, correct: false };
          this.questions.push(question);
          if (this.map.has(question.category)) {
            this.map.get(question.category).push(question);
          } else {
            const array = [question];
            this.map.set(question.category, array);
          }
        });
      });
      this.shuffledQs = [...this.questions];
      this.shuffle();
      this.questionsLoaded = true;
      this.isReady.next(this.questionsLoaded);
    }).catch(error => {
      this.logger.error(this.loggerString, 'Init questions error');
      this.logger.error(this.loggerString, error);
      this.questionsLoaded = true;
      this.isReady.next(this.questionsLoaded);
    });
  }

  initPreferences() {
    if (localStorage.getItem('user')) {
      this.logger.debug(this.loggerString, 'Init preferences');
      this.user = JSON.parse(localStorage.getItem('user'));
      this.db.database.ref('users/' + this.user.uid + '/preferences/categories').on('value', (snapshot: DataSnapshot) => {
        this.logger.debug(this.loggerString, 'Got preferences category');
        this.skipCategories = [];
        snapshot.forEach(element => {
          this.skipCategories.push(element.val());
        });
      }, (error) => {
        this.logger.error(this.loggerString, 'Preferences category error');
        this.logger.error(this.loggerString, error);
      });
      this.db.database.ref('users/' + this.user.uid + '/preferences/showAnswer').on('value', (snapshot: DataSnapshot) => {
        this.logger.debug(this.loggerString, 'Got preferences for always showing answer');
        this.alwaysShowAnswer = snapshot.val();
      }, (error) => {
        this.logger.error(this.loggerString, 'Preferences always show error');
        this.logger.error(this.loggerString, error);
      });
      this.db.database.ref('users/' + this.user.uid + '/preferences/skipCorrect').on('value', (snapshot: DataSnapshot) => {
        this.logger.debug(this.loggerString, 'Got preferences for skip correct answers');
        this.skipCorrectAnswers = snapshot.val();
      }, (error) => {
        this.logger.error(this.loggerString, 'Preferences skip error');
        this.logger.error(this.loggerString, error);
      });
    }
  }

  // Fetches correct questions from a user 
  initCorrectQuestions() {
    if (localStorage.getItem('user')) {
      this.logger.debug(this.loggerString, 'Init correct questions');
      this.user = JSON.parse(localStorage.getItem('user'));
      this.db.database.ref('users/' + this.user.uid + '/correctQs/questions').on('value', (snapshot: DataSnapshot) => {
        this.logger.debug(this.loggerString, 'Got correct questions from DB');
        this.correctQuestions = new Set();
        this.correctQuestionsMap.clear();
        snapshot.forEach(element => {
          this.correctQuestions.add(element.val());
          const split = element.val().split('__');
          const question = split[0];
          const category = split[1];
          if (this.correctQuestionsMap.has(category)) {
            this.correctQuestionsMap.get(category).add(question);
          } else {
            const set = new Set<string>();
            set.add(question);
            this.correctQuestionsMap.set(category, set);
          }
        });
      }, (error) => {
        this.logger.error(this.loggerString, 'Correct questions error');
        this.logger.error(this.loggerString, error);
      });
    }
  }

  signedOut() {
    this.logger.debug(this.loggerString, 'Signed out');
    this.db.database.ref('users/' + this.user.uid + '/correctQs/questions').off();
    this.db.database.ref('users/' + this.user.uid + '/preferences/categories').off();
    this.db.database.ref('users/' + this.user.uid + '/preferences/showAnswer').off();
    this.db.database.ref('users/' + this.user.uid + '/preferences/skipCorrect').off();
    this.skipCategories = [];
    this.alwaysShowAnswer = false;
    this.skipCorrectAnswers = false;
    this.correctQuestions.clear();
    this.correctQuestionsMap.clear();
    this.shuffledQs = [];
    this.user = null;
    this.map.clear();
    this.questions = [];
    this.initQuestions();
  }

  shuffle() {
    this.logger.debug(this.loggerString, 'Shuffling questions');
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

  getIsReadyObserver() {
    return this.isReady.asObservable();
  }

  getIsReady() {
    return this.questionsLoaded;
  }

  getQuestions() {
    return this.questions;
  }

  getShuffled() {
    return this.shuffledQs;
  }

  getSkipCategories() {
    return this.skipCategories;
  }

  getAlwaysShowAnswer() {
    return this.alwaysShowAnswer;
  }

  getCorrectQuestions() {
    return this.correctQuestions;
  }

  getCorrectQuestionsMap() {
    return this.correctQuestionsMap;
  }

  getSkipCorrectAnswers() {
    return this.skipCorrectAnswers;
  }

  // returns a map <category, question[]>
  getMap() {
    return this.map;
  }

  // gets the total amount of questions
  getTotalQuestions() {
    return this.questions.length;
  }

  // writes quiz preferences to the database
  setPreferences(uid: string, skip: string[], answer: boolean, skipCorrectAnswers: boolean) {
    if (uid === null) {
      this.logger.debug(this.loggerString, 'Setting preferences locally');
      this.skipCategories = skip;
      this.alwaysShowAnswer = answer;
      this.skipCorrectAnswers = skipCorrectAnswers;
    } else {
      this.logger.debug(this.loggerString, 'Setting preferences to DB');
      this.db.database.ref('users/' + uid + '/preferences').set({
        categories : skip,
        showAnswer : answer,
        skipCorrect : skipCorrectAnswers
      });
    }
  }

  setCorrectQuestions(uid: string, questions: Set<string>) {
    if (uid === null) {
      this.logger.debug(this.loggerString, 'Setting correct questions locally');
      this.correctQuestions = questions;
      this.correctQuestionsMap.clear();
      questions.forEach(q => {
        const split = q.split('__');
        const question = split[0];
        const category = split[1];
        if (this.correctQuestionsMap.has(category)) {
          this.correctQuestionsMap.get(category).add(question);
        } else {
          const set = new Set<string>();
          set.add(question);
          this.correctQuestionsMap.set(category, set);
        }
      })
    } else {
      this.logger.debug(this.loggerString, 'Setting correct questions to DB');
      const temp: string[] = [];
      questions.forEach((value) => {
        temp.push(value);
      });
      this.db.database.ref('users/' + uid + '/correctQs').set({
        questions : temp
      });
    }
  }
}
