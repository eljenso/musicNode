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
    router = express.Router(),
    os = require('os'),
    Mopidy = require("mopidy").Mopidy,
    lessMiddleware = require('less-middleware');



var port = process.env.PORT || 2000;


/**
 * Setting up express
 */

// app.use(express.logger('dev'))


// telling express to use jade as view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// telling express to use stylus
app.use(lessMiddleware(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));



app.use('/', router);


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


app.listen(port);




/**
 * socket.io
 */
/*
io.sockets.on('connection', function (client) {
  console.log('somone connecting');

    
  client.on('next', function() {
    console.log('Client pressed next');
    //console.log(playlist);
  });

  client.on('search', function(data) {
    // console.log('Searching for: '+data);

    search(data, function(songs){
      songs = songs.tracks;
      if (songs.length > 0) {
        result = [];

        for (var i = 0; i < songs.length; i++) {
          //console.log('Result['+i+']: Song: '+ songs.tracks[i].artists[0].name +' - '+ songs.tracks[i].name + ' popularity: '+songs.tracks[i].popularity);
          result.push({ 'artist' : songs[i].artists[0].name,
                        'songname' : songs[i].name,
                        'href' : songs[i].href,
                        'length' : songs[i].length
                      });
        };

        client.emit('search_result', result);
      };
    });
  });

  client.on('queueAdd', function(data) {
      
  });

});
*/


/**
 * mopidy
 */

/*
var mopidy = new Mopidy({
  webSocketUrl: "ws://localhost:6680/mopidy/ws/",
  autoConnect: false
});

var consoleError = console.error.bind(console);

var queueAndPlayFirstPlaylist = function () {

  mopidy.playlists.getPlaylists().then(function (playlists) {

    for (var i = playlists.length - 1; i >= 0; i--) {
      if (playlists[i].name == "Einweihung by 1137038251") {
        playlist = playlists[i]
      };
    };
    console.log("Loading playlist:", playlist.name);
    //console.log(playlist.tracks[0]);

    mopidy.tracklist.add(playlist.tracks).then(function (tlTracks) {
      console.log(tlTracks[81]);
      mopidy.playback.play(tlTracks[81]).then(function () {}, consoleError);
      console.log('lookup: '+mopidy.library.search({'artist': ['foo']}).artists);
      console.log('tracklist_position: '+mopidy.tracklist_position);
    }, consoleError);
  }, consoleError);
};



mopidy.connect();
mopidy.on("state:online", queueAndPlayFirstPlaylist);

for(var k in mopidy.emit) {console.log(k);}
*/