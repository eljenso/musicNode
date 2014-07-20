/**!
 * musicNode
 *
 * Copyright(c) 2014 Jens Böttcher <eljenso.boettcher@gmail.com
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


/**
 * Importing settings
 */
var config = require('./lib/config');




/**
 * Setting up express
 */

// Telling express to use jade as view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Telling express to use less
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

// Send the current queue to the given client (or broadcast to all if no client is given)
var broadcastCurrentPlaylist = function (client) {
  if (mopidy.tracklist && mopidy.playback) {
    var indexCurrentTrack = 0;
    mopidy.playback.getCurrentTlTrack()
      .then(function (currentTrack) {
        return mopidy.tracklist.index(currentTrack);
      })
      .then(function (index) {
        indexCurrentTrack = index;
        return mopidy.tracklist.getTlTracks();
      })
      .then(function (tlTracks) {
        return prepareTracks(tlTracks);
      })
      .then(function (preparedTracks) {
        var message = {
          tracks: preparedTracks,
          currentPosition: indexCurrentTrack
        };

        if (client) {
          client.emit('playlistUpdate',message);
        } else {
          io.emit('playlistUpdate',message);
        }
      })
      .catch(function (error) {
        console.log(error);
      }).done();
  }
}


io.sockets.on('connection', function (client) {
  client.justVoted = false;

  // Send new client the current queue
  broadcastCurrentPlaylist(client);

  // Client requested a search
  client.on('search', function (query) {
    console.log('Searching for: '+query);

    mopidySearch(query)
      .then(function (results) {
        client.emit('searchResults', results);
      })
      .catch(function (error) {
        console.log(error);
      }).done();

  });

  // Client added a song to the queue
  client.on('addSong',function (songURI) {
    console.log('Adding songURI '+songURI);

    mopidy.library.lookup(songURI)
      .then(function (track) {
        return mopidy.tracklist.add(track, 1+songsAdded);
      })
      .then(function (track) {
        songsAdded++;
      })
      .catch(function (error) {
        console.log(error);
      }).done();
  });

  // Client made an upvote for a song
  client.on('upVote', function (trackPosition) {
    if (!client.justVoted) {
      client.justVoted = true;
      mopidy.tracklist.move(parseInt(trackPosition, 10),parseInt(trackPosition, 10),(parseInt(trackPosition, 10)-1));
      setTimeout(function () {
        client.justVoted = false;
      }, 5*1000);
    }
  });

  // Client made an downvote for a song
  client.on('downVote', function (trackPosition) {
    if (!client.justVoted) {
      client.justVoted = true;

      mopidy.tracklist.move(parseInt(trackPosition, 10),parseInt(trackPosition, 10),(parseInt(trackPosition, 10)+1));

      setTimeout(function () {
        client.justVoted = false;
      }, 5*1000);
    };
  });

});



/**
 * Mopidy
 */

// init mopidy
var mopidy = new Mopidy({
  webSocketUrl: config.mopidy.adress,
  autoConnect: false,
  callingConvention: 'by-position-only'
});


// Songs added by clients so far
var songsAdded = 0;


// Convert a list of tracks into a client-readable format (and shorten be length, if given)
var prepareTracks = function (tracks, length) {
  var deferred = Q.defer();

  var preparedTracks = [];

  var returnLength = length;
  if (!returnLength || returnLength > tracks.length-1) {
    returnLength = tracks.length-1;
  };

  for (var i = 0; i <= returnLength; i++) {
    var currentTrack = tracks[i];

    if (currentTrack.__model__ === "TlTrack") {
      currentTrack = currentTrack.track;
    };

    var track = {
      name: currentTrack.name,
      artist: currentTrack.artists[0].name,
      album: currentTrack.album.name,
      albumURI: currentTrack.album.uri,
      year: currentTrack.date,
      uri: currentTrack.uri
    };

    preparedTracks.push(track);

    if (i === returnLength) {
      deferred.resolve(preparedTracks);
    };
  };

  return deferred.promise;
};


// Search the library using the query
var mopidySearch = function (query) {
  var deferred = Q.defer();

  mopidy.library.search({'any' : [query]})
    .then(function (results) {
      return prepareTracks(results[1].tracks, 5);
    })
    .then(function (preparedResults) {
      deferred.resolve(preparedResults);
    })
    .catch(function (error) {
      deferred.reject(error);
    }).done();

  return deferred.promise;
};


// Start a playlist
var queueAndPlayPlaylist = function (playlistName) {
  var deferred = Q.defer();

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
              deferred.resolve();
            })
            .catch(function (error) {
              console.log(error);
              deferred.reject();
            }).done();
          
        }
      }
  });

  return deferred.promise;
};



// Mopidy event handlers

mopidy.on('state:online', function () {
  queueAndPlayPlaylist(config.mopidy.defaultPlaylist)
    .then(function () {
      broadcastCurrentPlaylist();
    })
    .catch(function (error) {
      console.log(error);
    }).done();
});

mopidy.on('event:tracklistChanged', function () {
  broadcastCurrentPlaylist();
});

mopidy.on('event:trackPlaybackStarted', function () {
  broadcastCurrentPlaylist();
});




/**
 * Connection to mopidy and starting up express
 */

mopidy.connect();
http.listen(config.main.port, function () {
  console.log('Server listening on port '+config.main.port);
});