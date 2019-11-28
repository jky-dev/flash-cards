import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CardsComponent } from './components/cards/cards.component';
import { AllQuestionsComponent } from './components/all-questions/all-questions.component';


const routes: Routes = [
  { component: LandingComponent, path: '' },
  { component: CardsComponent, path: 'quiz' },
  { component: AllQuestionsComponent, path: 'all' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
