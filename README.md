musicNode
=========
A simple queue manager for mopidy, suitable for parties.

## Features ###

* Simple UI, narrowed down to searching and queueing
* Users can up- and downvote songs
* Users can not delete or skip tracks


## Requirements ###

* [Mopidy](http://www.mopidy.com/) with HTTP API and Spotify enabled
  * Make sure you configured everything correctly (e.g. with [ncmpcpp](http://ncmpcpp.rybczak.net/))
* [node.js](http://nodejs.org/)

Currently only support for Spotify can be guaranteed.


## How to install ###

1. `npm install --production`
2. `node server.js` or `PORT=1337 node server.js`


## Configuration ##
Configuration is done in [config.js](lib/config.js).

=========

### Built with ###
* node
* express
* socket.io
* jade
* less
* bootstrap


### License ###

[GPL v2](LICENSE)
