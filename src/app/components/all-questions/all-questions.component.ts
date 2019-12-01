import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-all-questions',
  templateUrl: './all-questions.component.html',
  styleUrls: ['./all-questions.component.css']
})
export class AllQuestionsComponent implements OnInit {
  loggerString = '[ALLQ]';
  map = new Map<string, Question[]>();
  totalQuestions: number;
  correctMap: Map<string, Set<string>>;
  constructor(private crud: CrudService, private router: Router, private logger: NGXLogger) {
    this.map = crud.getMap();
    this.correctMap = crud.getCorrectQuestionsMap();
    this.totalQuestions = crud.getTotalQuestions();
    this.logger.debug(this.loggerString, 'All questions constructed');
  }

  ngOnInit() {
    if (this.totalQuestions === 0) {
      this.logger.debug(this.loggerString, 'Redirecting to home');
      this.router.navigateByUrl('/');
    }
    this.syncCorrectness();
  }

  syncCorrectness() {
    this.logger.debug(this.loggerString, 'Marking questions in map as correct');
    this.map.forEach((questions, category, map) => {
      questions.forEach((question) => {
        if (this.correctMap.has(category)) {
          if (this.correctMap.get(category).has(question.question)) {
            question.correct = true;
            this.logger.info(this.loggerString, 'C:', category, 'Q:', question.question, 'is correct');
          }
        } else {
          // add empty set to correctmap so we can count total correct q's later
          this.correctMap.set(category, new Set<string>());
        }
      });
    });
    this.logger.debug(this.loggerString, 'Finished marking');
  }

}
