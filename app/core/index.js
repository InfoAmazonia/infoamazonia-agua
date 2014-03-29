'use strict';

angular.module('mapasColetivos.index', [])

.controller('IndexCtrl', [
	'$scope',
	'SessionService',
	'$location',
	'MapData',
	'ContentData',
	function($scope, Session, $location, MapData, ContentData) {

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
		$scope.contents = ContentData;

		// Maps

		$scope.maps = MapData;

		$scope.mapOptions = {
			'scrollWheelZoom': false,
			'markerCluster': true
		};

		$scope.mapId = $scope.maps[0]._id;

	}
]);