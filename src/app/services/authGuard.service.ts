import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AngularFireAuth } from "angularfire2/auth";
import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';

/* ------------------------------------------------------------------------
  AuthGuard Service 
  - Used for making sure the user is authorized before allowing
    access to routes specified in the routing config
  - Documentation: https://coursetro.com/posts/code/32/Create-a-Full-Angular-Authentication-System-with-Firebase
  ------------------------------------------------------------------------- */
@Injectable()
export class AuthGuard implements CanActivate {

  // Constructor
  constructor(public afAuth: AngularFireAuth, private router: Router) { }

  // Can the specified Route activate? Return TRUE if user is authorized
  canActivate() : Observable<boolean> {

    // If the user is not logged in we'll send them back to the home page
    return this.afAuth.authState
      .take(1)
      .map(state => !!state)
      .do(authenticated => {
        if (!authenticated) { this.router.navigate(['']); }
      });

  }


}