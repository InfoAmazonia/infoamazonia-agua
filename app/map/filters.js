'use strict';

module.exports = [
	'$scope',
	'$rootScope',
	'$filter',
	'$state',
	'$stateParams',
	'$timeout',
	'$location',
	'config',
	'Map',
	'Content',
	'Feature',
	'SessionService',
	'MapService',
	'User',
	'SirTrevor',
	'Page',
	function($scope, $rootScope, $filter, $state, $stateParams, $timeout, $location, config, Map, Content, Feature, Session, MapService, User, SirTrevor, Page) {

		/* 
		 * Helpers
		 */
		$scope.gravatar = User.gravatar;

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		/****/

		var parentState = $state.current.name.split('.')[0];

		$scope.updateState = function(state, value) {
			
			if(typeof state == 'string') {

				// Clear filter if the same
				if($stateParams[state] == value)
					value = '';

				var obj = {};
				obj[state] = value;
				state = obj;
			}

			var states = {
				country: '',
				state: '',
				city: '',
				textSearch: '',
				layer: '',
				feature: ''
			};

			var go = _.extend(_.extend(states, $stateParams), state);
			if(state.layer || state.textSearch || state.country || state.state || state.city) {
				go.feature = '';
			}

			$state.go(parentState + '.filter', go);
		};

		var destroyDataReady = $scope.$on('data.ready', function(e, map) {

			$scope.mapLayers = jQuery.extend([], map.fetchedLayers);

			$scope.mapFeatureLayers = _.filter($scope.mapLayers, function(layer) {
				return layer.type == 'FeatureLayer';
			});

			$scope.mapContents = jQuery.extend([], Content.get());
			$scope.mapFeatures = jQuery.extend([], Feature.get());

			// Remove layer data from content (circular reference)
			angular.forEach($scope.mapContents, function(content) {
				content.layer = _.extend({}, content.layer);
				delete content.layer.contents;
				delete content.layer.features;
				delete content.layer.maps;
				delete content.layer.creator;
				delete content.layer._mcData;
			});

			$scope.contents = jQuery.extend([], Content.get());

			var intersectResults = function(contents) {

				/*
				 * INTERSECTION
				 */

				// Separate contents in an array of arrays
				var ids = [];

				for(var filterKey in contents) {

					var fIds = [];
					angular.forEach(contents[filterKey], function(fContent) {
						fIds.push(fContent._id);
					});

					ids.push(fIds);

				}

				// Perform intersection
				if(ids.length) {

					var intersection = _.intersection.apply(_, ids);

					var parsedContents = _.filter($scope.mapContents, function(c) { return intersection.indexOf(c._id) != -1; });

				} else {

					var parsedContents = $scope.mapContents;

				}

				return parsedContents;

			}

			var filter = function(toParams) {

				var filteredContents = {};

				$scope.filteredData = {};

				Page.setTitle('');

				for(var filter in toParams) {

					if(toParams[filter]) {

						var contents;

						switch(filter) {
							case 'country':
							case 'state':
							case 'city':
								$scope.filteredData[filter] = _.find($scope.addressData[filter], function(v) { return v._id == toParams[filter]; });
								var features = $filter('filter')($scope.mapFeatures, {address: toParams[filter]});
								var fC = [];
								angular.forEach(features, function(feature) {
									fC = fC.concat(Feature.getContents(feature, $scope.mapContents));
								});
								contents = _.uniq(fC);
								break;
							case 'textSearch':
								contents = $filter('filter')($scope.mapContents, toParams[filter]);
								break;
							case 'layer':
								$scope.filteredData.layer = _.find($scope.mapFeatureLayers, function(l) { return l._id == toParams[filter] });
								Page.setTitle($scope.filteredData.layer.title);
								contents = $scope.filteredData.layer.contents;
								break;
							case 'feature':
								$scope.filteredData.feature = _.find($scope.mapFeatures, function(f) { return f._id == toParams[filter] });
								Page.setTitle($scope.filteredData.feature.title);
								contents = Feature.getContents($scope.filteredData.feature, $scope.mapContents);
								break;
						}

						if(typeof contents == 'object')
							filteredContents[filter] = contents;

					}

				}

				//console.log(filteredContents);

				// Get intersected content results

				var parsedContents = intersectResults(filteredContents);

				// Set contents

				Content.set(parsedContents);

				// Set features

				var features = [],
					featureContents;

				if(toParams.feature) {
					featureContents = jQuery.extend([], filteredContents);
					delete featureContents.feature;
					featureContents = intersectResults(featureContents);
				} else {
					featureContents = parsedContents;
				}

				angular.forEach(featureContents, function(content) {
					features = features.concat(Content.getFeatures(content, $scope.mapFeatures));
				});
				features = _.uniq(features);

				Feature.set(features);

				$rootScope.$broadcast('map.features.updated', features);

			};

			/*
			 * Watch contents update
			 */
			var destroyContentsWatch = $scope.$watch(function() {
				return Content.get();
			}, function(contents) {
				$scope.contents = contents;
				$scope.counts.byLayer = _.countBy(contents, function(c) { return c.layer.title; });
			});
			$scope.$on('$destroy', destroyContentsWatch);

			/*
			 * Watch features update
			 */
			$scope.counts = {};
			var initFeatures = function(features) {
				if(features) {
					$scope.features = features;
					setAddresses();
					$scope.counts.byCountry = _.countBy(features, function(f) { var a = _.find(f.address, function(line) { return line.type == 'country' }); if(a) return a.name; });
					$scope.counts.byState = _.countBy(features, function(f) { var a = _.find(f.address, function(line) { return line.type == 'state' }); if(a) return a.name; });
					$scope.counts.byCity = _.countBy(features, function(f) { var a = _.find(f.address, function(line) { return line.type == 'city' }); if(a) return a.name; });
				}
			};
			var destroyFeaturesWatch = $scope.$watch(function() {
				return Feature.get();
			}, initFeatures);
			initFeatures(Feature.get());
			$scope.$on('$destroy', destroyFeaturesWatch);

			/*
			 * Watch filter state and perform filtering
			 */
			var stateWatch = function(event, toState, toParams, fromState) {

				// Perform filter if current state is filter state
				if($state.current.url == 'filter/:country/:state/:city/:textSearch/:layer/:feature/') {

					filter($stateParams);

				} else {

					// Clear filters if not
					filter({});

				}

				// Check for content state
				if($state.current.url == 'content/:contentId/') {
					$scope.reading = true;
					$scope.content = _.find($scope.mapContents, function(c) { return c._id == $stateParams.contentId; });
					Page.setTitle($scope.content.title);
					var features = Content.getFeatures($scope.content, $scope.mapFeatures);
					Feature.set(features);
					$rootScope.$broadcast('map.features.updated', features);
				} else {
					$scope.content = false;
					$scope.reading = false;
				}

				if(fromState && toState.name !== fromState.name) {
					setTimeout(function() {
						MapService.get().invalidateSize(true);
					}, 400);
				}

				$scope.embedUrl = config.siteUrl + $location.path();

			};
			stateWatch();
			var destroyStateWatch = $rootScope.$on('$stateChangeSuccess', stateWatch);
			$scope.$on('$destroy', destroyStateWatch);

			$scope.textFilter = $stateParams.textSearch || '';

			var destroyTextFilter = $scope.$watch('textFilter', function(text) {
				if($state.current.url == 'filter/:country/:state/:city/:textSearch/:layer/:feature/' || text)
					$scope.updateState({textSearch: text.replace(new RegExp('/', 'g'), '%2F')});
			});
			$scope.$on('$destroy', destroyTextFilter);

			var destroyFeatureClick = $scope.$on('map.feature.click', function(event, marker) {
				$scope.updateState({feature: marker.mcFeature._id});
			});
			$scope.$on('$destroy', destroyFeatureClick);

		});
		$scope.$on('$destroy', destroyDataReady);

		var setAddresses = function() {
			var countries = [];
			var cities = [];
			var states = [];
			angular.forEach($scope.features, function(feature) {
				angular.forEach(feature.address, function(line) {
					if(line.type == 'country') {
						countries.push(line);
					}
					if(line.type == 'state') {
						states.push(line);
					}
					if(line.type == 'city') {
						cities.push(line);
					}
				})
			});
			$scope.addressData = {};
			$scope.addressData.country = _.uniq(countries, function(c) { return c._id; });
			$scope.addressData.state = _.uniq(states, function(s) { return s._id; });
			$scope.addressData.city = _.uniq(cities, function(c) { return c._id; });
		}
	}
]