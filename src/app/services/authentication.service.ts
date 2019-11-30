import { Injectable } from '@angular/core';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  userState;

  constructor(public afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userState = user;
        localStorage.setItem('user', JSON.stringify(this.userState));
        console.log('[Auth] Set LS User: ' + this.userState.uid);
      } else {
        localStorage.removeItem('user');
        console.log('[Auth] Removed user');
      }
    });
  }

   // Auth provider
  AuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
    .then((res) => {
      console.log(res);
    }).catch((error) => {
      console.log(error);
    });
  }

  // Login with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  // Signin with email/password
  SignIn(email, password) {
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
    .then((res) => {
      console.log(res);
    }).catch((error) => {
      console.log(error);
    });
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
