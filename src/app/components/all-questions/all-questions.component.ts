import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-questions',
  templateUrl: './all-questions.component.html',
  styleUrls: ['./all-questions.component.css']
})
export class AllQuestionsComponent implements OnInit {
  map = new Map<string, Question[]>();
  totalQuestions: number;
  correctMap: Map<string, Set<string>>;
  constructor(private crud: CrudService, private router: Router) {
    this.map = crud.getMap();
    this.correctMap = crud.getCorrectQuestionsMap();
    this.totalQuestions = crud.getTotalQuestions();
  }

  ngOnInit() {
    if (this.totalQuestions === 0) {
      this.router.navigateByUrl('/');
    }
    this.syncCorrectness();
  }

  syncCorrectness() {
    console.log('syncing correctness');
    this.map.forEach((questions, category, map) => {
      questions.forEach((question) => {
        if (this.correctMap.has(category)) {
          if (this.correctMap.get(category).has(question.question)) {
            question.correct = true;
            console.log('setting question: ' + question + ' as correct');
          }
        } else {
          // add empty set to correctmap so we can count total correct q's later
          this.correctMap.set(category, new Set<string>());
        }
      });
    });
    console.log('finished syncing');
  }

}
