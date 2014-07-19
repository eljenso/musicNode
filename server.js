/** 
 * @Author: Jens Böttcher
 * @Date:   2014-07-19 12:20:04
 * @Last Modified by:   Jens Böttcher
 * @Last Modified time: 2014-07-19 15:25:26
 */


/**
 * Module dependencies
 */
var express = require('express'),
    app = express(),
    http = require('http').Server(app);
    io = require('socket.io')(http),
    lessMiddleware = require('less-middleware'),
    Mopidy = require("mopidy"),
    Q = require('q');


var port = process.env.PORT || 2000;


/**
 * Setting up express
 */


// telling express to use jade as view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// telling express to use stylus
app.use(lessMiddleware(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));


/**
 * Routing
 */

// Home
app.get('/', function (req, res) {
  res.render('index',
    {  
      'title' : 'Home',
      'website' : 'musicNode',
      'user' : req.user
    }
  )
});


/**
 * socket.io
 */

io.sockets.on('connection', function (client) {
  console.log('somone connecting');

  setTimeout(function () {
    client.emit('playlistUpdate', 'hello');
  },1000*10);

  mopidy.tracklist.getTlTracks()
    .then(function (tlTracks) {
      client.emit('playlistUpdate',tlTracks)
    })
    .catch(function (error) {
      console.log(error);
    }).done();

  client.on('search', function (query, field) {
    console.log('Searching for: '+query+' in field '+field);

    mopidySearch(query, field)
      .then(function (results) {
        client.emit('searchResults', results);
      })
      .catch(function (error) {
        console.log(error);
      }).done();

  });

  client.on('addingSong',function (song) {
    // body...
  });

  client.on('vote', function (vote) {
    
  });
});



/**
 * Mopidy
 */

// Functions

var mopidySearch = function (query) {
  var deferred = Q.defer();

  mopidy.library.search({'any' : [query]})
    .then(function (results) {
      deferred.resolve(results[1]);
    });

  return deferred.promise;
};

var trackDesc = function (track) {
  return track.name + " by " + track.artists[0].name +
    " from " + track.album.name;
};


var queueAndPlayPlaylist = function (playlistName) {
  mopidy.playlists.getPlaylists()
    .then(function (playlists) {
      for (var i = 0; i < playlists.length; i++) {
        if(playlists[i].name.toLowerCase().indexOf(playlistName.toLowerCase()) > -1) {
          var tracks = playlists[i].tracks;
          mopidy.tracklist.clear()
            .then(function () {
              return mopidy.tracklist.add(tracks);
            })
            .then(function () {
              return mopidy.tracklist.shuffle();
            })
            .then(function () {
              return mopidy.tracklist.getTlTracks();
            })
            .then(function (tlTracks) {
              return mopidy.playback.play(tlTracks[0]);
            })
            .then(function () {
              return mopidy.playback.getCurrentTrack();
            })
            .then(function (track) {
                  console.log("Now playing:", trackDesc(track));
            })
            .catch(function (error) {
              console.log(error);
            }).done();
          io.emit('playlistUpdate', playlists[i].tracks);
        }
      }
  });
};




//  Settings

var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws/",
  autoConnect: false
});


mopidy.on("state:online", function () {
  queueAndPlayPlaylist('einweihung');
});





mopidy.connect();

http.listen(port, function () {
  console.log('Server listening on port '+port);
});