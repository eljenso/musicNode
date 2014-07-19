$(document).ready(function () {
  'use strict';

  var socket = io();

  socket.on('playlistUpdate', function (playlist) {
    console.log(playlist);
  });


  $('#btn_search').click(function() {
    console.log($('#input_search').val());
  });

}()); // end strict mode