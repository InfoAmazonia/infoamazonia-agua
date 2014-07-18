'use strict';


/*
 * YBY APP
 */

angular.module('yby')

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('home.filter', {
				url: 'filter/:country/:state/:city/:textSearch/:layer/:feature/'
			})
			.state('home.content', {
				url: 'content/:contentId/',
				controller: 'IndexContentCtrl',
				resolve: {
					'SingleContent': [
						'$q',
						'Content',
						'$stateParams',
						function($q, Content, $stateParams) {

							var deferred = $q.defer();

							Content.resource.get({
								contentId: $stateParams.contentId
							}, function(res) {
								deferred.resolve(res);
							});

							return deferred.promise;

						}
					]
				}
			});

	}
]);

/*
 * YBY MAP
 */

angular.module('yby.map')

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider.state('singleMap.filter', {
			url: 'filter/:country/:state/:city/:textSearch/:layer/:feature/'
		})

	}
])

.factory('MapEmbed', require('./embed'))
.controller('MapFilterCtrl', require('./filters'))
.controller('AguaMapCtrl', require('./mapCtrl'));
