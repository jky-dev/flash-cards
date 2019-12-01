import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from 'src/app/services/crud.service';
import { Observer, Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  observer: Observer<boolean>;
  sub: Subscription;
  ready: boolean;
  signedIn: boolean;
  user = null;
  authObserver;
  constructor(private crud: CrudService, public authService: AuthenticationService) {
    crud.initialize();
    this.authObserver = authService.getAuthStateObservable().subscribe(user => {
      if (user) {
        console.log('landing got user');
        this.signedIn = true;
        this.user = JSON.parse(localStorage.getItem('user'));
        crud.initPreferences();
        crud.initCorrectQuestions();
      } else {
        console.log('landing no user');
        this.signedIn = false;
        this.user = null;
        localStorage.removeItem('user');
      }
    });
  }

  ngOnInit() {
    this.ready = this.crud.getIsReady();
    this.sub = this.crud.getIsReadyObserver().subscribe(x => {
      this.ready = x;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.authObserver.unsubscribe();
  }

  login() {
    this.authService.GoogleAuth();
  }

  signOut() {
    console.log('signing out');
    this.authService.SignOut();
    localStorage.removeItem('user');
    this.crud.signedOut();
  }
}
