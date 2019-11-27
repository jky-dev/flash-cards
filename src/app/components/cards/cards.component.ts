import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase } from '@angular/fire/database';
import { DataSnapshot } from '@angular/fire/database/interfaces';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  // db url : https://flashcards-68d42.firebaseio.com/
  qMap = new Map<string, Question[]>();
  tempMap = new Map<string, Question[]>();
  dbRef;
  ssVal;
  questionSet;
  totalQuestions;
  counter = 0;
  categories: string[] = [];
  catIndex;
  qIndex;
  showAnswer = false;
  chosenCategory: string;
  chosenQuestion: string;
  chosenAnswer: string;
  loaded = false;
  constructor(private db: AngularFireDatabase) {
    this.dbRef = db.database.ref('1_Aa13LBY37FD_7KR1EznSZoNNxnt-MUBaAnUYrLie0w');
  }

  addToMap(str: string, qs: Question[]) {
    this.qMap.set(str, qs);
  }

  ngOnInit() {
    this.initializeSet();
  }

  initializeSet() {
    this.dbRef.once('value').then((snapshot: DataSnapshot) => {
      let totalQ = 0;
      snapshot.forEach(element => {
        const questions: Question[] = [];
        element.val().forEach(q => {
          const question: Question = { id: q.id, question: q.question, answer: q.answer };
          questions.push(question);
          totalQ++;
        });
        this.qMap.set(element.key, questions);
        this.categories.push(element.key);
      });
      this.loaded = true;
      console.log(this.qMap);
      this.selectRandom();
      this.totalQuestions = totalQ;
    });
  }

  selectRandom() {
    console.log('selecting random');
    this.catIndex = Math.floor(Math.random() * this.qMap.size);
    this.chosenCategory = this.categories[this.catIndex];
    this.qIndex = Math.floor(Math.random() * this.qMap.get(this.chosenCategory).length);
    const questions = this.qMap.get(this.chosenCategory);
    if (questions.length === 0) {
      this.chosenCategory = 'Error no more questions';
      this.chosenAnswer = '-';
      this.chosenQuestion = '-';
      return;
    }
    this.chosenQuestion = questions[this.qIndex].question;
    this.chosenAnswer = questions[this.qIndex].answer;
    this.counter++;
  }

  nextQuestion() {
    this.showAnswer = false;
    this.qMap.get(this.chosenCategory).splice(this.qIndex, 1);
    this.selectRandom();
  }

  reset() {
    this.counter = 0;
    this.showAnswer = false;
    this.selectRandom();
  }
}
