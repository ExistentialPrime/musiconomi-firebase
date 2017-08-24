// Firebase Imports
//------------------------------------------------------------
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  storageBucket: "",
  messagingSenderId: ""
};

// Modules
//-----------------------------------------------------------
import { BrowserModule }            from '@angular/platform-browser';
import { BrowserAnimationsModule }  from '@angular/platform-browser/animations';
import { FormsModule }              from '@angular/forms';
import { HttpModule }               from '@angular/http';
import { NgModule }                 from '@angular/core';
import { RouterModule }             from '@angular/router';


// Components
//-----------------------------------------------------------
import { AppComponent }           from './app.component';
import { DashboardComponent }     from './components/dashboard/dashboard.component';
import { DiscoverComponent }      from './components/discover/discover.component';
import { LandingPageComponent }   from './components/landing/landing-page.component';
import { SiteHeaderComponent }    from './components/header/site-header.component';
import { UploadTrackComponent }   from './components/upload/upload-track.component';

// Services
//-----------------------------------------------------------
import { AuthGuard }              from './services/authGuard.service';

// Declaration
//-----------------------------------------------------------
@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DiscoverComponent,
    LandingPageComponent,
    SiteHeaderComponent,
    UploadTrackComponent
  ],
  imports: [
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    BrowserModule,
    BrowserAnimationsModule,
	  FormsModule,
    HttpModule,

    // Angular Routes (can do this in seperate file if desired)
    RouterModule.forRoot([
      { path: '', component: LandingPageComponent, pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'discover', component: DiscoverComponent, canActivate: [AuthGuard] },
      { path: 'upload-track', component: UploadTrackComponent, canActivate: [AuthGuard] },
      { path: '**', redirectTo: '' }
    ]),

	  
  ],
  providers: [
    AuthGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
