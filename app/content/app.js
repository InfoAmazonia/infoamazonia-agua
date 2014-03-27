'use strict';

require('../common/sirTrevor');

angular
	.module('mapasColetivos.content', [
		'mapasColetivos.sirTrevor'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('singleContent', {
					url: '/content/:contentId/',
					controller: 'ContentCtrl',
					templateUrl: '/views/content/show.html'
				});

		}
	])
	.factory('Content', require('./service').Content)
	.controller('ContentCtrl', require('./controller').ContentCtrl)
	.controller('ContentEditCtrl', require('./editController').ContentEditCtrl);