/** 
 * @Author: Jens Böttcher
 * @Date:   2014-07-19 12:20:04
 * @Last Modified by:   Jens Böttcher
 * @Last Modified time: 2014-07-20 12:09:23
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


// telling express to use less
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

  broadcastCurrentPlaylist(client);

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

  client.on('upVote', function (trackPosition) {
    if (!client.justVoted) {
      client.justVoted = true;

      mopidy.tracklist.move(parseInt(trackPosition, 10),parseInt(trackPosition, 10),(parseInt(trackPosition, 10)-1));

      setTimeout(function () {
        client.justVoted = false;
      }, 5*1000);
    }
  });

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

var mopidy = new Mopidy({
  webSocketUrl: "ws://127.0.0.1:6680/mopidy/ws/",
  autoConnect: false
});


var songsAdded = 0;


// Functions

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

var trackDesc = function (track) {
  return track.name + " by " + track.artists[0].name +
    " from " + track.album.name;
};


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




//  Settings



mopidy.on('state:online', function () {
  queueAndPlayPlaylist('starred')
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





mopidy.connect();

http.listen(port, function () {
  console.log('Server listening on port '+port);
});