import { Component, OnInit } from '@angular/core';
import { Question } from 'src/question';
import { CrudService } from 'src/app/services/crud.service';

@Component({
  selector: 'app-all-questions',
  templateUrl: './all-questions.component.html',
  styleUrls: ['./all-questions.component.css']
})
export class AllQuestionsComponent implements OnInit {
  map = new Map<string, Question[]>();
  totalQuestions: number;
  constructor(private crud: CrudService) {
    this.map = crud.getMap();
    this.totalQuestions = crud.getTotalQuestions();
  }

  ngOnInit() {}


}