import { Component, Input, OnInit, AfterViewInit, ViewChild, Renderer2 } from '@angular/core';
import encoding from 'text-encoding';
import { Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/catch';

// Videogular imports
import { VgAPI } from 'videogular2/core';

// Dash JS modules (not working right yet, seems like non-angular compliant typing)
import * as dashjs from 'dashjs';
// import {MediaPlayer} from 'dashjs';


@Component({
  selector: 'landing-page',
  templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit, AfterViewInit {

  // Properties
  public currentFile: any;
  public currentKeyString: any;
  public config: any;
  @ViewChild('dashplayer') video: any;  // Grab the <video> element tagged as '#dashplayer' in the front end
  @ViewChild('audioplayer') audio: any;
  public KEY: Uint8Array;
  public playerError: string;
  public vgApi: VgAPI;
  public vgDashSource: string;

  // Constructor
  constructor(private renderer: Renderer2) {
    /* Use Constructor only for dependency injection, do all setup in OnInit */
  }

  // Initialize the Videogular player API (documentation: http://videogular.github.io/videogular2/docs/getting-started/using-the-api.html)
  // Streaming dash: https://github.com/videogular/videogular2-showroom/blob/master/src/app/streaming-player/streaming-player.component.ts
  onPlayerReady(api: VgAPI) {
    this.vgApi = api;

    this.vgApi.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
          // Set the video to the beginning
          this.vgApi.getDefaultMedia().currentTime = 0;
      }
    );

    // Listen for the 'encrypted' event and handle it
    this.vgApi.getDefaultMedia().subscriptions.encrypted.subscribe(
      (evt) => {
          this.handleEncrypted(evt);
      }
    );

    // Autoplay when enough data is loaded
    let autoplay = this.vgApi.getDefaultMedia().subscriptions.canPlay.subscribe(
      (evt) => {
        // this.vgApi.play();  // errors out on mpds (for now)
      });
/*
.catch(evt => {
      autoplay.unsubscribe();
      console.log('Error with Videogular: ' + evt);
    })
    */

  }

  // Initialize the component
  ngOnInit(): void {

    // Set the unencrypted Loki track to be the first
    // this.currentFile = '../assets/mp4/Loki_cenc.mpd';  // 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd'; // example DASH video, works great with dash.js player
    this.currentKeyString = 'None';
    this.vgDashSource = '../assets/mp4/example.webm'; // 'https://s3.amazonaws.com/_bc_dml/example-content/sintel_dash/sintel_vod.mpd';

    // mp4 config and key
    // Your key should be an array of bytes; a line like new Uint8Array([0x279926496a7f5d25da69f2b3b2799a7f]) incorrectly creates a single-member array. Instead, you should write it as new Uint8Array([0x27, 0x99, 0x26, 0x49, 0x6a, 0x7f, 0x5d, 0x25, 0xda, 0x69, 0xf2, 0xb3, 0xb2, 0x79, 0x9a, 0x7f]). It then still needs to be encoded to base64 format before use in the JsonWebKey.
    // My generated key: --key 1:a0a1a2a3a4a5a6a7a8a9aaabacadaeaf:0123456789abcdef --property 1:KID:121a0fca0f1b475b8910297fa8e0a07e
    /*this.KEY =  new Uint8Array([
      0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
      0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf
    ]);
*/    this.config = [{
      initDataTypes: ['cenc'],
      audioCapabilities: [{
        contentType: 'audio/mp4; codecs="mp4a.40.2"'
      }],
      videoCapabilities: [{
        contentType: 'video/mp4; codecs="avc1.42E01E"'
      }]
    }];

    // Webm config and key
    /* THIS WORKS LIKE A CHARM! */
    
    this.KEY =  new Uint8Array([
      0xeb, 0xdd, 0x62, 0xf1, 0x68, 0x14, 0xd2, 0x7b,
      0x68, 0xef, 0x12, 0x2a, 0xfc, 0xe4, 0xae, 0x3c
    ]);/*
    this.config = [{
      initDataTypes: ['webm'],
      videoCapabilities: [{
        contentType: 'video/webm; codecs="vp8"'
      }]
    }];
    */

  }

    // EME Stuff to fire after the dom is initialized
  ngAfterViewInit(): void {
    let localThis = this;

    // Log events dispatched to make debugging easier...
    let evts =  [ 'canplay', 'canplaythrough', 'encrypted', 'ended', 'error', 'loadeddata',
      'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress',
      'stalled', 'suspend', 'waiting', ];
    evts.forEach(function (e) {
      localThis.renderer.listen(localThis.video.nativeElement, e, (event) => {
        console.log('Player Event: ' + e);
        if (e === 'error') {
          // Chrome 60+ error message (firefox is different. See https://stackoverflow.com/questions/5573461/html5-video-error-handling)
          if (event.path && event.path[0]) {
            console.log('error message: ' + event.path[0].error.message);
          }
        }
      });
    });


    // Load an initially specified file, if any
    if (this.currentFile) {  this.video.nativeElement.src = this.currentFile; }

    // Add the 'encrypted' listener event
    let decrypt = this.renderer.listen(this.video.nativeElement, 'encrypted', (evt) => {
      localThis.handleEncrypted(evt);
    });

    // Audio encrypted listener
    let decryptAudio = this.renderer.listen(this.audio.nativeElement, 'encrypted', (evt) => {
      localThis.handleEncrypted(evt);
    });

    // Create the MediaKeys object for decryption handling
    navigator.requestMediaKeySystemAccess('org.w3.clearkey', localThis.config).then(
      function(keySystemAccess) {
        return keySystemAccess.createMediaKeys();
      }
    ).then(
      function(createdMediaKeys) {
        console.log('created MediaKeys object ok: ' + createdMediaKeys);
        return localThis.video.nativeElement.setMediaKeys(createdMediaKeys);
      }
    ).catch(
      function(error) {
        console.error('Failed to set up MediaKeys', error);
      }
    );

    /* not appending to buffer correctly, ugh
    const audioContentType = 'audio/mp4; codecs="mp4a.40.2"'; // AAC-LC
    const videoContentType = 'video/mp4; codecs="avc1.64001F"'; // High profile level 3.1
    const audioFragments = [
      '../assets/mp4/init.mp4',
      '../assets/mp4/seg-1.m4s',
      '../assets/mp4/seg-2.m4s',
      '../assets/mp4/seg-3.m4s',
      '../assets/mp4/seg-4.m4s',
      '../assets/mp4/seg-5.m4s',
      '../assets/mp4/seg-6.m4s',
      '../assets/mp4/seg-7.m4s',
      '../assets/mp4/seg-8.m4s',
      '../assets/mp4/seg-9.m4s',
      '../assets/mp4/seg-10.m4s',
      '../assets/mp4/seg-11.m4s',
      '../assets/mp4/seg-12.m4s',
    ];
    let ms = new MediaSource();
    this.video.nativeElement.src = URL.createObjectURL(ms);
    let SourceOpen = () => {
      ms.removeEventListener('sourceopen', SourceOpen);
      this.MSELoadTrack(audioFragments, audioContentType, ms, 'audio', null)
        .then(function(){
          console.log('All segments downloaded');
          ms.endOfStream();
        });
    };
    ms.addEventListener('sourceopen', SourceOpen);
    this.video.nativeElement.addEventListener('canplay', function(){this.video.nativeElement.play(); } );
    */

  }



  // EME STUFF
  handleEncrypted(event) {
    let session = this.video.nativeElement.mediaKeys.createSession();
    session.addEventListener('message', (evt) => this.handleMessage(evt), false);
    session.generateRequest(event.initDataType, event.initData).catch(
      function(error) {
        console.error('Failed to generate a license request', error);
      }
    );
  }

  handleMessage(event) {
    // If you had a license server, you would make an asynchronous XMLHttpRequest
    // with event.message as the body.  The response from the server, as a
    // Uint8Array, would then be passed to session.update().
    // Instead, we will generate the license synchronously on the client, using
    // the hard-coded KEY at the top.
    let license = this.generateLicense(event.message);

    let session = event.target;
    session.update(license).catch(
      function(error) {
        console.error('Failed to update the session', error);
      }
    );
  }

  // Convert Uint8Array into base64 using base64url alphabet, without padding.
  toBase64(u8arr) {
    return btoa(String.fromCharCode.apply(null, u8arr)).
        replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
  }

  // This takes the place of a license server.
  // kids is an array of base64-encoded key IDs
  // keys is an array of base64-encoded keys
  generateLicense(message) {
    // Parse the clearkey license request.
    let request = JSON.parse(new encoding.TextDecoder().decode(message));
    // We only know one key, so there should only be one key ID.
    // A real license server could easily serve multiple keys.
    console.assert(request.kids.length === 1);

    let keyObj = {
      kty: 'oct',
      alg: 'A128KW',
      kid: request.kids[0],
      k: this.toBase64(this.KEY)
    };
    return new encoding.TextEncoder().encode(JSON.stringify({
      keys: [keyObj]
    }));
  }


  playVideogular(id: string) {
    this.playerError = null;
    if (id === '0') { this.vgDashSource = 'https://s3.amazonaws.com/_bc_dml/example-content/sintel_dash/sintel_vod.mpd'; }
    else if (id === '1') { this.vgDashSource = '../assets/mp4/Loki.mp4'; }
    else if (id === '2') { this.vgDashSource = '../assets/mp4/Loki_cenc.mpd'; }
    else if (id === '3') { this.vgDashSource = '../assets/mp4/movie_audio.mp4'; }
    else if (id === '4') { this.vgDashSource = '../assets/mp4/movie_audio_cenc.mpd'; }
    else if (id === '5') { this.vgDashSource = '../assets/mp4/example.webm'; }

  }


  // Play selected media file from right hand list
  playAudioFile(id: string): void {
    this.playerError = null;

    if (id === '1') { this.currentFile = '../assets/mp4/Loki.mp4'; }
    else if (id === '2') { this.currentFile = '../assets/mp4/Loki_cenc.mpd'; }  // dash.js player required
    else if (id === '3') { this.currentFile = '../assets/mp4/movie_audio.mp4'; }
    else if (id === '4') { this.currentFile = '../assets/mp4/movie_audio_cenc.mpd'; }
    else if (id === '5') { this.currentFile = '../assets/mp4/example.webm'; }


    // this.video.nativeElement.src = this.currentFile;
    // this.video.nativeElement.load();  // standard player load fails out here

    // this.dashplayer.attachSource(this.currentFile); // doesnt work, ugh

    // this.video.nativeElement.attachSource(this.currentFile);

    let url = this.currentFile;
    let p = new dashjs.MediaPlayerClass(); // MediaPlayerClass is not a constructor
    // let player = dashjs.MediaPlayer().create();
    // p.initialize(this.video.nativeElement, url, true);

/*
    this.video.nativeElement.addEventListener('canplay', () => {
      this.video.nativeElement.play()
      .catch(error => {
        this.playerError = 'Playback Failed! Incorrect ClearKey supplied. Please request the appropriate key and try again';
      });
    });
*/

  }


  // Mock up a Key Server function to set the KEY for the matching requested KeyID
  requestKey(keyId: string): void {


    // Loki_cenc.mpd key
    if (keyId === '121a0fca0f1b475b8910297fa8e0a07e') {
      this.KEY =  new Uint8Array([
        0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
        0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf
      ]);
      this.playAudioFile('2');
    } // movie_audio_cenc.mpd key
    else if (keyId === '69690fca0f1b475b8910297fa8e0a07e') {
      this.KEY =  new Uint8Array([
        0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf
      ]);
      this.playAudioFile('4');
    } // example.webm key
    else if (keyId === 'examplekeyid') {
      this.KEY =  new Uint8Array([
        0xeb, 0xdd, 0x62, 0xf1, 0x68, 0x14, 0xd2, 0x7b,
        0x68, 0xef, 0x12, 0x2a, 0xfc, 0xe4, 0xae, 0x3c
      ]);
      this.playAudioFile('5');
    }
    else {
      alert('keyId not found in KeyStore. KEY not changed.');
    }

    // Dictionary vlaue retreival (or storage?) doesnt seem to work right with Uint8Array objects
    // Reminder: 'key' in a dictionary is actually our key_id
    /*let dict = [];
    dict.push({ key: '121a0fca0f1b475b8910297fa8e0a07e', value: Loki_Key }); // Loki_cenc.mpd 'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf'
    dict.push({ key: '69690fca0f1b475b8910297fa8e0a07e', value: 'b0b1b2b3b4b5b6b7b8b9babbbcbdbebf' }); // movie_audio_cenc.mpd
    dict.push({ key: 'examplekeyid', value: 'ebdd62f16814d27b68ef122afce4ae3c' }); // example.webm

    // Set KEY object
    if (dict.find(d => d.key === keyId) != null) {
      this.currentKeyString = dict.find(d => d.key === keyId).value;
      this.KEY = dict.find(d => d.key === keyId).value as Uint8Array; // this.convertKeyToArray(this.currentKeyString);
    }
    else {
      alert('keyId not found in KeyStore. KEY not changed.');
    }
    */

  }


  convertKeyToArray(key: string): Uint8Array {

    if (key.length !== 32) {
      console.log('convertKey string not a valid 32 character key: ' + key);
      return; // Not a valid key, return
     }

    // Doesnt work right
     let enc = new encoding.TextEncoder('utf-16');
     let uKey = enc.encode(key);

    // Strings match, but key not working
    // let bytes = new Uint8Array(Math.ceil(key.length / 2));
    // for (let i = 0; i < bytes.length; i++) { bytes[i] = parseInt(key.substr(i * 2, 2), 16); }
    // let uKey = bytes;

    console.log('key converted from ' + key + ' to: ' + uKey);
    /*
    let uKey =  new Uint8Array([
      0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
      0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf
    ]);*/

    return uKey;
  }






/*
 * Copyright 2014, Mozilla Foundation and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

MSELoadTrack(fragments, type, mediaSource, name, progressCallback) {
  return new Promise(function(resolve, reject) {
    let sourceBuffer;
    let curFragment = 0;

    function addNextFragment() {
      console.log('adding next fragment (' + curFragment + ') for ' + name + ': mediaSource.readyState=' + mediaSource.readyState);
      if (mediaSource.readyState === 'closed') {
        return;
      }
      if (curFragment >= fragments.length) {
        console.log(name + ' addNextFragment() end of stream');
        resolve();
        // progressCallback(100);
        return;
      }

      let fragmentFile = fragments[curFragment++];

      let req = new XMLHttpRequest();
      req.open('GET', fragmentFile);
      req.responseType = 'arraybuffer';

      req.addEventListener('load', function() {
        console.log(name + ' fetch of ' + fragmentFile + ' complete, appending ');
        // progressCallback(Math.round(curFragment / fragments.length * 100));
        sourceBuffer.appendBuffer(new Uint8Array(req.response));
      });

      req.addEventListener('error', function(){console.log(name + ' error fetching ' + fragmentFile); reject(); });
      req.addEventListener('abort', function(){console.log(name + ' aborted fetching ' + fragmentFile);  reject(); });

      console.log(name + ' addNextFragment() fetching next fragment ' + fragmentFile);
      req.send(null);
    }

    sourceBuffer = mediaSource.addSourceBuffer(type);
    sourceBuffer.addEventListener('updateend', addNextFragment);
    addNextFragment();

  });
}


}


