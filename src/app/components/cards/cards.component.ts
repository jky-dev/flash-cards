import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase } from '@angular/fire/database';
import { DataSnapshot } from '@angular/fire/database/interfaces';
import { CrudService } from 'src/app/services/crud.service';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
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

  constructor(private crud: CrudService) {
    this.questions = crud.getQuestions();
    this.shuffledQs = crud.getShuffled();
    this.categories = crud.getCategories();
    this.initSkipMap();
  }

  ngOnInit() {}

  shuffle() {
    console.log('shuffling');
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

  nextQuestion() {
    while (this.skipMap.get(this.shuffledQs[++this.currentIndex].category)) {
      if (this.currentIndex === this.shuffledQs.length - 1) {
        return;
      }
    }
    this.showAnswer = false;
  }

  previousQuestion() {
    while (this.skipMap.get(this.shuffledQs[--this.currentIndex].category)) {
      if (this.currentIndex === 0) {
        return;
      }
    }
    this.showAnswer = false;
  }

  toggleShowAnswer() {
    this.showAnswer = !this.showAnswer;
  }

  reset() {
    this.currentIndex = 0;
    this.showAnswer = false;
    this.shuffle();
  }

  initSkipMap() {
    this.categories.forEach((category: string) => {
      this.skipMap.set(category, false);
    });
  }

  updateCheck(category: string) {
    this.skipMap.set(category, !this.skipMap.get(category));
    console.log(category + ' ' + this.skipMap.get(category));
  }
}
