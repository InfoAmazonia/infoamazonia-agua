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

			$scope.mapLayers = jQuery.extend([], map.fetchedLayers);

			$scope.mapFeatureLayers = _.filter($scope.mapLayers, function(layer) {
				return layer.type == 'FeatureLayer';
			});

			$scope.mapContents = jQuery.extend([], Content.get());
			$scope.mapFeatures = jQuery.extend([], Feature.get());

		 	$scope.contents = jQuery.extend([], Content.get());

		 	var filteredContents = {};

		 	var filtersIntersection = function() {

		 		var ids = [];

		 		for(var filterKey in filteredContents) {

		 			var fIds = [];
		 			angular.forEach(filteredContents[filterKey], function(fContent) {
		 				fIds.push(fContent._id);
		 			});

		 			ids.push(fIds);

		 		}

		 		var intersection = _.intersection.apply(_, ids);

		 		return _.filter($scope.mapContents, function(c) { return intersection.indexOf(c._id) != -1; });

		 	}

		 	var filterByContents = function(contents, filterKey) {

		 		filteredContents[filterKey] = contents;

		 		var parsedContents = filtersIntersection();

				Content.set(parsedContents);

				filterFeaturesByContents(contents);

				// if(contents.length != $scope.mapContents.length)
				// 	filterFeatures(contents);
				// else {
				// 	Feature.set($scope.mapFeatures);
				// 	$rootScope.$broadcast('features.updated', Feature.get());
				// }

		 	}

		 	var filterFeaturesByContents = function(contents) {

		 		var features = [];
				angular.forEach(contents, function(content) {
					features = features.concat(Content.getFeatures(content, $scope.mapFeatures));
				});
				features = _.uniq(features);

				Feature.set(features);
				$rootScope.$broadcast('features.updated', Feature.get());
		 	}

			var destroyContentsFilter = $scope.$watch('contentsFilter', function(text) {
				if(text) {
					filterByContents($filter('filter')($scope.mapContents, {title: text}), 'textFilter');
				} else {
					filterByContents($scope.mapContents, 'textFilter');
				}
			});

			var destroyLayerFilter = $scope.$watch('layerFilter', function(layer) {
				if(layer) {
					filterByContents(layer.contents, 'layerFilter');
				} else {
					filterByContents($scope.mapContents, 'layerFilter');
				}
			});

			$scope.$on('$destroy', function() {
				destroyLayerFilter();
				destroyContentsFilter();
			});

		});

		var destroyContentsWatch = $scope.$watch(function() {
			return Content.get();
		}, function(contents) {
			$scope.contents = contents;
		});

		$scope.$on('$destroy', function() {
			destroyContentsWatch();
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