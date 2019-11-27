import { Injectable } from '@angular/core';
import { Question } from 'src/question';
import { AngularFireDatabase, snapshotChanges } from '@angular/fire/database';
import { mapToMapExpression } from '@angular/compiler/src/render3/util';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  dbString = '1hJ1vqXhm0L06NBuq-p4eyNwl188AEpRVRBeAK7Wjh6Y';
  qMap = new Map<string, Array<Question>>();

  constructor(private db: AngularFireDatabase) { }

  GetMap() {
    this.db.database.ref(this.dbString).once('value', function(snapshot) {
      // snapshot.forEach(element => {
      //   console.log(element.key);
      //   let questions: Question[] = [];
      //   element.val().forEach(q => {
      //     console.log(q);
      //     let question: Question = { id: q.id, question: q.question, answer: q.answer };
      //     questions.push(question);
      //   });
      //   if (this.qMap === null) {
      //     console.log('qMap is null');
      //     return;
      //   }
      //   console.log(questions);
      // })
    });
  }

  // GetObservable(): FirebaseListObservable<Item[]> {
  //   return this.db.list(this.dbString);
  // }
}
