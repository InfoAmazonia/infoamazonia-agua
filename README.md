# InfoAmazonia Agua
This is the front-end client of InfoAmazonia Água. It is a [YBY Client](http://github.com/oeco/yby-client) theme application that connects to a [YBY](http://github.com/oeco/yby) server.

## Installation

 - Run a [YBY server](http://github.com/oeco/yby);
 - Clone and install a [YBY client](http://github.com/oeco/yby-client) following it's installation process;
 - Clone this repository inside a directory called `themes`, on your yby client root;
 - Add this properties to your config.js 
```
   	theme: 'infoamazonia-agua',
	pages: [
		{
			path: '/about/',
			template: '/views/pages/about.html',
			title: 'Sobre'
		}
	]
```
 - Run `grunt` again and start the server.
