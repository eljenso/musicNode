/**
 * Copyright(c) 2014 Jens Böttcher <eljenso.boettcher@gmail.com
 */


$(function () {
  'use strict';

  // Formating a desirable HTML string for a track
  var trackToHTML = function (track) {
    return track.name+'   ' + '<small class="text-muted"> by ' +track.artist+'</small>';
  };


  // Display received search results in #table_searchResults
  var create_searchResultList = function (results) {
    $('#table_searchResults').empty();

    for (var i = 0; i < results.length; i++) {
      var row = document.createElement('tr');
      row = $(row);


      var cellInfo = document.createElement('td');
      cellInfo = $(cellInfo);

      var songInfo = document.createElement('p');
      songInfo = $(songInfo);
      var songMarkup = trackToHTML(results[i]);
      songInfo.html(songMarkup);

      cellInfo.append([songInfo]);
      

      var cellBtn = document.createElement('td');
      cellBtn = $(cellBtn);
      cellBtn.addClass('btnCell');
      var btn_addSong = document.createElement('button');
      btn_addSong = $(btn_addSong);
      btn_addSong.addClass('btn btn-default btn-addSong');
      btn_addSong.html('<span class="glyphicon glyphicon-plus"></span>');
      btn_addSong.attr('data-uri', results[i].uri);
      cellBtn.append(btn_addSong);

      row.append(cellInfo);
      row.append(cellBtn);

      $('#table_searchResults').append(row);
    }

    $('.btn-addSong').click(function() {
      socket.emit('addSong', $(this).attr('data-uri'));
      $('#input_search').val('');
      $('#table_searchResults').empty();
      document.location = '/#top';
    });
  };


  // Display current queue in #table_playlist
  var fill_playlistTable = function (tracks, currentPosition) {
    var tbl_playlist = $('#table_playlist');
    tbl_playlist.empty();

    var amountPreviousSongs = 3;
    if (currentPosition < 3) {
      amountPreviousSongs = currentPosition;
    };

    var playlistLength = 15 + amountPreviousSongs;
    if (playlistLength > tracks.length-1) {
      playlistLength = tracks.length-1
    } else {
      playlistLength = currentPosition+playlistLength;
    }

    for (var i = currentPosition - amountPreviousSongs; i <= playlistLength; i++) {
      var row = document.createElement('tr');
      row = $(row);
      var playingCell= document.createElement('td');
      playingCell = $(playingCell);
      var songCell = document.createElement('td');
      songCell = $(songCell);

      var btnCell = document.createElement('td');
      btnCell = $(btnCell);
      btnCell.addClass('btnCell');
      btnCell.attr('data-trackPosition', i);
      

      // Making current track visible
      if (i < currentPosition) {
        row.addClass('previous');
      } else if (i === currentPosition) {
        row.addClass('active');
        row.addClass('current');
        playingCell.html('<span class="glyphicon glyphicon-play"></span>');

      } else if (i < tracks.length-1) {
        var btn_voteDown = document.createElement('button');
        btn_voteDown = $(btn_voteDown);
        btn_voteDown.addClass('btn btn-default btn-sm btn_downVote');
        btn_voteDown.html('<span class="glyphicon glyphicon-chevron-down"></span>');
        btnCell.append(btn_voteDown);
      }

      songCell.html(trackToHTML(tracks[i]));
      row.append([playingCell, songCell,btnCell]);

      // Add user color
      if (tracks[i].color && !row.hasClass('previous')) {
        row.removeClass('active');
        row.css('background-color', tracks[i].color);
      }

      tbl_playlist.append(row);
    }

    var lastCell = $(document.createElement('td')).text('more songs to come').css('text-align', 'center').addClass('text-muted');
    var lastRow = $(document.createElement('tr')).append([$(document.createElement('td')),lastCell,$(document.createElement('td'))]);

    tbl_playlist.append(lastRow);


    $('.btn_downVote').click(function() {
      $(this).blur();
      socket.emit('downVote', $(this).closest('td').attr('data-trackPosition'))
    });
  };



  /**
   * socket.io
   */

  var socket = io();

  socket.on('playlistUpdate', function (message) {
    fill_playlistTable(message.tracks, message.currentPosition);
  });

  socket.on('searchResults', function (results) {
    create_searchResultList(results);
  });




  /**
   * DOM event handlers
   */

  $('#input_search').keyup(function(e) {
    if (e.keyCode == 13) {
      if($('#input_search').val()) {
        socket.emit('search', $('#input_search').val());
      }
    }
  });
  $('#btn_search').click(function(event) {
    if($('#input_search').val()) {
      $(this).blur();
      socket.emit('search', $('#input_search').val());
    }
  });


}()); // end strict mode