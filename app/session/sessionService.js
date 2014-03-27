'use strict';

module.exports = [
	'$window',
	'$q',
	'$http',
	'$rootScope',
	'$location',
	'apiPrefix',
	'config',
	function($window, $q, $http, $rootScope, $location, apiPrefix, config) {

		var login = function(data, callback) {

			for(var key in data) {
				$window.sessionStorage[key] = data[key];
			}
			$rootScope.$broadcast('session.logged.in');
			if(typeof callback === 'function')
				callback(data);

		};

		return {
			authenticate: function(credentials, callback) {
				$http
					.post(apiPrefix + '/users/session', credentials)
					.success(function(data, status, headers, config) {
						login(data, callback);
					});
			},
			tokenAuth: function(token, provider, callback) {
				$http
					.post(apiPrefix + '/access_token/' + provider, {'access_token': token})
					.success(function(data, status, headers, config) {
						login(data, callback);
					});
			},
			logout: function() {
				for(var key in $window.sessionStorage) {
					delete $window.sessionStorage[key];
				}
				$location.path('/login/');
			},
			authenticated: function() {
				return !! $window.sessionStorage.accessToken;
			},
			user: function() {
				return $window.sessionStorage;
			}
		};
	}
];