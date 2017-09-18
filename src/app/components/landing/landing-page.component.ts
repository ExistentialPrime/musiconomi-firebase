import { Component, Input, OnInit, AfterViewInit, ViewChild, Renderer2 } from '@angular/core';
import encoding from 'text-encoding';

@Component({
  selector: 'landing-page',
  templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit, AfterViewInit {

  // Properties
  public currentFile: any;
  public currentSrc: any;
  public currentKey: string;
  public config: any;
  @ViewChild('dashplayer') video: any;  // Grab the <video> element tagged as '#dashplayer' in the front ent
  public KEY: Uint8Array;

  // Constructor
  constructor(private renderer: Renderer2) {
    /* Use Constructor only for dependency injection, do all setup in OnInit */
  }

  // Initialize the component
  ngOnInit(): void {

    // Set the unencrypted Loki track to be the first
    this.currentFile = '../assets/mp4/Loki_cenc.webm';
    this.currentKey = 'None';

    // mp4 config and key
    // Your key should be an array of bytes; a line like new Uint8Array([0x279926496a7f5d25da69f2b3b2799a7f]) incorrectly creates a single-member array. Instead, you should write it as new Uint8Array([0x27, 0x99, 0x26, 0x49, 0x6a, 0x7f, 0x5d, 0x25, 0xda, 0x69, 0xf2, 0xb3, 0xb2, 0x79, 0x9a, 0x7f]). It then still needs to be encoded to base64 format before use in the JsonWebKey.
    // My generated key: --key 1:a0a1a2a3a4a5a6a7a8a9aaabacadaeaf:0123456789abcdef --property 1:KID:121a0fca0f1b475b8910297fa8e0a07e
    this.KEY =  new Uint8Array([
      0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
      0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf
    ]);
    this.config = [{
      initDataTypes: ['cenc'],    // 'webm'
      audioCapabilities: [{
        contentType: 'audio/mp4; codecs="mp4a.40.2"'
      }],
      videoCapabilities: [{
        contentType: 'video/mp4; codecs="avc1.42E01E"'   // 'video/webm; codecs='vp8''
      }]
    }];

    // Webm config and key
    /* THIS WORKS LIKE A CHARM! */
    /*
    this.KEY =  new Uint8Array([
      0xeb, 0xdd, 0x62, 0xf1, 0x68, 0x14, 0xd2, 0x7b,
      0x68, 0xef, 0x12, 0x2a, 0xfc, 0xe4, 0xae, 0x3c
    ]);
    this.config = [{
      initDataTypes: ['webm'],
      videoCapabilities: [{
        contentType: 'video/webm; codecs='vp8''
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
      localThis.renderer.listen(localThis.video.nativeElement, e, (evt) => {
        console.log('Player Event: ' + e);
      });
    });

    this.video.nativeElement.src = this.currentFile;

    // this.video.nativeElement.addEventListener('click', this.handleEncrypted, false);

    // let vid = localThis.renderer.selectRootElement('video');

    // this.video = document.querySelector('video'); // should be handleded by viewchild above
    // this.video.addEventListener('encrypted', this.handleEncrypted, false);

    let decrypt = this.renderer.listen(this.video.nativeElement, 'encrypted', (evt) => {
      localThis.handleEncrypted(evt);
    });

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
    this.currentKey = keyObj.k;
    return new encoding.TextEncoder().encode(JSON.stringify({
      keys: [keyObj]
    }));
  }





  // Play selected media file from right hand list
  playAudioFile(id: string): void {
    if (id === '1') { this.currentFile = '../assets/mp4/Loki.mp4'; }
    else if (id === '2') { this.currentFile = '../assets/mp4/Loki_cenc.mp4'; }
    else if (id === '3') { this.currentFile = '../assets/mp4/Loki.webm'; }
    else if (id === '4') { this.currentFile = '../assets/mp4/Loki_cenc.webm'; }

    this.video.nativeElement.src = this.currentFile;
    this.video.nativeElement.play();
  }

  requestKey(): void {
    // manually set the key to the correct one to play Loki_cenc.mp4
    //  --key 1:a0a1a2a3a4a5a6a7a8a9aaabacadaeaf:0123456789abcdef --property 1:KID:121a0fca0f1b475b8910297fa8e0a07e
    this.currentKey = 'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf';
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
        //progressCallback(100);
        return;
      }

      let fragmentFile = fragments[curFragment++];

      let req = new XMLHttpRequest();
      req.open('GET', fragmentFile);
      req.responseType = 'arraybuffer';

      req.addEventListener('load', function() {
        console.log(name + " fetch of " + fragmentFile + " complete, appending");
        // progressCallback(Math.round(curFragment / fragments.length * 100));
        sourceBuffer.appendBuffer(new Uint8Array(req.response));
      });

      req.addEventListener("error", function(){console.log(name + " error fetching " + fragmentFile); reject();});
      req.addEventListener("abort", function(){console.log(name + " aborted fetching " + fragmentFile);  reject();});

      console.log(name + " addNextFragment() fetching next fragment " + fragmentFile);
      req.send(null);
    }

    sourceBuffer = mediaSource.addSourceBuffer(type);
    sourceBuffer.addEventListener('updateend', addNextFragment);
    addNextFragment();

  });
}


}


