'use strict';

angular.module('mapasColetivos.index', [])

.controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	'Content',
	'Map',
	function($scope, Session, $location, Content, Map) {

		$scope.$session = Session;

		$scope.baseUrl = '';

		$scope.$on('$stateChangeSuccess', function() {

			if($location.path() == '/') {
				angular.element('html').addClass('landing');
			}

		});

		$scope.$on('$stateChangeStart', function() {
			angular.element('html').removeClass('landing');
		});

		// Contents

		Content.resource.query({
			perPage: 4
		}, function(res) {

			$scope.contents = res.contents;

		});

		// Maps

		Map.resource.query({
			perPage: 4
		}, function(res) {

			$scope.maps = res.maps;

		});

	}
]);