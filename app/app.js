'use strict';

/*
 * Helpers
 */
require('./helpers');

/*
 * Core modules
 */

require('./core/title');
require('./core/index');
require('./core/loading');
require('./core/message');
require('./core/explore');
require('./core/dashboard');

/*
 * Common modules
 */

require('./common/leaflet');
require('./common/directives');
require('./common/mapView');

/*
 * Apps
 */

require('./pages/app');
require('./session/app');
require('./user/app');
require('./import/app');
require('./feature/app');
require('./content/app');
require('./layer/app');
require('./map/app');

var settings = angular.extend({
	server: 'local',
	apiPrefix: '/api/v1'
}, require('./config'));

/*
 * App
 */
angular.module('mapasColetivos', [
	'ngCookies',
	'pascalprecht.translate',
	'ui.router',
	'ui.keypress',
	'ui.slider',
	'monospaced.elastic',
	'ngAnimate',
	'infinite-scroll',
	'colorpicker.module',
	'iaRios.pages',
	'mapasColetivos.mapView',
	'mapasColetivos.user',
	'mapasColetivos.pageTitle',
	'mapasColetivos.directives',
	'mapasColetivos.session',
	'mapasColetivos.index',
	'mapasColetivos.dashboard',
	'mapasColetivos.explore',
	'mapasColetivos.loadingStatus',
	'mapasColetivos.messageStatus',
	'mapasColetivos.dataImport',
	'mapasColetivos.map',
	'mapasColetivos.layer',
	'mapasColetivos.feature',
	'mapasColetivos.content'
])
.value('config', settings)
.value('apiPrefix', (settings.server == 'local' ? '' : settings.server) + settings.apiPrefix)

/*
 * Translation
 */

.config(require('./core/i18n').config)
.factory('i18n.RequestInterceptor', require('./core/i18n').RequestInterceptor)
.controller('TranslateCtrl', [
	'$scope',
	'$translate',
	function($scope, $translate) {

		$scope.changeLanguage = function(key) {
			$translate.use(key);
		}

	}
])

/*
 * Core routes
 */

.config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		if(settings.server !== 'local') {
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common['X-Requested-With'];
		}

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'IndexCtrl',
				templateUrl: '/views/landing.html',
				resolve: {
					'MapData': [
						'$q',
						'Map',
						function($q, Map) {

							var deferred = $q.defer();

							Map.resource.query({
								perPage: 4
							}, function(res) {

								deferred.resolve(res.maps);

							});

							return deferred.promise;

						}
					],
					'ContentData': [
						'$q',
						'Content',
						function($q, Content) {

							var deferred = $q.defer();

							Content.resource.query({
								perPage: 4
							}, function(res) {

								deferred.resolve(res.contents);

							});

							return deferred.promise;

						}
					]
				}
			})
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

		$locationProvider.html5Mode(true);

		/*
		 * Trailing slash rule
		 */
		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				search = $location.search(),
				params;

			// check to see if the path already ends in '/'
			if (path[path.length - 1] === '/') {
				return;
			}

			// If there was no search string / query params, return with a `/`
			if (Object.keys(search).length === 0) {
				return path + '/';
			}

			// Otherwise build the search string and return a `/?` prefix
			params = [];
			angular.forEach(search, function(v, k){
				params.push(k + '=' + v);
			});
			
			return path + '/?' + params.join('&');
		});

	}
])

.run([
	'$rootScope',
	'$location',
	function($rootScope, $location) {

		/*
		 * Store nav history
		 */
		window.mcHistory = [];
		$rootScope.$on('$stateChangeSuccess', function() {
			if(window._gaq) {
				window._gaq.push(['_trackPageview', $location.path()]);
			}
			window.mcHistory.push(window.location.pathname);
		});

	}
])

.controller('PageCtrl', [
	'$scope',
	'Page',
	function($scope, Page) {
		// Page title
		$scope.page = Page;
		// Detect iframe
		if(window !== window.top) {
			$scope.embedded = true;
		}
	}
]);