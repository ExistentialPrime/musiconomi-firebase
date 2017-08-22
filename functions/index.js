// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database. 
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


// Enable GoogleCloud Debugging 
//require('@google-cloud/debug-agent').start({ allowExpressions: true });

// Enable CORS
const cors = require('cors')({origin: true});


// The addMessage() function is an HTTP endpoint. Any request to the endpoint results in ExpressJS-style Request and Response objects passed to the onRequest() callback.
// HTTP functions are synchronous, so you should send a response as quickly as possible and defer work using the Realtime Database. 
//-----------------------------------------------------------------------------------
// Take the text parameter passed to this HTTP endpoint and insert it into the Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into the Realtime Database using the Firebase Admin SDK.
  admin.database().ref('/messages').push({original: original}).then(snapshot => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref);
  });
});


// Listens for new messages added to /messages/:pushId/original and creates an uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database. Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
    });


// Take the text parameter passed to this HTTP endpoint and insert it into the Realtime Database under the path /tracks/username/:pushId/trackName
exports.addTrack = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // Debug output:
    console.log("Debugging: Req.body: " + req.body );
    console.log("ID: " + req.body.id);
    console.log("Title: " + req.body.title);
    console.log("Artist: " + req.body.artist);
    console.log("AudioUrl: " + req.body.audioUrl);
    
    // Grab the text parameter.
    let trackId = req.body.id;
    let trackTitle = req.body.title;
    let trackUrl = req.body.audioUrl;
    let artist = req.body.artist;
    
    // Validation Here if desired
    // If missing a param
    // Then res.send("error, missing xyz")

    let track = {
      id : trackId,
      title : trackTitle,
      audioUrl : trackUrl,
      artist: artist
    };

    // Debug output:
    console.log("Debugging: Track: " + track);
    console.log("Id: " + track.id);
    console.log("Title: " + track.title);
    console.log("Artist: " + track.artist);
    console.log("AudioUrl: " + track.audioUrl);

    // Push the new message into the Realtime Database using the Firebase Admin SDK
    // NOTE: We cant just Json.stringify the whole object and send it in, we have to manually map it here, ugh
    admin.database().ref('/tracks/' + artist).push({id: track.id, title: track.title, audioUrl: track.audioUrl, artist: track.artist})
      .then(result => {
          res.send('<h4>Track Added Successfully:</h4><p>Result Object: ' + result + "</p><p>Dev Note: track title is '" + track.title + "'</p>");
      }
    );
  });
});

// Dev note: testing JSON:
// {"id" : "1", "title" : "A Cool Song", "url" : "audiourlhere", "artist" : "CryptoPete"}