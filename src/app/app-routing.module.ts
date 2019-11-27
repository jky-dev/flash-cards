import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CardsComponent } from './components/cards/cards.component';


const routes: Routes = [
  { component: LandingComponent, path: '' },
  { component: CardsComponent, path: 'quiz' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
