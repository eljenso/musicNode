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


// List of colors
var colorList = [ '#80CCE6', '#99EBFF', '#99FFEB', '#99FF99', '#99D6AD',
                  '#C2C2B2', '#F0E0B2', '#EBC299', '#FFCCB2', '#FFFFB2',
                  '#FFC2C2', '#FFFFC2', '#F7E7CE', '#E6B2CC', '#9999FF'];

// Send the current queue to the given client (or broadcast to all if no client is given)
var broadcastCurrentPlaylist = function (client) {
  if (mopidy.tracklist && mopidy.playback) {
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

var someoneJust = {
  'voted': false,
  'added': false
};

io.sockets.on('connection', function (client) {

  client.justVoted = false;
  client.color = colorList.shift();


  // Send new client the current queue
  broadcastCurrentPlaylist(client);


  // Client requested a search
  client.on('search', function (query) {
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
        songsAdded[songURI.split(':')[2]] = { color: client.color};
        return mopidy.tracklist.add(track, 1+amountSongsAdded+indexCurrentTrack);
      })
      .then(function (track) {
        amountSongsAdded++;
      })
      .catch(function (error) {
        console.log(error);
      }).done();
  });


  // Client made an downvote for a song
  client.on('downVote', function (trackPosition) {
    if (!client.justVoted && !someoneJust.voted) {
      client.justVoted = true;
      someoneJust.voted= true;

      mopidy.tracklist.move(parseInt(trackPosition, 10),parseInt(trackPosition, 10),(parseInt(trackPosition, 10)+1));

      setTimeout(function () {
        client.justVoted = false;
      }, 5*1000);

      setTimeout(function () {
        someoneJust.voted = false;
      }, 1*1000);


    };
  });


  // Add the clients color back to the list of unused colors on disconnect
  client.on('disconnect', function() {
    colorList.push(client.color);
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
var songsAdded = {};
var amountSongsAdded = 0;
var indexCurrentTrack = 0;


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
      year: currentTrack.date,
      uri: currentTrack.uri,
      color: (songsAdded[currentTrack.uri.split(':')[2]] ? songsAdded[currentTrack.uri.split(':')[2]].color : '')
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
      for (var i = 0; i < results.length; i++) {
        if (results[i].uri.indexOf('spotify') > -1) {
          return prepareTracks(results[i].tracks, 5);
        }
      };
      
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
  if (amountSongsAdded < 1) {
    amountSongsAdded = 0;
  } else {
    amountSongsAdded--;
  }
});




/**
 * Connection to mopidy and starting up express
 */

mopidy.connect();
http.listen(config.main.port, function () {
  console.log('Visit page at http://localhost:'+config.main.port);
});