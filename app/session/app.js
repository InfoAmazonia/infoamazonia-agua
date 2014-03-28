'use strict';

angular
	.module('mapasColetivos.session', [
		'facebook'
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
						config.headers.Authorization = 'Bearer ' + $window.sessionStorage.accessToken;
					}
					return config;
				},
				responseError: function(rejection) {
					if (rejection.status === 401) {
						// handle the case where the user is not authenticated
					}
					return $q.reject(rejection);
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