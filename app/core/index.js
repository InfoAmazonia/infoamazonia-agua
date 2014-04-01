'use strict';

angular.module('mapasColetivos.index', [])

.controller('IndexCtrl', [
	'$rootScope',
	'$scope',
	'$filter',
	'SessionService',
	'$location',
	'MapData',
	'ContentData',
	'Content',
	'Feature',
	function($rootScope, $scope, $filter, Session, $location, MapData, ContentData, Content, Feature) {

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

		// Latest contents
		$scope.latestReports = ContentData;

		// Map content filtering

		$scope.$on('data.ready', function(e, map) {

			$scope.mapContents = jQuery.extend([], Content.get());
			$scope.mapFeatures = jQuery.extend([], Feature.get());

		 	$scope.contents = jQuery.extend(Content.get());

			$scope.$watch('contentsFilter', function(text) {
				if(text) {
					Content.set(($filter('filter')($scope.mapContents, {title: text})));
				} else {
					Content.set($scope.mapContents);
				}
				var features = [];
				angular.forEach(Content.get(), function(content) {
					//console.log(content);
					features = features.concat(Content.getFeatures(content, $scope.mapFeatures));
				});
				features = _.uniq(features);
				Feature.set(features);
				$rootScope.$broadcast('features.updated', Feature.get());
			});

		});

		$scope.$watch(function() {
			return Content.get();
		}, function(contents) {
			$scope.contents = contents;
		});

		// Maps

		$scope.maps = MapData;

		$scope.mapOptions = {
			'scrollWheelZoom': false,
			'markerCluster': true
		};

		$scope.mapId = $scope.maps[0]._id;

	}
]);