'use strict';

module.exports = [
	'$scope',
	'SessionService',
	'$location',
	'config',
	'$sce',
	'Facebook',
	function($scope, Session, $location, config, $sce, Facebook) {

		// $scope.authFacebook = $sce.trustAsResourceUrl(config.server + '/auth/facebook');
		// $scope.authGoogle = $sce.trustAsResourceUrl(config.server + '/auth/google');

		// $scope.local = window.location.href;

		$scope.$session = Session;

		$scope.$watch('$session.authenticated()', function(auth) {
			$scope.isAuthenticated = auth;
		});

		$scope.$watch(function() {
			return Facebook.isReady();
		}, function(ready) {
			$scope.facebookReady = ready;
		});

		var login = function(response) {

			if(response.status == 'connected') {

				Session.tokenAuth(response.authResponse.accessToken, 'facebook', function(data) {
					$location.path('/dashboard');
				});

			}
		}

		$scope.login = function(provider) {

			if(provider == 'facebook') {

				Facebook.getLoginStatus(function(response) {

					if(response.status == 'connected') {

						login(response);

					} else {

						Facebook.login(function(response) {

							login(response);

						}, {scope: 'email'});

					}

				});

			} else if(provider == 'google') {



			} else {

				Session.authenticate($scope.credentials, function(data) {
					$location.path('/dashboard');
				});

			}

		};

		$scope.logout = Session.logout;

	}
];