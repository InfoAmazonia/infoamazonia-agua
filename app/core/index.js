'use strict';

angular.module('yby.index', [])

.controller('IndexCtrl', [
	'$rootScope',
	'$scope',
	'$stateParams',
	'SessionService',
	'$location',
	'MapData',
	'ContentData',
	'Content',
	'Feature',
	function($rootScope, $scope, $stateParams, Session, $location, MapData, ContentData, Content, Feature) {

		$scope.$session = Session;

		$scope.$on('$stateChangeSuccess', function() {
			if($location.path() == '/' || $location.path().indexOf('/filter/') == 0) {
				angular.element('html').addClass('landing');
			}
		});

		$scope.$on('$stateChangeStart', function() {
			angular.element('html').removeClass('landing');
			if($location.path() == '/' || $location.path().indexOf('/filter/') == 0) {
				angular.element('html').addClass('landing');
			}
		});

		// Latest contents
		$scope.latestReports = ContentData;

		$rootScope.baseUrl = $scope.baseUrl = '';

		// Maps

		$scope.maps = MapData;

		$scope.mapOptions = {
			'scrollWheelZoom': false,
			'markerCluster': true
		};

		$scope.mapId = $scope.maps[0]._id;

	}
])