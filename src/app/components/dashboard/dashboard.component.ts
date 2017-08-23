import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';
import { Router } from '@angular/router';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { moveIn } from '../../animations/router.animations';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import "firebase/storage";

declare var swal: any;

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  animations: [moveIn()],
  host: {'[@moveIn]': ''}
})
export class DashboardComponent implements OnInit {

  // Properties
  messages: FirebaseListObservable<any[]>;
  msgVal: string = '';

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
    this.selectedTrack = { path: "",  filename: "None"};
    this.getMessages();
    this.populateUploadedTracks();
  }


  getMessages(): void {
      // Get Messages (simple list via query from tutorial)
      this.messages = this.af.list('/messages', {
        query: {
          limitToLast: 50
        }
      });
  }


  SendMsg(desc: string) {
    if (desc == null || desc == "")
      return; // prevent empty messages

    this.messages.push({ message: desc});
    this.msgVal = '';
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
  
}


interface Track {
  path: string;
  filename: string;
  downloadURL?: string;
  $key?: string;
}