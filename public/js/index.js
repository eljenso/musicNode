$(function () {
  'use strict';


  var create_resultList = function (results) {
    $('#results').empty();

    for (var i = 0; i < results.length; i++) {
      var thumb = document.createElement('div');
      thumb = $(thumb);
      thumb.addClass('row thumbnail');
      thumb.attr('data-uri', results[i].uri);

      var div_info = document.createElement('div');
      div_info = $(div_info);
      div_info.addClass('col-md-8');
      div_info.text(results[i].artist + ' - ' + results[i].name);
      thumb.append(div_info);

      $('#results').append(thumb);
    }
  };


  var fill_playlistTable = function (tracks) {
    var tbl_playlist = $('#table_playlist');
    tbl_playlist.empty();
    for (var i = 0; i < tracks.length; i++) {
      var row = document.createElement('tr');
      row = $(row);
      var playingCell= document.createElement('td');
      playingCell = $(playingCell);
      var songCell = document.createElement('td');
      songCell = $(songCell);

      if (i === 0) {
        playingCell.html('<span class="glyphicon glyphicon-play"></span>');
      };

      songCell.text(tracks[i].artist + ' - ' + tracks[i].name);
      row.append([playingCell, songCell]);
      tbl_playlist.append(row);
    }
  };




  /**
   * socket.io
   */

  var socket = io();

  socket.on('playlistUpdate', function (playlist) {
    console.log(playlist);
    fill_playlistTable(playlist);
  });


  socket.on('searchResults', function (results) {
    console.log(results);
    create_resultList(results);
  });




  /**
   * DOM event handlers
   */

  $('#input_search').change(function() {
    socket.emit('search', $('#input_search').val());
  });


}()); // end strict mode