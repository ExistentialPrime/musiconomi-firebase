import { Component, Input, OnInit, AfterViewInit, ViewChild, Renderer2 } from '@angular/core';
import encoding from 'text-encoding';
import swal from 'sweetalert2';

// Shaka
import shaka from 'shaka-player';




@Component({
  selector: 'landing-page',
  templateUrl: './landing-page.component.html'
})
export class LandingPageComponent implements OnInit, AfterViewInit {

  // Properties
  public currentFile: any;
  @ViewChild('shakaplayer') video: any;  // Grab the <video> element tagged as '#dashplayer' in the front end
  public playerError: string;
  public player: shaka.Player;

  // Constructor
  constructor(private renderer: Renderer2) {
    /* Use Constructor only for dependency injection, do all setup in OnInit */
  }


  // Initialize the component
  ngOnInit(): void {
    // this.currentFile = '../assets/mp4/Loki_cenc.mpd';
    // this.currentFile = 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd'; // example DASH video
    this.currentFile = 'Please Select a Track on the right to start play.';
  }

    // EME Stuff to fire after the dom is initialized
  ngAfterViewInit(): void {

    // Log events dispatched to make debugging easier...
    let evts =  [ 'canplay', 'canplaythrough', 'encrypted', 'ended', 'error', 'loadeddata',
      'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress',
      'stalled', 'suspend', 'waiting', ];
    evts.forEach(e => {
      this.renderer.listen(this.video.nativeElement, e, (event) => {
        console.log('Player Event: ' + e);
        if (e === 'error') {
          // Chrome 60+ error message (firefox is different. See https://stackoverflow.com/questions/5573461/html5-video-error-handling)
          if (event.path && event.path[0]) {
            console.log('error message: ' + event.path[0].error.message);
          }
        }
      });
    });


    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
      // Everything looks good!
      this.initPlayer();
    } else {
      // This browser does not have the minimum set of APIs we need.
      console.error('Browser not supported!');
    }

    /* Not needed for SHAKA ClearKey implementation
    // Create the MediaKeys object for decryption handling
    navigator.requestMediaKeySystemAccess('org.w3.clearkey', this.config).then(
      function(keySystemAccess) {
        return keySystemAccess.createMediaKeys();
      }
    ).then(createdMediaKeys => {
        console.log('created MediaKeys object ok: ' + createdMediaKeys);
        return this.video.nativeElement.setMediaKeys(createdMediaKeys);
      }
    ).catch(error => {
        console.error('Failed to set up MediaKeys', error);
      }
    );*/

  }


  // ----------------------------------------------------------------------------------------------
  // Initialize Shaka Player
  // API Documentation: https://shaka-player-demo.appspot.com/docs/api/shaka.Player.html
  // DRM Documenation: https://shaka-player-demo.appspot.com/docs/api/tutorial-drm-config.html
  // ----------------------------------------------------------------------------------------------
  initPlayer() {
    // Create a Player instance.
    this.player = new shaka.Player(this.video.nativeElement);

    // Set clearkey decryption for demo purposes
    this.player.configure({
      drm: {
        clearKeys: {
          '121a0fca0f1b475b8910297fa8e0a07e': 'a0a1a2a3a4a5a6a7a8a9aaabacadaeaf',  // Loki and Nebula keys
          '69690fca0f1b475b8910297fa8e0a07e': 'b0b1b2b3b4b5b6b7b8b9babbbcbdbebf'   // Movie_audio-cenc key
        }
        /*servers: {
          'com.widevine.alpha': 'https://foo.bar/drm/widevine',       // Widevine works with Chrome and Firefox
          'com.microsoft.playready': 'https://foo.bar/drm/playready'  // Playready works on IE, Edge, and Windows phone
          // Fairplay needed for IOS and Safari and AppleTv  -- FAIRPLAY not implemented for Shaka yet, but its on their roadmap (or support for HLS)
        }*/
      }
    });

    // Listen for error events.
    let errorListener = this.renderer.listen(this.player, 'error', (evt) => {
      console.log('Error with shaka: ' + evt.detail);
    });

    // Add the 'encrypted' listener event
    let decrypt = this.renderer.listen(this.player.getMediaElement(), 'encrypted', (evt) => {
      // this.handleEncrypted(evt); // Not needed for basic SHAKA clear key configuration
    });

  }


  // Play an .mpd file with Shaka Player
  playShaka(id: string) {
    this.playerError = null;
    this.player.unload();
    if (id === '0') { this.currentFile = 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd';  }
    else if (id === '1') { this.currentFile = '../assets/mp4/Loki_cenc.mpd'; /*this.requestKey('121a0fca0f1b475b8910297fa8e0a07e');*/ }
    else if (id === '2') { this.currentFile = '../assets/mp4/Nebula.mpd'; /*this.requestKey('121a0fca0f1b475b8910297fa8e0a07e');*/ }
    else if (id === '3') { this.currentFile = '../assets/mp4/movie_audio_cenc.mpd'; /*this.requestKey('69690fca0f1b475b8910297fa8e0a07e');*/ }

    this.player.load(this.currentFile).then(results => {
      // This runs if the asynchronous load is successful.
      console.log('The video has now been loaded!');
      // Autoplay is enabled on the player, so the video should auto-start now
    }).catch(err => {
      console.log('error loading video: ' + err);
      this.playerError = 'Error loading video: ' + err;
   });

  }



/* Not needed for SHAKA clearkey implementation

  // EME KEY LICENSING
  // ------------------------------------------------------------------------------
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




  // Mock up a Key Server function to set the KEY for the matching requested KeyID
  requestKey(keyId: string): void {

    // Loki_cenc.mpd key
    if (keyId === '121a0fca0f1b475b8910297fa8e0a07e') {
      this.KEY =  new Uint8Array([
        0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
        0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf
      ]);
    } // movie_audio_cenc.mpd key
    else if (keyId === '69690fca0f1b475b8910297fa8e0a07e') {
      this.KEY =  new Uint8Array([
        0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf
      ]);
    } // example.webm key
    else {
      alert('keyId not found in KeyStore. KEY not changed.');
    }

  }
*/


}


