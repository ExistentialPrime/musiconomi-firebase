// Firebase Imports
//------------------------------------------------------------
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
export const firebaseConfig = {
  apiKey: "AIzaSyBKhNy7cWUEkq1-xx15i2AiAWfsVVyLfLo",
  authDomain: "musiconomi-sandbox.firebaseapp.com",
  databaseURL: "https://musiconomi-sandbox.firebaseio.com",
  storageBucket: "musiconomi-sandbox.appspot.com",
  messagingSenderId: "740932574333"
};

// Modules
//-----------------------------------------------------------
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';
import { NgModule } from '@angular/core';
import { RouterModule }  from '@angular/router';


// Components
//-----------------------------------------------------------
import { AppComponent } from './app.component';

// Services
//-----------------------------------------------------------


// Declaration
//-----------------------------------------------------------
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    BrowserModule,
	  FormsModule,
    HttpModule,

    // Angular Routes (can do this in seperate file if desired)
    RouterModule.forRoot([
      //{ path: '', component: LandingPageComponent, pathMatch: 'full' },
      //{ path: 'dashboard', component: DashboardComponent },
      { path: '**', redirectTo: '' }
    ]),

	  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
