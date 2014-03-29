'use strict';

angular
	.module('mapasColetivos.session', [
		'facebook',
		'directive.g+signin'
	])
	.config([
		'$stateProvider',
		'FacebookProvider',
		function($stateProvider, FacebookProvider) {

			$stateProvider
				.state('login', {
					url: '/login/',
					controller: 'LoginCtrl',
					templateUrl: '/views/login.html'
				});

			$stateProvider
				.state('signup', {
					url: '/signup/',
					controller: 'LoginCtrl',
					templateUrl: '/views/signup.html'
				});

			FacebookProvider.init(require('../config').oauth.facebook);

		}
	])
	.factory('SessionService', require('./sessionService'))
	.controller('LoginCtrl', require('./loginCtrl'))
	.factory('authInterceptor', [
		'$rootScope',
		'$q',
		'$window',
		function($rootScope, $q, $window) {
			return {
				request: function(config) {
					config.headers = config.headers || {};
					if ($window.sessionStorage.accessToken) {
						//config.withCredentials = true;
						config.headers.Authorization = 'Bearer ' + $window.sessionStorage.accessToken;
					}
					return config || $q.when(config);
				}
			};
		}
	])
	.config([
		'$httpProvider',
		function($httpProvider) {
			$httpProvider.interceptors.push('authInterceptor');
		}
	]);