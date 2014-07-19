

(function () {
  'use strict';

  var $search_music = $( '#search' ).selectize({
    openOnFocus: false,
    options: [],
    render: {
      /*
      item: function(item, escape) {
        return;
      },
      option: function(item, escape) {
        return;
      },
      */
      score: function(search) {},
      load: function(query, callback) {}
    }
  });
  // search_music = $search_music[0].selectize;


}()); // end strict mode