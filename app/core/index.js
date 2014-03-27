'use strict';

angular.module('mapasColetivos.index', [])

.controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	'Map',
	function($scope, Session, $location, Map) {

		$scope.$session = Session;

		$scope.$on('$stateChangeSuccess', function() {

			if($location.path() == '/') {
				angular.element('html').addClass('landing');
			}

		});

		$scope.$on('$stateChangeStart', function() {
			angular.element('html').removeClass('landing');
		});

		// Maps

		Map.resource.get({
			perPage: 4
		}, function(res) {

			$scope.maps = res.maps;

		});

	}
]);