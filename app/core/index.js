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
		
		$scope.isHomePage = true;

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

			// Remove layer data from content (circular reference)
			angular.forEach($scope.mapContents, function(content) {
				delete content.layer;
			});

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

		 	var filterByContents = function(contents, filterKey, filterFeatures) {

		 		filteredContents[filterKey] = contents;

		 		var parsedContents = filtersIntersection();

				Content.set(parsedContents);

				if(filterFeatures !== false)
					filterFeaturesByContents(parsedContents);

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

			var destroyContentsFilter = $scope.$watch('textFilter', function(text) {
				if(text) {
					filterByContents($filter('filter')($scope.mapContents, text), 'text');
				} else {
					filterByContents($scope.mapContents, 'text');
				}
			});

			var destroyLayerFilter = $scope.$watch('filters.layer', function(layer) {
				if(layer) {
					filterByContents(layer.contents, 'layer');
				} else {
					filterByContents($scope.mapContents, 'layer');
				}
			});

			$scope.$on('map.feature.click', function(event, marker) {
				$scope.$apply(function() {
					$scope.feature = marker.mcFeature;
					filterByContents(Feature.getContents($scope.feature, $scope.mapContents), 'feature', false);
				});
			});

			$scope.closeFeature = function() {
				$scope.feature = false;
				Content.set($scope.mapContents);
			};

			$scope.$on('$destroy', function() {
				destroyLayerFilter();
				destroyContentsFilter();
			});

		});

		$scope.filters = {};

		$scope.filterLayer = function(layer) {
			if($scope.filters.layer == layer)
				$scope.filters.layer = false;
			else
				$scope.filters.layer = layer;
		}

		var destroyContentsWatch = $scope.$watch(function() {
			return Content.get();
		}, function(contents) {
			$scope.contents = contents;
		});

		$scope.counts = {};

		var setCountries = function() {
			var countries = [];
			angular.forEach($scope.features, function(feature) {
				angular.forEach(feature.address, function(line) {
					if(line.type == 'country') {
						countries.push(line);
					}
				})
			});
			$scope.countries = _.uniq(countries, function(c) { return c._id; });
		}

		var destroyFeaturesWatch = $scope.$watch(function() {
			return Feature.get();
		}, function(features) {
			if(features) {
				if($scope.feature) {
					$scope.closeFeature();
				}
				$scope.features = features;
				setCountries();
				$scope.counts.byCountry = _.countBy(features, function(f) { return f.address[0].name; });
				console.log($scope.counts.byCountry);
			}
		});

		$scope.$on('$destroy', destroyContentsWatch);
		$scope.$on('$destroy', destroyFeaturesWatch);

		// Maps

		$scope.maps = MapData;

		$scope.mapOptions = {
			'scrollWheelZoom': false,
			'markerCluster': true
		};

		$scope.mapId = $scope.maps[0]._id;

	}
]);