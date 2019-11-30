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
  categories: string[] = [];
  skipCategories: string[] = [];
  alwaysShowAnswer = false;
  user = null;
  questionsLoaded = false;
  isReady: Subject<boolean> = new Subject();
  map = new Map<string, Question[]>();
  readonly questionsRefId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';

  constructor(private db: AngularFireDatabase) {}

  initialize() {
    if (this.questionsLoaded) {
      this.isReady.next(this.questionsLoaded);
      return;
    } else {
      this.initQuestions();
      this.initPreferences();
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
          const question: Question = { category: element.key, question: q.question.trim(), answer: q.answer };
          this.questions.push(question);
        });
        this.categories.push(element.key);
      });
      this.shuffle();
      this.questionsLoaded = true;
      this.isReady.next(this.questionsLoaded);
    });
  }

  initPreferences() {
    console.log('loading preferences from db');
    if (localStorage.getItem('user')) {
      this.user = JSON.parse(localStorage.getItem('user'));
      this.db.database.ref('users/' + this.user.uid + '/preferences/categories').on('value', (snapshot: DataSnapshot) => {
        this.skipCategories = [];
        snapshot.forEach(element => {
          this.skipCategories.push(element.val());
        });
        console.log(this.skipCategories);
      });
      this.db.database.ref('users/' + this.user.uid + '/preferences/showAnswer').on('value', (snapshot: DataSnapshot) => {
        this.alwaysShowAnswer = snapshot.val();
      });
    }
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

  // returns a map <category, question[]>
  getMap() {
    if (this.map.size === 0) {
      this.questions.forEach((question: Question) => {
        if (this.map.has(question.category)) {
          this.map.get(question.category).push(question);
        } else {
          const array = [question];
          this.map.set(question.category, array);
        }
      });
    }
    return this.map;
  }

  // gets the total amount of questions
  getTotalQuestions() {
    return this.questions.length;
  }

  // writes quiz preferences to the database
  setPreferences(uid: string, skip: string[], showAnswer: boolean) {
    if (uid === null) {
      console.log('setting locally');
      this.skipCategories = skip;
      this.alwaysShowAnswer = showAnswer;
    } else {
      console.log('setting preferences to db')
      this.db.database.ref('users/' + uid + '/preferences').set({
        categories : skip,
        showAnswer : showAnswer
      });
    }
  }
}
