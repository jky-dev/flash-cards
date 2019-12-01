import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from 'src/app/services/crud.service';
import { Observer, Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy {
  loggerString = '[LAND]';
  observer: Observer<boolean>;
  sub: Subscription;
  ready: boolean;
  signedIn: boolean;
  user = null;
  authObserver;
  constructor(
    private crud: CrudService,
    public authService: AuthenticationService,
    private logger: NGXLogger) {
    this.logger.debug(this.loggerString, 'Constructing landing page');
    crud.initialize();
    this.authObserver = authService.getAuthStateObservable().subscribe(user => {
      if (user) {
        this.logger.debug(this.loggerString, 'Got User');
        this.signedIn = true;
        this.user = JSON.parse(localStorage.getItem('user'));
        crud.initPreferences();
        crud.initCorrectQuestions();
      } else {
        this.logger.debug(this.loggerString, 'No User found');
        this.signedIn = false;
        this.user = null;
        localStorage.removeItem('user');
      }
    });
  }

  ngOnInit() {
    this.logger.debug(this.loggerString, 'Initialising');
    this.ready = this.crud.getIsReady();
    this.sub = this.crud.getIsReadyObserver().subscribe(x => {
      this.ready = x;
    });
  }

  ngOnDestroy() {
    this.logger.debug(this.loggerString, 'Destroying');
    this.sub.unsubscribe();
    this.authObserver.unsubscribe();
  }

  login() {
    this.logger.debug(this.loggerString, 'Log In');
    this.authService.GoogleAuth();
  }

  signOut() {
    this.logger.debug(this.loggerString, 'Sign out');
    this.authService.SignOut();
    localStorage.removeItem('user');
    this.crud.signedOut();
  }
}
