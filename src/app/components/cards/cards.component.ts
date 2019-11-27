import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase } from '@angular/fire/database';
import { CrudService } from 'src/app/services/crud.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  // db url : https://flashcards-68d42.firebaseio.com/
  qMap = new Map<string, Question[]>();
  questionsRef;
  questionSet;
  totalQuestions;
  counter = 0;
  currentIndex;
  showAnswer = false;
  chosenCategory: string;
  chosenQuestion: string;
  chosenAnswer: string;
  constructor(db: AngularFireDatabase) {
    db.database.ref('1hJ1vqXhm0L06NBuq-p4eyNwl188AEpRVRBeAK7Wjh6Y').once('value').then(function(snapshot) {
        snapshot.forEach(element => {
        console.log(element.key);
        const questions: Question[] = [];
        element.val().forEach(q => {
          console.log(q);
          const question: Question = { id: q.id, question: q.question, answer: q.answer };
          questions.push(question);
        });
        this.addToMap(element.key, questions);
        console.log(questions);
      })
    })
  }

  addToMap(str: string, qs: Question[]) {
    this.qMap.set(str, qs);
  }

  initializeSet() {
    this.questionsRef.ref('1hJ1vqXhm0L06NBuq-p4eyNwl188AEpRVRBeAK7Wjh6Y/Sheet1').once('value', function(snapshot) {
      snapshot.forEach(element => {
        this.questionSet.push(element);
        console.log(element);
      });
    });
  }

  ngOnInit() {
    //this.selectRandom();
  }

  selectRandom() {
    this.currentIndex = Math.floor(Math.random()*this.questionSet.length);
    if (this.questionSet.length === 0) {
      this.chosenCategory = 'Error no more questions';
      this.chosenAnswer = '-';
      this.chosenQuestion = '-';
      return;
    }
    this.chosenCategory = this.questionSet[this.currentIndex].category;
    this.chosenQuestion = this.questionSet[this.currentIndex].question;
    this.chosenAnswer = this.questionSet[this.currentIndex].answer;
    this.counter++;
  }

  nextQuestion() {
    this.showAnswer = false;
    this.questionSet.splice(this.currentIndex, 1);
    this.selectRandom();
  }

  reset() {
    this.counter = 0;
    this.showAnswer = false;
    this.selectRandom();
  }


}
