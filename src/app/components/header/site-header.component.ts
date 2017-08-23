import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';

import * as firebase from 'firebase/app';

@Component({
  selector: 'site-header',
  templateUrl: './site-header.component.html'
})
export class SiteHeaderComponent implements OnInit {

  // Properties
  user: Observable<firebase.User>;

  // Constructor (dependency injection only)
  constructor(public afAuth: AngularFireAuth, public router: Router) {
    //Dependency Injection Here
   }
  
  // Initialize the component
  ngOnInit(): void {
    this.user = this.afAuth.authState;
  }

  // Log in to Firebase
  login() {
    this.afAuth.auth.signInAnonymously()
      .then(result => {
        if (firebase.auth().currentUser) {
          // We are now logged in, redirect to dashboard
          this.router.navigate(['/dashboard']);
        }
      });
    
  }

  // Log out of Firebase
  logout() {
    this.afAuth.auth.signOut()
      .then(result =>{
        if (firebase.auth().currentUser == null) {
          // we are now logged out, redirect to landing page
          this.router.navigate(['/']);
        }
      });
  }

}
