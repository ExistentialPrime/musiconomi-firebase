import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';
import { Router } from '@angular/router';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { moveIn, fallIn } from '../../animations/router.animations';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import "firebase/storage";

declare var swal: any;

@Component({
  selector: 'discover',
  templateUrl: './discover.component.html',
  animations: [moveIn(), fallIn()],
  host: {'[@moveIn]': ''}
})
export class DiscoverComponent implements OnInit, OnDestroy {

  // Properties
  tracks: any[];
  trackOwners: string[];

  public newTrackId : string;
  public newTrackTitle : string;
  public newTrackUrl : string;
  public newTrackArtist : string;
  public addTrackResult: any;
  @ViewChild('audioplayer') player: any;  // Grab the <audio> element tagged as '#audioplayer' in the front ent

  // Observable objects so we can cancel the custom subscriptions later
  public trackObservable: any[];
  public ownerObservable: any;

  // Upload-testing properties
  fileList : FirebaseListObservable<Track[]>;
  uploadedTrackList : Observable<Track[]>;
  selectedTrack : Track;

  // Constructor
  constructor(public afAuth: AngularFireAuth, public af: AngularFireDatabase, private http: Http, public router: Router) {
    /* Use Constructor only for dependency injection, do all setup in OnInit */
  }

  // Initialize the component
  ngOnInit(): void {
    this.tracks = [];
    this.selectedTrack = { path: "",  filename: "None"};
    this.populateTracks();
    this.populateUploadedTracks();
  }


  // Get all Users with tracks (due to the weird way I was playing around with saving tracks under /tracks/UserName path)
  populateTracks(): void {
    this.tracks = []; // reset it before populating it fresh    
    this.trackOwners = null;
    this.ownerObservable = this.af.list('/tracks').subscribe(results => {
      this.trackOwners = results.map(t => t.$key);
      this.getTracks()
    });
    
  }
  
  // Get tracks based on users
  getTracks(): void {
    this.trackObservable = [];    // hate having to do it this weird way. logout page ftw
    this.trackOwners.forEach(owner => {
      let trackob = this.af.list('/tracks/' + owner).subscribe(results => {
        results.forEach(t => this.tracks.push(t)); // TODO: Since this is a subscription, any updates from firebase get pushed. So if a new one gets deleted from the dashboard, it will re-add all the tracks again since it doesnt clear them out or check if they are already in the array first
      });
      this.trackObservable.push(trackob);
    });
    
  }


  // Test sending data via api
  SendTrack() {
    if (this.newTrackId == null || this.newTrackId == "" 
      || this.newTrackArtist == null || this.newTrackArtist == "" 
      || this.newTrackTitle == null || this.newTrackTitle == ""
      || this.newTrackUrl== null || this.newTrackUrl == "") {
        alert('Please complete all fields');
        return; // prevent empty tracks
      }

    let newTrack = { id : this.newTrackId, title: this.newTrackTitle, audioUrl: this.newTrackUrl, artist: this.newTrackArtist};
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let payload = JSON.stringify(newTrack);
    let options = new RequestOptions({ headers: headers });
    this.http.post("https://us-central1-musiconomi-sandbox.cloudfunctions.net/addTrack", payload, options)
    //this.http.post("http://localhost:5000/musiconomi-sandbox/us-central1/addTrack", payload, options)
              .toPromise()
              .then(response => {
                this.addTrackResult = response.text();
                this.populateTracks(); // repopulate tracks
                if (response.ok != true || response.status != 200) { return "Request failed: " + response.status; }
                else { return response.json(); } 
              }) 
              .catch(this.handleError);

    this.newTrackId = '';
    this.newTrackTitle = '';
    this.newTrackUrl = '';
    this.newTrackArtist = '';
  }
  private handleError(error: any): Promise<any> {
    console.error('An error occurred and was caught by Angular: ', error); 
    return Promise.reject(error.message || error);
  }



  // Play a track from storage
  streamTrack(track: Track) {
    this.selectedTrack = track;
    let storage = firebase.storage();
    var pathReference = storage.ref(track.path); 
    pathReference.getDownloadURL().then(resultURL => {
      this.player.nativeElement.src = resultURL;
      this.player.nativeElement.play();
    });
    
  }

  // Show all tracks in storage in the /uploaded-tracks/ directory
  populateUploadedTracks() {
    let storage = firebase.storage();
    this.fileList = this.af.list(`/uploaded-tracks`);
    this.uploadedTrackList = this.fileList.map(itemList =>
      itemList.map( item => {
          var pathReference = storage.ref(item.path);
          let result = {$key: item.$key, downloadURL: pathReference.getDownloadURL(), path: item.path, filename: item.filename};
          return result;
      })
    );
  }
  uploadTrack() {
    // Create a root reference
    let storageRef = firebase.storage().ref();

    // no file selected, just ignore 
    if ((<HTMLInputElement>document.getElementById('file')).files[0] == null) { return; }

    let success = false;
    // This currently only grabs item 0, TODO refactor it to grab them all
    for (let selectedFile of [(<HTMLInputElement>document.getElementById('file')).files[0]]) {
        console.log(selectedFile);
        // Make local copies of services because "this" will be clobbered
        let router = this.router;
        let af = this.af;
        let path = `/uploaded-tracks/${selectedFile.name}`;
        var iRef = storageRef.child(path);
        iRef.put(selectedFile).then((snapshot) => {
            console.log('Uploaded a blob or file! Now storing the reference at',`/uploaded-tracks/`);
            af.list(`/uploaded-tracks/`).push({ path: path, filename: selectedFile.name })
        });
    }
      
  }
  deleteTrack(track: Track) {
      let storagePath = track.path;
      let referencePath = `/uploaded-tracks/` + track.$key;

      // Do these as two separate steps so you can still try delete ref if file no longer exists
      //--------------------------------
      // 1. Delete from Storage
      firebase.storage().ref().child(storagePath).delete()
      .then(
          () => {},
          (error) => console.error("Error deleting stored file",storagePath)
      );

      // 2. Delete references
      this.af.object(referencePath).remove();
  }


  // Clean up all of our observables 
  ngOnDestroy() {
    this.tracks = null;
    this.fileList = null;
    this.uploadedTrackList = null;
    this.trackOwners = null;
    this.ownerObservable.unsubscribe();
    this.trackObservable.forEach(obs => obs.unsubscribe() );
   }

  
}


interface Track {
  path: string;
  filename: string;
  downloadURL?: string;
  $key?: string;
}

