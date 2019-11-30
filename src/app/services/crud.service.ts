import { Injectable } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase } from '@angular/fire/database';
import { DataSnapshot } from '@angular/fire/database/interfaces';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  questions: Question[] = [];
  shuffledQs: Question[] = [];
  correctQuestions: Set<string> = new Set();
  categories: string[] = [];
  skipCategories: string[] = [];
  alwaysShowAnswer = false;
  skipCorrectAnswers = false;
  user = null;
  questionsLoaded = false;
  isReady: Subject<boolean> = new Subject();
  map = new Map<string, Question[]>();
  correctQuestionsMap = new Map<string, Set<string>>();
  readonly questionsRefId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';

  constructor(private db: AngularFireDatabase) {}

  initialize() {
    if (this.questionsLoaded) {
      this.isReady.next(this.questionsLoaded);
      return;
    } else {
      this.initQuestions();
    }
  }

  initQuestions() {
    this.questions = [];
    this.categories = [];
    // init questions
    console.log('loading questions from db');
    this.db.database.ref(this.questionsRefId).once('value').then((snapshot: DataSnapshot) => {
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
        this.categories.push(element.key);
      });
      this.shuffle();
      this.questionsLoaded = true;
      this.isReady.next(this.questionsLoaded);
    });
  }

  initPreferences() {
    if (localStorage.getItem('user')) {
      console.log('loading preferences from db');
      this.user = JSON.parse(localStorage.getItem('user'));
      this.db.database.ref('users/' + this.user.uid + '/preferences/categories').on('value', (snapshot: DataSnapshot) => {
        this.skipCategories = [];
        snapshot.forEach(element => {
          this.skipCategories.push(element.val());
        });
        console.log('skip cats: ' + this.skipCategories);
      });
      this.db.database.ref('users/' + this.user.uid + '/preferences/showAnswer').on('value', (snapshot: DataSnapshot) => {
        this.alwaysShowAnswer = snapshot.val();
      });
      this.db.database.ref('users/' + this.user.uid + '/preferences/skipCorrect').on('value', (snapshot: DataSnapshot) => {
        this.skipCorrectAnswers = snapshot.val();
      });
    }
  }

  initCorrectQuestions() {
    if (localStorage.getItem('user')) {
      console.log('loading correct q\'s from db');
      this.user = JSON.parse(localStorage.getItem('user'));
      this.db.database.ref('users/' + this.user.uid + '/correctQs/questions').on('value', (snapshot: DataSnapshot) => {
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
      });
    }
  }

  signedOut() {
    this.shuffledQs = [...this.questions];
    this.shuffle();
  }

  shuffle() {
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

  getCategories() {
    return this.categories;
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
      console.log('setting locally');
      this.skipCategories = skip;
      this.alwaysShowAnswer = answer;
      this.skipCorrectAnswers = skipCorrectAnswers;
    } else {
      console.log('setting preferences to db');
      this.db.database.ref('users/' + uid + '/preferences').set({
        categories : skip,
        showAnswer : answer,
        skipCorrect : skipCorrectAnswers
      });
    }
  }

  setCorrectQuestions(uid: string, questions: Set<string>) {
    if (uid === null) {
      console.log('setting correct questions locally');
      this.correctQuestions = questions;
    } else {
      console.log('setting correct questions to DB');
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
