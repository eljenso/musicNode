musicNode
=========
A simple queue manager for mopidy, suitable for parties.

## Features ###

* Simple UI, narrowed down to searching and queueing
* Users can up- and downvote songs
* Users can not delete or skip tracks


## Requirements ###

* [Mopidy](http://www.mopidy.com/) with HTTP API enabled
* [node.js](http://nodejs.org/)
* [Grunt](http://gruntjs.com/)

Currently only support for Spotify can be guaranteed.


## How to install ###

1. `npm install`
2. `grunt`


## Configuration ##
Configuration is done in [settings.js](lib/settings.js).


### Built with ###
* node
* express
* socket.io
* jade
* less
* bootstrap


### License ###

[GPL v2](LICENSE)
