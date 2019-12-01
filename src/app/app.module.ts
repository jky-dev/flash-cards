import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { QuizComponent, PreferencesDialog } from './components/quiz/quiz.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment.prod';
import { AllQuestionsComponent } from './components/all-questions/all-questions.component';
import { MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule, MatCardModule, MatExpansionModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularFireAuthModule } from '@angular/fire/auth';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    QuizComponent,
    AllQuestionsComponent,
    PreferencesDialog
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireDatabaseModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatIconModule,
    FlexLayoutModule,
    MatCardModule,
    MatExpansionModule,
    AngularFireAuthModule
  ],
  bootstrap: [AppComponent],
  entryComponents: [PreferencesDialog]
})
export class AppModule { }
