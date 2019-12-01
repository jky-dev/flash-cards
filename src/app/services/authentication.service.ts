import { Injectable } from '@angular/core';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  loggerString = '[AUTH]';
  userState;

  constructor(public afAuth: AngularFireAuth, private logger: NGXLogger) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userState = user;
        localStorage.setItem('user', JSON.stringify(this.userState));
        this.logger.debug(this.loggerString, 'Got user');
      } else {
        localStorage.removeItem('user');
        this.logger.debug(this.loggerString, 'No user');
      }
    });
  }

   // Auth provider
  AuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
    .then((res) => {
      this.logger.debug(this.loggerString, 'Auth login', res);
    }).catch((error) => {
      this.logger.debug(this.loggerString, 'Auth login error', error);
    });
  }

  // Login with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Sign out
  SignOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
    });
  }

  getAuthStateObservable() {
    return this.afAuth.authState;
  }

  getCurrentUser() {
    return this.afAuth.auth.currentUser;
  }
}
