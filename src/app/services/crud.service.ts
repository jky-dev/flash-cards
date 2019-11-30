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
  loaded = false;
  isReady: Subject<boolean> = new Subject();
  dbRef: firebase.database.Reference;
  map = new Map<string, Question[]>();
  readonly refId: string = '1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w';

  constructor(private db: AngularFireDatabase) {
    this.dbRef = db.database.ref(this.refId);
  }

  initialize() {
    if (this.loaded) {
      this.isReady.next(this.loaded);
      return;
    }
    this.questions = [];
    this.categories = [];
    this.dbRef.once('value').then((snapshot: DataSnapshot) => {
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
      this.loaded = true;
      this.isReady.next(this.loaded);
    });
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
    return this.loaded;
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

  getTotalQuestions() {
    return this.questions.length;
  }
}
