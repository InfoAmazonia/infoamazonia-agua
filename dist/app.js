require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/*
 * Helpers
 */
require('./helpers');

/*
 * Core modules
 */

require('./core/title');
require('./core/index');
require('./core/loading');
require('./core/message');
require('./core/explore');
require('./core/dashboard');

/*
 * Common modules
 */

require('./common/leaflet');
require('./common/directives');
require('./common/mapView');

/*
 * Apps
 */

require('./session/app');
require('./user/app');
require('./import/app');
require('./feature/app');
require('./content/app');
require('./layer/app');
require('./map/app');

var settings = angular.extend({
	server: 'local',
	apiPrefix: '/api/v1'
}, require('./config'));

/*
 * App
 */
angular.module('mapasColetivos', [
	'ui.router',
	'ui.keypress',
	'ui.slider',
	'monospaced.elastic',
	'ngRoute',
	'ngAnimate',
	'infinite-scroll',
	'colorpicker.module',
	'mapasColetivos.mapView',
	'mapasColetivos.user',
	'mapasColetivos.pageTitle',
	'mapasColetivos.directives',
	'mapasColetivos.session',
	'mapasColetivos.index',
	'mapasColetivos.dashboard',
	'mapasColetivos.explore',
	'mapasColetivos.loadingStatus',
	'mapasColetivos.messageStatus',
	'mapasColetivos.dataImport',
	'mapasColetivos.map',
	'mapasColetivos.layer',
	'mapasColetivos.feature',
	'mapasColetivos.content'
])
.value('config', settings)
.value('apiPrefix', (settings.server == 'local' ? '' : settings.server) + settings.apiPrefix)

/*
 * Core routes
 */

.config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		if(settings.server !== 'local') {
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common['X-Requested-With'];
		}

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'IndexCtrl',
				templateUrl: '/views/landing.html'
			});

		$locationProvider.html5Mode(true);

		var interceptor = ['$rootScope', '$q', '$location', function(scope, $q, $location) {

			function success(response) {
				return response;
			}

			function error(response) {

				var status = response.status;

				if (status == 401) {
					$location.path('/login');
					return;
				}
				// otherwise
				return $q.reject(response);

			}

			return function (promise) {
				return promise.then(success, error);
			}

		}];

		$httpProvider.responseInterceptors.push(interceptor);

		/*
		 * Trailing slash rule
		 */
		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				search = $location.search(),
				params;

			// check to see if the path already ends in '/'
			if (path[path.length - 1] === '/') {
				return;
			}

			// If there was no search string / query params, return with a `/`
			if (Object.keys(search).length === 0) {
				return path + '/';
			}

			// Otherwise build the search string and return a `/?` prefix
			params = [];
			angular.forEach(search, function(v, k){
				params.push(k + '=' + v);
			});
			
			return path + '/?' + params.join('&');
		});

	}
])

.run([
	'$rootScope',
	'$location',
	function($rootScope, $location) {

		/*
		 * Store nav history
		 */
		window.mcHistory = [];
		$rootScope.$on('$stateChangeSuccess', function() {
			if(window._gaq) {
				window._gaq.push(['_trackPageview', $location.path()]);
			}
			window.mcHistory.push(window.location.pathname);
		});

	}
]);
},{"./common/directives":2,"./common/leaflet":4,"./common/mapView":5,"./config":7,"./content/app":8,"./core/dashboard":12,"./core/explore":13,"./core/index":14,"./core/loading":15,"./core/message":16,"./core/title":17,"./feature/app":18,"./helpers":24,"./import/app":25,"./layer/app":30,"./map/app":37,"./session/app":41,"./user/app":44}],2:[function(require,module,exports){
'use strict';

angular.module('mapasColetivos.directives', [
	'ngSanitize',
	'fitVids'
])

.directive('disableEnterKey', [
	function() {
		return {
			link: function(scope, element) {

				function triggerBlur() {
					element.blur();
				}

				function keyCallback(event) {

					if(event.which == 13) {

						triggerBlur();
						event.preventDefault();

					}

				}

				element.on('keydown keypress', keyCallback);
			}
		}
	}
])

// Render bindings for dynamic html
.directive('dynamic', [
	'$compile',
	function($compile) {
		return function(scope, element, attrs) {
			scope.$watch(
				function(scope) {
					// watch the 'dynamic' expression for changes
					return scope.$eval(attrs.dynamic);
				},
				function(value) {
					// when the 'dynamic' expression changes
					// assign it into the current DOM
					element.html(value);

					// compile the new DOM and link it to the current
					// scope.
					// NOTE: we only compile .childNodes so that
					// we don't get into infinite loop compiling ourselves
					$compile(element.contents())(scope);
				}
			);
		};
	}
]);
},{}],3:[function(require,module,exports){
'use strict';

/*
 * Geocode service
 */

angular.module('mapasColetivos.geocode', [])

.factory('GeocodeService', [
	'$http',
	function($http) {
		return {
			get: function(query) {
				return $http.jsonp('http://nominatim.openstreetmap.org/search.php?q=' + query + '&format=json&polygon_geojson=1&json_callback=JSON_CALLBACK', {
					loadingMessage: 'Buscando localizações'
				});
			}
		}
	}
]);
},{}],4:[function(require,module,exports){
'use strict';

/*
 * Leaflet service
 */

angular.module('mapasColetivos.leaflet', [])

.factory('MapService', [
	function() {

		var map = false,
			featureLayer = L.featureGroup(),
			groups = [],
			features = [],
			hiddenFeatures = [],
			baseLayer = L.mapbox.tileLayer('infoamazonia.h17kafbd'),
			legendControl = L.mapbox.legendControl();

		var featureToMapObj = require('../feature/featureToMapObjService');

		return {
			init: function(id, config) {
				this.destroy();
				//config = _.extend({ infoControl: tr, attributionControl: true }, config);
				map = L.mapbox.map(id, null, config);
				map.whenReady(function() {
					map.addLayer(baseLayer);
					map.addLayer(featureLayer);
					map.addControl(legendControl);
					map.infoControl.addInfo('<a href="https://www.mapbox.com/map-feedback/" target="_blank" class="mapbox-improve-map">Melhore este mapa</a>');
				});
				return map;
			},
			get: function() {
				return map;
			},
			clearFeatures: function() {
				if(features.length) {
					angular.forEach(features, function(feature) {
						if(featureLayer.hasLayer(feature))
							featureLayer.removeLayer(feature);
					});
					features = [];
				}
			},
			getFeatureLayer: function() {
				return featureLayer;
			},
			addFeature: function(feature) {
				featureLayer.addLayer(feature);
				features.push(feature);
			},
			removeFeature: function(feature) {
				features = features.filter(function(f) { return f !== feature; });
				featureLayer.removeLayer(feature);
			},
			hideFeature: function(feature) {
				if(features.indexOf(feature) !== -1) {
					featureLayer.removeLayer(feature);
					hiddenFeatures.push(feature);
					features = features.filter(function(f) { return f !== feature; });
				}
			},
			showFeature: function(feature) {
				if(hiddenFeatures.indexOf(feature) !== -1) {
					featureLayer.addFeature(feature);
					features.push(feature);
					hiddenFeatures = features.filter(function(f) { return f !== feature; });
				}
			},
			showAllFeatures: function() {
				if(hiddenFeatures.length) {
					angular.forEach(hiddenFeatures, function(hM) {
						this.showFeature(hM);
					});
				}
			},
			fitWorld: function() {
				map.setView([0,0], 2);
			},
			fitFeatureLayer: function() {
				if(map instanceof L.Map) {
					map.invalidateSize(false);
					if(features.length) {
						map.fitBounds(featureLayer.getBounds());
					}
				}
				return map;
			},
			addLayer: function(layer) {
				if(layer.type == 'TileLayer') {
					var layer = this.addTileLayer(layer.url);
					layer.on('load', _.once(function() {
						legendControl.addLegend(layer._tilejson.legend);
					}));
					groups.push(layer);
				} else {
					var self = this;
					var features = [];
					var featureLayer = L.featureGroup();
					featureLayer.mcLayer = layer;
					groups.push(featureLayer);
					angular.forEach(layer.features, function(f) {
						var properties = angular.copy(layer.styles[f.geometry.type]);
						_.extend(properties, f.properties || {});
						f.properties = properties;
						var feature = featureToMapObj(f, null, self.get());
						feature.mcFeature = f;
						features.push(feature);
						featureLayer.addLayer(feature);
					});
					featureLayer.addTo(map);
					return {
						featureLayer: featureLayer,
						features: features
					};
				}
			},
			addTileLayer: function(url) {
				if(url.indexOf('http://') !== -1) {
					return L.tileLayer(url).addTo(map);
				} else {
					var layer = L.mapbox.tileLayer(url);
					layer.gridLayer = L.mapbox.gridLayer(url).addTo(map);
					layer.gridControl = L.mapbox.gridControl(layer.gridLayer).addTo(map);
					return layer.addTo(map);
				}
			},
			renderTileJSON: function(tilejson) {
				if(tilejson.legend) {
					legendControl.addLegend(tilejson.legend);
				}
				if(tilejson.center) {
					map.setView([tilejson.center[1], tilejson.center[0]], tilejson.center[2]);
				}
				if(tilejson.bounds) {
					var bounds = L.latLngBounds(
						L.latLng(tilejson.bounds[1], tilejson.bounds[2]),
						L.latLng(tilejson.bounds[3], tilejson.bounds[0])
					);
					map.setMaxBounds(bounds);
				}
				if(tilejson.maxZoom) {
					map.options.maxZoom = tilejson.maxZoom;
				}
				if(tilejson.minZoom) {
					map.options.minZoom = tilejson.minZoom;
				}
			},
			removeBaseLayer: function() {
				map.removeLayer(baseLayer);
			},
			clearGroups: function() {
				var self = this;
				if(groups.length) {
					angular.forEach(groups, function(group) {
						if(map.hasLayer(group)) {
							self.removeLayer(group);
						}
					});
				}
				groups = []
			},
			removeLayer: function(layer) {
				map.removeLayer(layer);
				if(layer._tilejson) {
					layer.gridControl.removeFrom(map);
					map.removeLayer(layer.gridLayer);
				}
			},
			clearAll: function() {
				this.clearFeatures();
				this.clearGroups();
			},
			destroy: function() {
				this.clearAll();
				baseLayer = L.mapbox.tileLayer('infoamazonia.h17kafbd');
				legendControl = L.mapbox.legendControl();
				if(map instanceof L.Map)
					map.remove();
				map = null;
			}
		}
	}
]);
},{"../feature/featureToMapObjService":21}],5:[function(require,module,exports){
'use strict';

/*
 * Map View controller
 */

angular.module('mapasColetivos.mapView', [])

.factory('MapView', [
	'MapService',
	function(MapService) {

		var sidebar = true;

		var backLink = false;

		return {
			sidebar: function(enable) {
				if(typeof enable !== 'undefined') {
					sidebar = enable;
					setTimeout(function() {
						if(MapService.get())
							MapService.get().invalidateSize();
					}, 200);
				}

				return sidebar;
			},
			backLink: function(url) {
				if(typeof url !== 'undefined') {
					backLink = url;
				}

				return backLink;
			}
		}

	}
])

.controller('MapViewCtrl', [
	'$scope',
	'$rootScope',
	'$location',
	'MapView',
	function($scope, $rootScope, $location, MapView) {

		$scope.mapView = MapView;

		$rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {

			if(from.name.indexOf('singleMap') == -1 && from.name.indexOf('singleLayer') == -1) {
				MapView.backLink(window.mcHistory[window.mcHistory.length-2]);
			}

		});

		$scope.mapView.goBack = function() {

			if(MapView.backLink()) {
				$location.path(MapView.backLink());
			}

		}

	}
]);
},{}],6:[function(require,module,exports){
'use strict';

/*
 * Sir Trevor
 */

angular.module('mapasColetivos.sirTrevor', [])

.directive('sirTrevorEditor', [
	'apiPrefix',
	function(apiPrefix) {
		return {
			link: function(scope, element, attrs) {
				SirTrevor.setDefaults({
					uploadUrl: apiPrefix + '/images'
				});
				scope.sirTrevor = new SirTrevor.Editor({
					el: jQuery(element),
					blockTypes: [
						'Embedly',
						'Text',
						'List',
						'Image',
						'Video'
					],
					defaultType: 'Text',
					required: 'Text'
				});
			}
		}
	}
])
.factory('SirTrevor', [
	function() {

		// Providers regex from SirTrevor's video block code
		var videoProviders = {
			vimeo: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,
				html: "<iframe src=\"{{protocol}}//player.vimeo.com/video/{{remote_id}}?title=0&byline=0\" width=\"580\" height=\"320\" frameborder=\"0\"></iframe>"
			},
			youtube: {
				regex: /(?:http[s]?:\/\/)?(?:www.)?(?:(?:youtube.com\/watch\?(?:.*)(?:v=))|(?:youtu.be\/))([^&].+)/,
				html: "<iframe src=\"{{protocol}}//www.youtube.com/embed/{{remote_id}}\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
			}
		};

		return {
			render: function(blocks) {
				var self = this;
				var rendered = '';
				angular.forEach(blocks, function(block) {
					rendered += self.renderBlock(block);
				});
				return rendered;
			},
			renderBlock: function(block) {
				var rendered = '';
				if(typeof block !== 'undefined' && block) {
					switch(block.type) {
						case 'text':
							rendered += '<div class="text">' + markdown.toHTML(block.data.text) + '</div>';
							break;
						case 'list':
							rendered += '<div class="list">' + markdown.toHTML(block.data.text) + '</div>';
							break;
						case 'image':
							rendered += '<div class="image"><img src="' + block.data.file.url + '" /></div>';
							break;
						case 'video':
							rendered += '<div class="video" fit-vids>' + videoProviders[block.data.source].html
								.replace('{{protocol}}', window.location.protocol)
								.replace('{{remote_id}}', block.data.remote_id) + '</div>';
							break;
					}
				}
				return rendered;
			}
		}
	}
]);
},{}],7:[function(require,module,exports){
'use strict';

var config = {
	server: 'http://mapascoletivos.herokuapp.com',
	apiPrefix: '/api/v1'
};

module.exports = config;
},{}],8:[function(require,module,exports){
'use strict';

require('../common/sirTrevor');

angular
	.module('mapasColetivos.content', [
		'mapasColetivos.sirTrevor'
	])
	.factory('Content', require('./service').Content)
	.controller('ContentCtrl', require('./controller').ContentCtrl)
	.controller('ContentEditCtrl', require('./editController').ContentEditCtrl);
},{"../common/sirTrevor":6,"./controller":9,"./editController":10,"./service":11}],9:[function(require,module,exports){
'use strict';

/*
 * Content controller
 */

exports.ContentCtrl = [
	'$scope',
	'$rootScope',
	'$stateParams',
	'SirTrevor',
	'Content',
	'Feature',
	'SessionService',
	'MessageService',
	function($scope, $rootScope, $stateParams, SirTrevor, Content, Feature, Session, Message) {

		$scope.objType = 'content';

		$scope.$content = Content;

		var contents,
			features;

		$rootScope.$on('data.ready', function(event, parent) {

			contents = Content.get();
			features = Feature.get();

			$scope.$watch('features.updated', function(features) {
				features = features;
			});

			$scope.$watch('contents.updated', function(contents) {
				contents = contents;
			});

			var init = true;

			$scope.$watch('$content.get()', function(contents) {

				if(typeof contents !== 'undefined' && contents) {

					$scope.contents = contents;
					$rootScope.$broadcast('contents.updated', contents);

					if(init) {

						viewState();
						init = false;

					}

				}
			});

		});

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		var viewState = function() {
			if($stateParams.contentId && $scope.contents) {
				var content = $scope.contents.filter(function(c) { return c._id == $stateParams.contentId; })[0];
				$scope.view(content);
				return true;
			}
			return false;
		}

		var viewing = false;

		$scope.view = function(content) {

			viewing = true;

			if(!content)
				return false;

			var contentFeatures = Content.getFeatures(content, features);

			if(contentFeatures) {
				Feature.set(contentFeatures);
			}

			$rootScope.$broadcast('content.filtering.started', content, contentFeatures);

			$scope.content = content;
			$scope.content.featureObjs = contentFeatures;

		}

		$scope.close = function() {

			if(typeof features !== 'undefined')
				Feature.set(features);

			$scope.content = false;

			viewing = false;

			$rootScope.$broadcast('content.filtering.closed');

		}

		$scope.new = function() {

			Content.edit({});

		};

		$scope.canEdit = function(content, layer) {

			var contentCreatorId = content.creator._id ? content.creator._id : content.creator;

			// User is content owner
			if(contentCreatorId == Session.user._id) {
				return true;
			}

			// User is layer owner
			if(layer.creator._id == Session.user._id) {
				return true;
			}

			return false;

		}

		$scope.edit = function(content, layer) {

			if($scope.canEdit(content, layer)) {

				Content.edit(angular.copy(content));

				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
					document.getElementById('content-edit-body').scrollTop = 0;
				}, 100);

			} else {

				Message.add({
					'status': 'error',
					'text': 'Você não tem permissão para editar este conteúdo'
				});

			}

		};

		$rootScope.$on('$stateChangeSuccess', function() {

			if(!viewState() && viewing) {
				$scope.close();
			}

		});

		$scope.templates = {
			list: '/views/content/list-item.html',
			show: '/views/content/show.html'
		};

		$scope.$on('$stateChangeStart', $scope.close);

	}
];
},{}],10:[function(require,module,exports){
'use strict';

/*
 * Content edit controller
 */

exports.ContentEditCtrl = [
	'$scope',
	'$rootScope',
	'Content',
	'Layer',
	'MessageService',
	'SirTrevor',
	'MapService',
	function($scope, $rootScope, Content, Layer, Message, SirTrevor, MapService) {

		var original,
			layer;

		$scope.$layer = Layer;

		$scope.$watch('$layer.edit()', function(editing) {
			layer = editing;
		});

		$scope.$content = Content;

		$scope.$watch('$content.get()', function(contents) {
			$scope.contents = contents;
		});

		$scope.$watch('$content.edit()', function(editing) {
			$scope.editing = editing;
		});

		$scope.$watch('editing', function(editing) {
			original = angular.copy(editing);
			$scope.tool = false;
		});

		$scope.$watch('editing.sirTrevor', function(val) {
			// Reinitialize Sir Trevor with some delay (enough to populate the model with new data)
			setTimeout(function() {
				$scope.sirTrevor.reinitialize();
			}, 20);

		});

		$scope.save = function() {

			// Trigger SirTrevor form submit 
			$scope.sirTrevor.onFormSubmit();

			// Fixed content type
			$scope.editing.type = 'Post';

			// Store content (SirTrevor data)
			$scope.editing.sirTrevorData = $scope.sirTrevor.dataStore.data;

			// Store stringified data
			$scope.editing.sirTrevor = $scope.sirTrevor.el.value;

			if($scope.editing && $scope.editing._id) {

				Content.resource.update({contentId: $scope.editing._id}, $scope.editing, function(content) {

					$scope.editing = angular.copy(content);
					original = angular.copy(content);

					// Replace content in local features
					angular.forEach($scope.contents, function(c, i) {
						if(c._id == $scope.editing._id)
							$scope.contents[i] = $scope.editing;
					});
					Content.set($scope.contents);

					Message.message({
						status: 'ok',
						text: 'Conteúdo salvo.'
					});

				});

			} else {

				$scope.editing.layer = layer._id;

				var content = new Content.resource($scope.editing);

				content.$save(function(content) {

					original = angular.copy(content);

					// Locally push new content
					$scope.contents.push(content);
					Content.set($scope.contents);

					// Update editing content to saved data
					Content.edit(angular.copy(content));

					Message.message({
						status: 'ok',
						text: 'Conteúdo adicionado.'
					});

				}, function(err) {

					var message = {status: 'error'};

					if(err.status == 400 && err.data.message) {
						message.text = err.data.message;
					} else {
						message.text = 'Ocorreu um erro interno.';
					}

					Message.message(message, false);

				});

			}

		}

		$scope.delete = function() {

			if(confirm('Você tem certeza que deseja remover este conteúdo?')) {

				Content.resource.delete({contentId: $scope.editing._id}, function() {

					Content.set($scope.contents.filter(function(c) {
						return c._id !== $scope.editing._id;
					}));
					Content.edit(false);

					Message.message({
						status: 'ok',
						text: 'Conteúdo removido.'
					});

				}, function(err) {

					var message = {status: 'error'};

					if(err.status == 400 && err.data.message) {
						message.text = err.data.message;
					} else {
						message.text = 'Ocorreu um erro interno.';
					}

					Message.message(message, false);
				});

			}

		}

		$scope.close = function() {

			if($scope.editing) {
				Content.edit(false);

				// Fix map size and bounds (animation safe)
				setTimeout(function() {
					MapService.fitFeatureLayer();
				}, 200);
			}

		}

		/*
		 * Features
		 */
		$scope.hasFeature = function(featureId) {
			if($scope.editing && $scope.editing.features) {
				return $scope.editing.features.filter(function(f) { return f == featureId }).length;
			}
			return false;
		}

		$scope.toggleFeature = function(featureId) {

			if(!$scope.editing.features)
				$scope.editing.features = [];

			var features = angular.copy($scope.editing.features);

			if($scope.hasFeature(featureId)) {
				features = features.filter(function(f) { return f !== featureId });
			} else {
				features.push(featureId);
			}

			$scope.editing.features = features;

		}

		$scope.clearFeatures = function() {

			$scope.editing.features = [];

		}

		/*
		 * Tools
		 */

		$scope.tool = false;

		$scope.setTool = function(tool) {
			if(tool == $scope.tool)
				$scope.tool = false;
			else
				$scope.tool = tool;
		}

		$scope.isRevertable = function() {

			return (!angular.equals($scope.editing, original) && $scope.editing && $scope.editing._id);

		}

		$scope.revert = function() {

			$scope.editing = angular.copy(original);

		}

		$scope.$on('layerObjectChange', $scope.close);
		$scope.$on('$stateChangeStart', $scope.close);
		$scope.$on('layer.save.success', function() {

			if($scope.editing) {
				$scope.save(true);
			}

		});

	}
];
},{}],11:[function(require,module,exports){
'use strict';

/*
 * Content service
 */
 
exports.Content = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var contents = [];
		var editing = false;

		return {
			resource: $resource(apiPrefix + '/contents/:contentId', {}, {
				'query': {
					method: 'GET',
					isArray: false,
					loadingMessage: 'Carregando conteúdos'
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando conteúdo'
				},
				'save': {
					method: 'POST',
					loadingMessage: 'Criando conteúdo',
					url: apiPrefix + '/contents',
					params: {
						layer: '@id'
					}
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo conteúdo',
					url: apiPrefix + '/contents/:contentId'
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando conteúdo'
				}
			}),
			// Object sharing between controllers methods
			set: function(val) {
				contents = val;
				contents = _.sortBy(contents, function(c) {
					return c.createdAt;
				}).reverse();
			},
			add: function(val) {
				contents.push(val);
			},
			get: function() {
				return contents;
			},
			edit: function(content) {
				if(typeof content !== 'undefined')
					editing = content;

				return editing;
			},
			// Get content features method
			getFeatures: function(content, features) {

				if(content.features.length) {

					if(features && features.length) {

						var contentFeatures = features.filter(function(feature) {
							return content.features.indexOf(feature._id) !== -1;
						});

						return contentFeatures;

					}

				}

				return false;

			}
		};

	}
];
},{}],12:[function(require,module,exports){
'use strict';

angular.module('mapasColetivos.dashboard', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('dashboard', {
				url: '/dashboard/',
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard/index.html'
			})
			.state('dashboard.profile', {
				url: 'profile/',
				templateUrl: '/views/dashboard/profile.html'
			});

	}
])

.controller('DashboardCtrl', [
	'$scope',
	'$rootScope',
	'$timeout',
	'$state',
	'$stateParams',
	'SessionService',
	'$location',
	'Page',
	'User',
	'Layer',
	'Map',
	function($scope, $rootScope, $timeout, $state, $stateParams, Session, $location, Page, User, Layer, Map) {

		Page.setTitle('Painel de Controle');

		$scope.isDashboard = true;

		$scope.$session = Session;

		$scope.$watch('$session.authenticated()', function(auth) {

			if(!auth) {
				$location.path('/login/');
			}

		});

		$scope.$watch('$session.user()', function(user) {
			if(user) {
				$scope.user = user;
				$scope.user.grvtr = User.gravatar($scope.user.email, 100);
			}
		});

		var stateFunctions = function() {
			if($state.current.name === 'dashboard') {
				$location.path('/dashboard/layers').replace();
			}
			$scope.currentState = $state.current.name.replace('dashboard.', '');
		}

		$rootScope.$on('$viewContentLoaded', function() {
			stateFunctions();
		});

		$rootScope.$on('$stateChangeSuccess', function() {
			stateFunctions();
		});

		$scope.$layer = Layer;
		Layer.resource.userLayers(function(res) {
			$scope.totalLayer = res.layersTotal;
			$scope.layers = res.layers;

			/*
			 * Pagination
			 */
			$scope.$on('layer.page.next', function(event, res) {
				if(res.layers.length) {
					angular.forEach(res.layers, function(layer) {
						$scope.layers.push(layer);
					});
					$scope.layers = $scope.layers; // trigger digest
				}
			});

		});

		$scope.$map = Map;
		Map.resource.userMaps(function(res) {
			
			$scope.totalMap = res.mapsTotal;
			$scope.maps = res.maps;

			/*
			 * Pagination
			 */
			$scope.$on('map.page.next', function(event, res) {
				if(res.maps.length) {
					angular.forEach(res.maps, function(map) {
						$scope.maps.push(map);
					});
					$scope.maps = $scope.maps; // trigger digest
				}
			});
		});

		$rootScope.$on('map.delete.success', function(event, map) {
			$scope.maps = $scope.maps.filter(function(m) { return map._id != m._id; });
		});

		$rootScope.$on('layer.add.success', function(event, layer) {
			$scope.layers = [layer].concat($scope.layers);
		});

		$rootScope.$on('layer.delete.success', function(event, layer) {
			$scope.layers = $scope.layers.filter(function(m) { return layer._id != m._id; });
		});

	}
]);
},{}],13:[function(require,module,exports){
'use strict';

angular.module('mapasColetivos.explore', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('explore', {
				url: '/explore/',
				controller: 'ExploreCtrl',
				templateUrl: '/views/explore.html'
			});

	}
])

.controller('ExploreCtrl', [
	'$scope',
	'Page',
	'Layer',
	'Map',
	function($scope, Page, Layer, Map) {

		Page.setTitle('Explore a comunidade');

		Layer.resource.get({
			perPage: 4
		}, function(res) {

			$scope.layers = res.layers;

		});

		Map.resource.get({
			perPage: 4
		}, function(res) {

			$scope.maps = res.maps;

		});

	}
]);
},{}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
'use strict';

/*
 * Loading module
 */
angular.module('mapasColetivos.loadingStatus', [])

.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('loadingStatusInterceptor');
	}
])

.service('LoadingService', function() {

	var active = false;
	var message = 'Carregando...';
	var enabled = true;

	return {
		show: function(text) {
			if(enabled) {
				if(typeof text !== 'undefined')
					message = text;
				active = true;
				return active;
			}
		},
		hide: function() {
			if(enabled) {
				message = 'Carregando...';
				active = false;
				return active;
			}
		},
		get: function() {
			return active;
		},
		setMessage: function(text) {
			message = text;
		},
		getMessage: function() {
			return message;
		},
		disable: function() {
			enabled = false;
		},
		enable: function() {
			enabled = true;
		}
	}

})

.directive('loadingStatusMessage', [
	'LoadingService',
	function(service) {
		return {
			link: function($scope, $element, attrs) {
				var show = function() {
					$element.addClass('active').find('.loading-message').html(service.getMessage());
				};
				var hide = function() {
					$element.removeClass('active');
				};
				$scope.$service = service;
				$scope.$watch('$service.get()', function(active) {
					if(active)
						show();
					else
						hide();
				});
			}
		};
	}
])

.factory('loadingStatusInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	'LoadingService',
	function($q, $rootScope, $timeout, service) {
		var loadingMessage = 'Carregando...';
		var activeRequests = 0;
		var started = function() {
			if(activeRequests==0) {
				service.setMessage(loadingMessage);
				service.show();
				$rootScope.$broadcast('loadingStatusActive', loadingMessage);
			}    
			activeRequests++;
		};
		var ended = function() {
			activeRequests--;
			if(activeRequests==0) {
				service.hide();
				$rootScope.$broadcast('loadingStatusInactive', loadingMessage);
			}
		};
		return {
			request: function(config) {

				if(config.loadingMessage)
					loadingMessage = config.loadingMessage;
				else
					loadingMessage = 'Carregando...';

				started();
				return config || $q.when(config);
			},
			response: function(response) {
				ended();
				return response || $q.when(response);
			},
			responseError: function(rejection) {
				ended();
				return $q.reject(rejection);
			}
		};
	}
]);
},{}],16:[function(require,module,exports){
'use strict';

/*
 * Message module
 */
angular.module('mapasColetivos.messageStatus', [])

.config([
	'$httpProvider',
	function($httpProvider) {
		$httpProvider.interceptors.push('MessageInterceptor');
	}
])

.factory('MessageService', [
	'$timeout',
	function($timeout) {

		var messages = [];
		var enabled = true;

		return {
			get: function() {
				return messages;
			},
			close: function(message) {
				messages = messages.filter(function(m) { return m !== message; });
			},
			add: function(val, timeout) {

				if(enabled) {

					var self = this;

					if(typeof val !== 'undefined') {

						var message = val;
						messages.push(message);

						if(timeout !== false) {
							timeout = timeout ? timeout : 3000;
							$timeout(function() {
								self.close(message);
							}, timeout);
						}

					}

				}

				return message;
			},
			message: function(val, timeout) {
				this.add(val, timeout);
			},
			disable: function() {
				enabled = false;
			},
			enable: function() {
				enabled = true;
			}
		}

	}
])

.factory('MessageInterceptor', [
	'$q',
	'$rootScope',
	'$timeout',
	'MessageService',
	function($q, $rootScope, $timeout, Message) {

		return {
			request: function(config) {
				return config || $q.when(config);
			},
			response: function(response) {
				if(response.data && response.data.messages) {
					angular.forEach(response.data.messages, function(message) {
						Message.add(message);
					});
				}
				return response || $q.when(response);
			},
			responseError: function(rejection) {
				if(rejection.data && rejection.data.messages) {
					angular.forEach(rejection.data.messages, function(message) {
						Message.add(message);
					});
				}
				return $q.reject(rejection);
			}
		}

	}
])

.controller('MessageCtrl', [
	'$scope',
	'MessageService',
	function($scope, MessageService) {

		$scope.service = MessageService;

		$scope.$watch('service.get()', function(messages) {
			$scope.messages = messages;
		});

		$scope.close = function(message) {
			$scope.service.close(message);
		}

	}
]);;
},{}],17:[function(require,module,exports){
'use strict';

angular.module('mapasColetivos.pageTitle', [])

.factory('Page', [
	function() {
		var baseTitle = 'Mapas Coletivos';
		var title = baseTitle;
		return {
			title: function() {
				return title;
			},
			setTitle: function(val) {
				title = val + ' - ' + baseTitle;
			}
		}
	}
])

.controller('PageCtrl', [
	'$scope',
	'Page',
	function($scope, Page) {
		$scope.page = Page;
	}
]);
},{}],18:[function(require,module,exports){
'use strict';

angular
	.module('mapasColetivos.feature', [])
	.factory('Feature', require('./service').Feature)
	.factory('Maki', require('./makiService').Maki)
	.controller('FeatureCtrl', require('./controller').FeatureCtrl)
	.controller('FeatureEditCtrl', require('./editController').FeatureEditCtrl);
},{"./controller":19,"./editController":20,"./makiService":22,"./service":23}],19:[function(require,module,exports){
'use strict';

var featureToMapObj = require('./featureToMapObjService');

/*
 * Feature controller
 */

exports.FeatureCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'$location',
	'Feature',
	'Content',
	'MessageService',
	'MapService',
	'SessionService',
	function($scope, $rootScope, $state, $stateParams, $location, Feature, Content, Message, MapService, Session) {

		$scope.$session = Session;

		$scope.$watch('$session.user()', function(user) {
			$scope.user = user;
		});


		$scope.objType = 'feature';

		$scope.$feature = Feature;

		var contents,
			features;

		$rootScope.$on('data.ready', function() {

			contents = Content.get();
			features = Feature.get();

			var init = true;

			$scope.$watch('$feature.get()', function(features) {

				if(typeof features !== 'undefined' && features) {

					$scope.features = features;
					$rootScope.$broadcast('features.updated', features);

					if(init) {

						viewState();
						init = false;

					}

				}

			});

		});

		var viewing = false;

		var focused = false;

		$scope.focus = function(feature) {

			setTimeout(function() {
				var lFeature = featureToMapObj(feature);
				MapService.get().fitBounds(L.featureGroup([lFeature]).getBounds());
				focused = true;
			}, 100);


		}

		$scope.view = function(feature) {

			$scope.close();

			viewing = true;

			$scope.feature = feature;

			if(window.mcHistory.length == 1) {
				setTimeout(function() {
					var lFeature = featureToMapObj(feature);
					MapService.get().fitBounds(L.featureGroup([lFeature]).getBounds());
					focused = true;
				}, 200);
			}

			var featureContents = Feature.getContents(feature, contents);

			Content.set(featureContents);

			$rootScope.$broadcast('feature.filtering.started', feature, featureContents);

		}

		$scope.description = function(feature) {

			if(feature && feature.description) {

				var description = angular.copy(feature.description);

				description = description.replace(new RegExp('{{', 'g'), '<%= ');
				description = description.replace(new RegExp('}}', 'g'), ' %>');

				var compiled = _.template(description);

				return markdown.toHTML(compiled(feature.properties));

			}

			return '';

		}

		$scope.close = function() {

			$scope.feature = false;

			if(typeof features !== 'undefined' && Feature.get() !== features)
				Feature.set(features);

			if(typeof contents !== 'undefined' && Content.get() !== contents)
				Content.set(contents);

			viewing = false;

			if(focused) {
				focused = false;
				MapService.fitFeatureLayer();
			}

			$rootScope.$broadcast('feature.filtering.closed');

		}

		$scope.templates = {
			list: '/views/feature/list-item.html',
			show: '/views/feature/show.html'
		};

		/*
		 * Manage view state
		 */
		var viewState = function() {
			if($stateParams.featureId && $scope.features) {
				var feature = $scope.features.filter(function(f) { return f._id == $stateParams.featureId; })[0];
				if(feature) {
					$scope.view(feature);
					return true;
				}
			}
			return false;
		}

		$rootScope.$on('$stateChangeSuccess', function() {

			if(!viewState() && viewing) {
				$scope.close();
			}

		});

		/*
		 * Edit actions
		 */
		if($location.path().indexOf('edit') !== -1) {

			$scope.canEdit = function(feature, layer) {

				var featureCreatorId = feature.creator._id ? feature.creator._id : feature.creator;

				// User is feature owner
				if(featureCreatorId == $scope.user._id) {
					return true;
				}

				// User is layer owner
				if(layer.creator._id == $scope.user._id) {
					return true;
				}

				return false;

			}

			$scope.$on('marker.clicked', function(event, feature, layer) {
				$scope.edit(feature, layer);
			});

			$scope.new = function() {

				Feature.edit({});

			};

			$scope.edit = function(feature, layer) {

				if($scope.canEdit(feature, layer)) {

					Feature.edit(angular.copy(feature));

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

				} else {

					Message.add({
						'status': 'error',
						'text': 'Você não tem permissão para editar este local'
					});

				}

			};
		}

	}
];
},{"./featureToMapObjService":21}],20:[function(require,module,exports){
'use strict';

var featureToMapObj = require('./featureToMapObjService');

/*
 * Feature edit controller
 */

exports.FeatureEditCtrl = [
	'$scope',
	'$rootScope',
	'$timeout',
	'Feature',
	'Maki',
	'Layer',
	'MessageService',
	'GeocodeService',
	'MapService',
	function($scope, $rootScope, $timeout, Feature, Maki, Layer, Message, Geocode, MapService) {

		var layer;

		var draw;

		$scope.$layer = Layer;

		$scope.$watch('$layer.edit()', function(editing) {
			layer = editing;
			var map = MapService.get();
			if(map) {
				map.on('draw:created', function(e) {
					$scope.drawing = false;
					$scope.editing.geometry = e.layer.toGeoJSON().geometry;
					init($scope.editing);
				});
			}
		});

		$scope.$feature = Feature;

		$scope.$watch('$feature.get()', function(features) {
			$scope.features = features;
		});

		var originalEditing;

		var init = function(editing) {
			$scope.tool = false;
			$scope.marker = false;
			$scope._data = {};
			$scope.editing = angular.copy(editing);
			originalEditing = angular.copy(editing);
			if(draw) {
				draw.disable();
			}
			if(editing) {
				$scope.setMarker();
				if($scope.editing.geometry && editing.geometry.type == 'Point' && !editing.geometry.coordinates) {
					MapService.get().on('click', addMarkerOnClick);
				} else {
					if(MapService.get())
						MapService.get().off('click', addMarkerOnClick);
				}
				$rootScope.$broadcast('feature.edit.start', editing);
			} else {
				$rootScope.$broadcast('feature.edit.stop');
			}
			if(MapService.get()) {
				window.dispatchEvent(new Event('resize'));
				setTimeout(function() {
					MapService.get().invalidateSize(false);
					window.dispatchEvent(new Event('resize'));
				}, 300);
			}
		}

		$scope.$watch('$feature.edit()', init);

		$scope._data = {};

		$scope.marker = false;

		$scope.defaults = {
			scrollWheelZoom: false
		};

		$scope.newFeature = function(type) {
			Feature.edit({
				geometry: {
					type: type
				},
				properties: {}
			});
			$scope.setMarker(false);
		}

		var addMarkerOnClick = function(LatLng) {

			var LatLng = LatLng.latlng;

			if(!$scope.marker) {
				$scope.editing.geometry.coordinates = [
					LatLng.lng,
					LatLng.lat
				];
				init($scope.editing);
			}

		}

		$scope.setMarker = function(focus) {

			var map = MapService.get();

			if(!map)
				return false;

			MapService.clearFeatures();

			if($scope.editing) {

				if($scope.editing.geometry) {

					if($scope.editing.geometry.coordinates) {

						$scope.marker = featureToMapObj($scope.editing, {
							draggable: true
						});

						if($scope.editing.geometry.type == 'Point') {

							$scope.marker
								.bindPopup('<p class="tip">Arraste para alterar a localização.</p>')
								.on('dragstart', function() {
									$scope.marker.closePopup();
								})
								.on('drag', function() {
									$scope.marker.closePopup();
									var coordinates = $scope.marker.getLatLng();
									$scope.editing.geometry.coordinates = [
										coordinates.lng,
										coordinates.lat
									];
								});

							$scope.marker.openPopup();

							if(focus !== false) {
								window.dispatchEvent(new Event('resize'));
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(true);
									map.setView($scope.marker.getLatLng(), 15, {
										reset: true
									});
									map.invalidateSize(true);
								}, 200);
							}

						} else {

							if(($scope.editing.source == 'local' || !$scope.editing.source) && _.flatten($scope.editing.geometry.coordinates).length < 250) {
								$scope.marker.editing.enable();

								$scope.marker.on('edit', function(e) {
									$scope.editing.geometry = e.target.toGeoJSON().geometry;
								});
							}

							if(focus !== false) {
								window.dispatchEvent(new Event('resize'));
								setTimeout(function() {
									window.dispatchEvent(new Event('resize'));
									map.invalidateSize(false);
									map.fitBounds($scope.marker.getBounds());
								}, 300);
							}

						}

						MapService.addFeature($scope.marker);

					} else {

						switch($scope.editing.geometry.type) {
							case 'LineString':
								draw = new L.Draw.Polyline(map, {
									shapeOptions: {
										stroke: true,
										color: '#555',
										weight: 4,
										opacity: 0.5,
										fill: false,
										clickable: true
									}
								});
								draw.enable();
								break;
							case 'Polygon':
								draw = new L.Draw.Polygon(map, {
									shapeOptions: {
										stroke: true,
										color: '#555',
										weight: 4,
										opacity: 0.5,
										fill: true,
										clickable: true
									}
								});
								draw.enable();
								break;
						}

					}

				}

			}

		}

		$scope.save = function(silent) {

			$scope.$emit('feature.save.init', $scope.editing);

			if($scope.editing && $scope.editing._id) {

				Feature.resource.update({featureId: $scope.editing._id, layerId: layer._id}, $scope.editing, function(feature) {

					// Replace feature in local features
					angular.forEach($scope.features, function(feature, i) {
						if(feature._id == $scope.editing._id)
							$scope.features[i] = $scope.editing;
					});
					Feature.set($scope.features);

					$rootScope.$broadcast('features.updated');

					if(silent !== true) {
						Message.message({
							status: 'ok',
							text: 'Feature salva.'
						});
						Feature.edit(false);
					} else {
						Feature.edit(angular.copy($scope.editing));
					}

				});

			} else {

				var feature = new Feature.resource($scope.editing);

				feature.$save({layerId: layer._id}, function(feature) {

					// Locally push new feature
					$scope.features.push(feature);
					Feature.set($scope.features);

					// Update editing feature to saved data
					Feature.edit(angular.copy(feature));

					$rootScope.$broadcast('features.updated');

					Message.message({
						status: 'ok',
						text: 'Feature adicionada.'
					});

				});

			}

		}

		$scope.delete = function() {

			if(confirm('Você tem certeza que deseja remover esta feature?')) {

				Feature.resource.delete({featureId: $scope.editing._id, layerId: layer._id}, function(res) {

					Feature.set($scope.features.filter(function(f) {
						return f._id !== $scope.editing._id;
					}));

					$rootScope.$broadcast('features.updated');

					Message.message({
						status: 'ok',
						text: 'Feature removida.'
					});
					
					Feature.edit(false);

				});

			}

		}

		/*
		 * Tools
		 */

		$scope.tool = false;

		$scope.setTool = function(tool) {
			if(tool == $scope.tool)
				$scope.tool = false;
			else
				$scope.tool = tool;
		}

		$scope.geocode = function() {

			Geocode.get($scope._data.geocode)
				.success(function(res) {
					$scope._data.geocodeResults = res;
				})
				.error(function(err) {
					$scope._data.geocodeResults = [];
				});

		}

		$scope.setNominatimFeature = function(feature, type) {

			$scope.editing.source = 'osm';

			if(!$scope.editing.properties)
				$scope.editing.properties = {};

			if(!$scope.editing.title)
				$scope.editing.title = feature.display_name;

			if(type == 'geojson') {

				$scope.editing.geometry = feature.geojson;

			} else {

				$scope.editing.geometry = {
					type: 'Point',
					coordinates: [
						parseFloat(feature.lon),
						parseFloat(feature.lat)
					]
				};

			}

			init($scope.editing);

		}

		/*
		 * Property Editor
		 */

		$scope.properties = [];

		$scope.reservedProperties = [];

		$scope.isReservedProperty = function(propKey) {
			if($scope.reservedProperties.indexOf(propKey) !== -1)
				return true;
			return false;
		}

		$scope.removeProperty = function(id) {
			var properties = [];
			angular.forEach($scope.properties, function(property, i) {
				if(property._id !== id) {
					properties.push({
						_id: i,
						key: property.key,
						val: property.val
					});
				}
			});
			$scope.properties = properties;
		}

		$scope.removePropertyByKey = function(key) {
			var properties = [];
			angular.forEach($scope.properties, function(property, i) {
				if(property.key !== key) {
					properties.push({
						_id: i,
						key: property.key,
						val: property.val
					});
				}
			});
			$scope.properties = properties;
		}

		$scope.addProperty = function(key, val) {

			if(typeof key == 'undefined')
				key = '';

			if(typeof val == 'undefined')
				val = '';

			$scope.properties.push({
				_id: $scope.properties.length,
				key: key,
				val: val
			});

			$scope.properties = $scope.properties;

		}

		var getProperty = function(key) {
			return _.find($scope.properties, function(prop) { return prop.key == key; });
		};

		var updateProperties = function(properties) {
			for(var key in properties) {
				$scope.updateProperty(key, properties[key]);
			}
			$scope.properties = $scope.properties;
		};

		var updateProperty = function(key, val) {
			if(getProperty(key)) {
				getProperty(key).val = val;
			} else {
				$scope.addProperty(key, val);
			}
		}

		$scope.$watch('editing', function(editing) {
			if(editing) {
				var properties = editing.properties;
				$scope.properties = [];
				var i = 0;
				if(properties) {
					for(var key in properties) {
						$scope.properties.push({
							_id: i,
							key: key,
							val: properties[key]
						});
						i++;
					}
				}
				$scope.properties = $scope.properties; // trigger digest
			}
		});

		var saveProperties = function() {
			if($scope.editing) {
				var properties = {};
				if($scope.properties.length) {
					angular.forEach($scope.properties, function(prop) {
						properties[prop.key] = prop.val;
					});
				}
				$scope.editing.properties = angular.copy(properties);
			}
		};

		var unHookSaveProperties = $scope.$on('feature.save.init', saveProperties);
		$scope.$on('$destroy', unHookSaveProperties);

		/*
		 * Style editor
		 */

		var defaultStyles;

		$scope.$watch('$layer.edit()', function(layer) {
			if(layer) {
				defaultStyles = layer.styles;
			}
		}, true);

		$scope.reservedProperties = $scope.reservedProperties.concat([
			'marker-size',
			'marker-color',
			'marker-symbol',
			'stroke',
			'stroke-width',
			'stroke-opacity',
			'fill',
			'fill-opacity',
			'customStyle'
		]);

		$scope.maki = Maki.maki;
		$scope.makiSprite = Maki.makiSprite;

		var setStyles = function() {
			if($scope.editing.geometry.type == 'Point') {
				$scope.marker.setIcon(L.mapbox.marker.icon($scope.editing.styles));
			} else {
				$scope.marker.setStyle(L.mapbox.simplestyle.style({properties: $scope.editing.styles}));
			}
		}

		var unHookSetStyles = $scope.$on('feature.edit.start', function(event, feature) {

			if(feature && feature.properties && feature.geometry && feature.geometry.type && defaultStyles) {
				if(!feature.properties.customStyle) {
					feature.styles = _.extend(feature.styles || {}, defaultStyles[feature.geometry.type]);
				} else {
					feature.styles = feature.properties;
				}
				$scope.editing.styles = feature.styles;
			}

			if($scope.marker) {
				setStyles();
			}

		});

		$scope.$on('$destroy', unHookSetStyles);

		$scope.$watch('editing.styles', _.debounce(function(styles, oldVal) {

			if($scope.editing && $scope.editing.geometry && $scope.editing.geometry.coordinates) {

				var dS = angular.copy(defaultStyles[$scope.editing.geometry.type]);

				if(styles === false) {
					$scope.editing.styles = dS;
					window.dispatchEvent(new Event('resize'));
					delete $scope.editing.properties.customStyle;
					$scope.editing = $scope.editing; // trigger digest
					$scope.removePropertyByKey('customStyle');
				}

				if(angular.equals(styles, dS)) {
					for(var styleProp in dS) {
						$scope.removePropertyByKey(styleProp);
					}
					$scope.removePropertyByKey('customStyle');
				} else {
					for(var styleProp in dS) {
						updateProperty(styleProp, styles[styleProp]);
					}
					updateProperty('customStyle', 1);
				}

				setStyles();
			}

		}, 150), true);

		/*
		 * Save feature on layer save
		 */
		var unHookSaveLayer = $scope.$on('layer.save.success', function() {
			if($scope.editing) {
				$scope.save(true);
			}
		});
		$scope.$on('$destroy', unHookSaveLayer);

	}
];
},{"./featureToMapObjService":21}],21:[function(require,module,exports){
'use strict';

module.exports = function(feature, options, map) {

	var lFeature = false;

	if(feature.geometry && feature.geometry.coordinates) {

		if(!feature.properties) {
			feature.properties = {};
		}

		var coordinates = angular.copy(feature.geometry.coordinates);
		var leafletCoordinates = coordinates;

		if(feature.geometry.type == 'Polygon') {

			var leafletCoordinates = [];
			_.each(coordinates[0], function(latlng) {
				// Clear Y value
				latlng.splice(2,1);
				leafletCoordinates.push(latlng.reverse());
			});

			lFeature = L.polygon(leafletCoordinates, L.mapbox.simplestyle.style(feature));

		} else if(feature.geometry.type == 'LineString') {

			leafletCoordinates = [];
			_.each(coordinates, function(latlng) {
				// Clear Y value
				latlng.splice(2,1);
				leafletCoordinates.push(latlng.reverse());
			});

			lFeature = L.polyline(leafletCoordinates, L.mapbox.simplestyle.style(feature));

		} else if(feature.geometry.type == 'Point') {

			options = angular.extend({
				icon: L.mapbox.marker.icon(feature.properties)
			}, options);
				
			// Clear Y value
			coordinates.splice(2,1);
			leafletCoordinates = coordinates.reverse();

			lFeature = L.marker(leafletCoordinates, options);

		}

	}

	if(lFeature && map) {

		var popupOptions = {};

		if(feature.geometry.type !== 'Point')
			popupOptions.autoPan = false;

		var popup = L.popup(popupOptions).setContent('<h3 class="feature-title">' + feature.title + '</h3>');

		var followMousePopup = function(e) {
			popup.setLatLng(e.latlng);
		}

		lFeature
			.on('mouseover', function() {
				lFeature.openPopup();
				if(feature.geometry.type !== 'Point')
					map.on('mousemove', followMousePopup);
			})
			.on('mouseout', function() {
				lFeature.closePopup();
				if(feature.geometry.type !== 'Point')
					map.off('mousemove', followMousePopup);
			})
			.bindPopup(popup);
	}

	return lFeature;
}
},{}],22:[function(require,module,exports){
'use strict';

/*
 * Maki
 */
exports.Maki = [
	function() {

		var maki = require('maki/_includes/maki.json');

		var makiSprite = require('maki/www/maki-sprite.json');

		return {
			maki: maki,
			makiSprite: function(icon) {
				var pos = makiSprite[icon + '-24'];
				return 'background-position: -' + pos.x + 'px -' + pos.y + 'px;' + 'width:' + pos.width + 'px;' + 'height:' + pos.height + 'px;';
			}
		}

	}
]
},{"maki/_includes/maki.json":55,"maki/www/maki-sprite.json":56}],23:[function(require,module,exports){
'use strict';

/*
 * Feature service
 */
exports.Feature = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var features = [],
			filter = false,
			editing = false;

		return {
			resource: $resource(apiPrefix + '/features/:featureId', {}, {
				'query': {
					method: 'GET',
					isArray: false,
					loadingMessage: 'Carregando locais'
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando local'
				},
				'import': {
					method: 'POST',
					isArray: true,
					loadingMessage: 'Importando dados',
					url: apiPrefix + '/layers/:layerId/features/import'
				},
				'save': {
					method: 'POST',
					loadingMessage: 'Criando local',
					url: apiPrefix + '/layers/:layerId/features'
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo local',
					url: apiPrefix + '/layers/:layerId/features/:featureId'
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando local'
				}
			}),
			// Object sharing between controllers methods
			set: function(val) {
				features = val;
			},
			add: function(val) {
				features.push(val);
			},
			get: function() {
				return features;
			},
			edit: function(content) {
				if(typeof content !== 'undefined')
					editing = content;

				return editing;
			},
			getContents: function(feature, contents) {

				if(feature.contents.length) {

					if(contents && contents.length) {

						var featureContents = contents.filter(function(content) {
							return feature.contents.indexOf(content._id) !== -1;
						});

						return featureContents;

					}

				}

				return false;

			}
		};

	}
];
},{}],24:[function(require,module,exports){
/*
 * Array filter
 */

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisArg */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}
},{}],25:[function(require,module,exports){
'use strict';

angular
	.module('mapasColetivos.dataImport', [])
	.directive('importInput', require('./directive').ImportInput)
	.directive('importInputTrigger', require('./directive').ImportInputTrigger)
	.controller('DataImportCtrl', require('./controller').DataImportCtrl);
},{"./controller":26,"./directive":27}],26:[function(require,module,exports){
'use strict';

var readFile = require('./readfile');

exports.DataImportCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'Layer',
	'Feature',
	'MessageService',
	function($scope, $rootScope, $location, Layer, Feature, Message) {

		var disableInputChange = $scope.$on('import.input.change', function(e, node) {
			onSubmit(node);
		});

		$scope.$on('$destroy', function() {
			disableInputChange();
		});

		function onSubmit(node) {

			var files = node.files;
			if (!(files && files[0])) return;
				readFile.readAsText(files[0], function(err, text) {
				readFile.readFile(files[0], text, onImport);
			});

		}

        function onImport(err, gj, warning) {
        	if(err) {
        		Message.add({
        			status: 'error',
        			text: err.message
        		});
        	} else {

        		if(!Layer.edit()) {
        			var draft = new Layer.resource({
						title: 'Untitled',
						type: 'FeatureLayer',
						isDraft: false
					});
					draft.$save(function(draft) {

						doImport(draft.layer, gj, function() {
							$location.path('/layers/' + draft.layer._id + '/edit/');
						});
					});

        		} else {

        			var layer = Layer.edit();

        			doImport(layer, gj, function() {
        				if(layer.isDraft) {
        					layer.isDraft = false;
        					delete layer.features;
        					delete layer.contents;
        					Layer.resource.update({layerId: layer._id}, layer, function(res) {
        						window.location.reload();
        					})
        				} else {
        					window.location.reload();
        				}
        			});

        		}

        	}
        }

        function doImport(layer, gj, callback) {

			var features = [];
			angular.forEach(gj.features, function(feature) {

				if(feature.geometry) {

					if(feature.properties.title && typeof feature.properties.title == 'string')
						feature.title = feature.properties.title;
					else if(feature.properties.name && typeof feature.properties.name == 'string')
						feature.title = feature.properties.name;
					else
						feature.title = 'Untitled';

					if(feature.geometry.type == 'GeometryCollection' && feature.geometry.geometries) {

						angular.forEach(feature.geometry.geometries, function(geometry) {
							var collectionFeature = angular.copy(feature);
							collectionFeature.geometry = geometry;
							features.push(collectionFeature);
						});

					} else {

						features.push(feature);

					}

				}

			});

			Feature.resource.import({layerId: layer._id}, features, callback);

        }

	}
];
},{"./readfile":28}],27:[function(require,module,exports){
'use strict';

exports.ImportInput = [
	'$rootScope',
	function($rootScope) {

		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				angular.element(element)
					.on('change', function() {
						scope.$emit('import.input.change', this);
					});
			}
		}

	}
];

exports.ImportInputTrigger = [
	function() {

		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				angular.element(element).on('click', function() {
					angular.element('#' + attrs.importInputTrigger).trigger('click');
				});
			}
		}

	}
];
},{}],28:[function(require,module,exports){
var topojson = require('topojson'),
    toGeoJSON = require('togeojson'),
    csv2geojson = require('csv2geojson'),
    osmtogeojson = require('osmtogeojson');

module.exports.readDrop = readDrop;
module.exports.readAsText = readAsText;
module.exports.readFile = readFile;

function readDrop(callback) {
    return function() {
        var results = [];
        var errors = [];
        var warnings = [];
        if (d3.event.dataTransfer && d3.event.dataTransfer &&
           d3.event.dataTransfer.files && d3.event.dataTransfer.files.length) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            var remaining = d3.event.dataTransfer.files.length;
            [].forEach.call(d3.event.dataTransfer.files, function(f) {
                readAsText(f, function(err, text) {
                    if (err) {
                        errors.push(err);
                        if (!--remaining) finish(errors, results);
                    } else {
                        readFile(f, text, function(err, res, war) {
                            if (err) errors.push(err);
                            if (res) results.push(res);
                            if (war) results.push(war);
                            if (!--remaining) finish(errors, results, war);
                        });
                    }
                });
            });
        } else {
            return callback({
                message: 'No files were dropped'
            });
        }

        function finish(errors, results, war) {
            // if no conversions suceeded, return the first error
            if (!results.length && errors.length) return callback(errors[0], null, war);
            // otherwise combine results
            return callback(null, {
                type: 'FeatureCollection',
                features: results.reduce(function(memo, r) {
                    if (r.features) memo = memo.concat(r.features);
                    else if (r.type === 'Feature') memo.push(r);
                    return memo;
                }, [])
            }, war);
        }
    };
}

function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
            callback({
                message: 'Dropped file was unreadable'
            });
        };
    } catch (e) {
        callback({
            message: 'Dropped file was unreadable'
        });
    }
}

function readFile(f, text, callback) {

    var fileType = detectType(f);

    if (!fileType) {
        var filename = f.name ? f.name.toLowerCase() : '',
            pts = filename.split('.');
        return callback({
            message: 'Could not detect file type'
        });
    } else if (fileType === 'kml') {
        var kmldom = toDom(text);
        if (!kmldom) {
            return callback({
                message: 'Invalid KML file: not valid XML'
            });
        }
        var warning;
        if (kmldom.getElementsByTagName('NetworkLink').length) {
            warning = {
                message: 'The KML file you uploaded included NetworkLinks: some content may not display. ' +
                  'Please export and upload KML without NetworkLinks for optimal performance'
            };
        }
        callback(null, toGeoJSON.kml(kmldom), warning);
    } else if (fileType === 'xml') {
        var xmldom = toDom(text),
            result;
        if (!xmldom) {
            return callback({
                message: 'Invalid XML file: not valid XML'
            });
        }
        result = osmtogeojson.toGeojson(xmldom);
        // only keep object tags as properties
        result.features.forEach(function(feature) {
            feature.properties = feature.properties.tags;
        });
        callback(null, result);
    } else if (fileType === 'gpx') {
        callback(null, toGeoJSON.gpx(toDom(text)));
    } else if (fileType === 'geojson') {
        try {
            gj = JSON.parse(text);
            if (gj && gj.type === 'Topology' && gj.objects) {
                var collection = { type: 'FeatureCollection', features: [] };
                for (var o in gj.objects) {
                    var ft = topojson.feature(gj, gj.objects[o]);
                    if (ft.features) collection.features = collection.features.concat(ft.features);
                    else collection.features = collection.features.concat([ft]);
                }
                return callback(null, collection);
            } else {
                return callback(null, gj);
            }
        } catch(err) {
            alert('Invalid JSON file: ' + err);
            return;
        }
    } else if (fileType === 'dsv') {
        csv2geojson.csv2geojson(text, {
            delimiter: 'auto'
        }, function(err, result) {
            if (err) {
                return callback({
                    type: 'geocode',
                    result: result,
                    raw: text
                });
            } else {
                return callback(null, result);
            }
        });
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    function detectType(f) {
        var filename = f.name ? f.name.toLowerCase() : '';
        function ext(_) {
            return filename.indexOf(_) !== -1;
        }
        if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
            return 'kml';
        }
        if (ext('.gpx')) return 'gpx';
        if (ext('.geojson') || ext('.json') || ext('.topojson')) return 'geojson';
        if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
            return 'dsv';
        }
        if (ext('.xml') || ext('.osm')) return 'xml';
    }
}

},{"csv2geojson":52,"osmtogeojson":57,"togeojson":63,"topojson":"BOmyIj"}],29:[function(require,module,exports){
'use strict';

/*
 * layer controller
 */

exports.LayerActionsCtrl = [
	'$rootScope',
	'$scope',
	'$q',
	'$location',
	'MessageService',
	'Layer',
	'LayerShare',
	'NewLayer',
	'TileLayerEditor',
	function($rootScope, $scope, $q, $location, Message, Layer, LayerShare, NewLayerBox, TileLayerEditor) {

		$scope.getUrl = function(layer) {

			var url = window.location.protocol + '//' + window.location.host + '/layers/' + layer._id;

			return url;

		};

		/*
		 * Permission control
		 */
		$scope.canEdit = function(layer) {
			return Layer.canEdit(layer);
		};
		$scope.canDelete = function(layer) {
			return Layer.canDelete(layer);
		};
		$scope.isOwner = function(layer) {
			return Layer.isOwner(layer);
		};
		$scope.isContributor = function(layer) {
			return Layer.isContributor(layer);
		};

		$scope.edit = function(layer) {

			if(layer.type == 'TileLayer')
				$scope.editTileLayer(layer);
			else
				$location.path('/layers/' + layer._id + '/edit/');

		};

		$scope.addContributor = function(email, layer) {

			Layer.resource.addContributor({layerId: layer._id, email: email}, function(res) {

				layer.contributors = res.layer.contributors;

				$rootScope.$broadcast('layer.contributor.added', layer);

				$scope.newContributor = '';

			});

		}

		$scope.removeContributor = function(contributor, layer) {

			Layer.resource.removeContributor({layerId: layer._id, contributorId: contributor._id}, function(res) {
				console.log(res);
			});

			$rootScope.$broadcast('layer.contributor.removed', layer);

		}

		$scope.new = function() {

			NewLayerBox.activate({
				newLayer: function(type, service) {
					this.close();
					if(type == 'TileLayer') {
						var layer = {
							type: 'TileLayer',
							visibility: 'Private',
							properties: {
								service: service
							}
						}
						$scope.editTileLayer(layer);
					} else {
						$location.path('/layers/new/');
					}
				},
				close: function() {
					NewLayerBox.deactivate();
				}
			});

			$rootScope.$on('$stateChangeStart', _.once(function() {
				NewLayerBox.deactivate();
			}));

		}

		$scope.editTileLayer = function(layer) {

			TileLayerEditor.activate({
				saveTileLayer: function(layer) {
					if(!layer._id) {

						var newLayer = new Layer.resource(layer);
						newLayer.$save(function(res) {
							TileLayerEditor.deactivate();
							$scope.editTileLayer(res.layer);
							$rootScope.$broadcast('layer.add.success', res.layer);
						});

					} else {

						$scope.save(layer);

					}
				},
				close: function() {
					TileLayerEditor.deactivate();
				},
				layer: layer
			});

		}

		$scope.save = function(layer) {

			layer.isDraft = false;

			Layer.resource.update({layerId: layer._id}, layer, function(res) {
				$rootScope.$broadcast('layer.save.success', res.layer);
			});

		};

		$scope.delete = function(layer, callback) {

			if(confirm('Você tem certeza que deseja remover esta camada?')) {
				Layer.resource.delete({layerId: layer._id}, function(res) {
					$rootScope.$broadcast('layer.delete.success', layer);
				});
			}

		};

		$scope.share = function(layer) {
			LayerShare.activate({
				layer: layer,
				social: {
					facebook: 'http://facebook.com/share.php?u=' + $scope.getUrl(layer),
					twitter: 'http://twitter.com/share?url=' + $scope.getUrl(layer)
				},
				socialWindow: function(url, type) {
					window.open(url, type, "width=550,height=300,resizable=1");
				},
				close: function() {
					LayerShare.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				LayerShare.deactivate();
			});
		};

		$scope.templates = {
			list: '/views/layer/list-item.html'
		};

	}
];
},{}],30:[function(require,module,exports){
'use strict';

require('../common/geocode');

angular
	.module('mapasColetivos.layer', [
		'ngResource',
		'btford.modal',
		'infinite-scroll',
		'mapasColetivos.geocode',
		'mapasColetivos.feature',
		'mapasColetivos.content'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('dashboard.layers', {
					url: 'layers/',
					templateUrl: '/views/dashboard/layers.html'
				})
				.state('layers', {
					url: '/layers/',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/index.html'
				})
				.state('newLayer', {
					url: '/layers/new/',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/index.html'
				})
				.state('singleLayer', {
					url: '/layers/:layerId/',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/show.html'
				})
				.state('singleLayer.content', {
					url: 'content/:contentId/'
				})
				.state('singleLayer.feature', {
					url: 'feature/:featureId/'
				})
				.state('editLayer', {
					url: '/layers/:layerId/edit/',
					controller: 'LayerCtrl',
					templateUrl: '/views/layer/edit.html'
				});
		}
	])
	.factory('Layer', require('./service.js').Layer)
	.factory('LayerShare', require('./share').shareService)
	.factory('NewLayer', require('./new').newLayerService)
	.factory('TileLayerEditor', require('./tilelayer').tileLayerService)
	.controller('LayerActionsCtrl', require('./actions').LayerActionsCtrl)
	.controller('LayerCtrl', require('./controller').LayerCtrl);
},{"../common/geocode":3,"./actions":29,"./controller":31,"./new":32,"./service.js":33,"./share":34,"./tilelayer":35}],31:[function(require,module,exports){
'use strict';

/*
 * Layer controller
 */
exports.LayerCtrl = [
	'$scope',
	'$rootScope',
	'$location',
	'$state',
	'$stateParams',
	'$q',
	'Page',
	'Layer',
	'Feature',
	'Maki',
	'Content',
	'MessageService',
	'LoadingService',
	'MapService',
	'MapView',
	function($scope, $rootScope, $location, $state, $stateParams, $q, Page, Layer, Feature, Maki, Content, Message, Loading, MapService, MapView) {

		$scope.$layer = Layer;
		$scope.$feature = Feature;
		$scope.$content = Content;

		var mapFeatures;

		var populateMap = function(features, layer, force, focus) {

			// Repopulate map if feature in scope has changed
			if(!angular.equals(mapFeatures, features) || force === true) {

				mapFeatures = angular.copy(features);

				MapService.clearFeatures();

				if(features) {

					angular.forEach(features, function(feature) {

						var f = angular.copy(feature);

						var properties = angular.copy(layer.styles[f.geometry.type]);

						_.extend(properties, f.properties || {});

						f.properties = properties;

						var marker = require('../feature/featureToMapObjService')(f, null, MapService.get());

						if(marker) {

							marker.on('click', function() {
								$rootScope.$broadcast('marker.clicked', f, layer);
							});

							MapService.addFeature(marker);

						}

					});
				}

				if(focus !== false) {

					window.dispatchEvent(new Event('resize'));
					setTimeout(function() {
						MapService.get().invalidateSize(false);
						window.dispatchEvent(new Event('resize'));
						MapService.fitFeatureLayer();
					}, 300);
				}

			}

		}

		// New layer
		if($location.path() == '/layers/new/') {

			Message.disable();

			var draft = new Layer.resource({
				title: 'Untitled',
				type: 'FeatureLayer'
			});
			draft.$save(function(draft) {
				Message.enable();
				$location.path('/layers/' + draft.layer._id + '/edit/').replace();
			});

		// Single layer
		} else if($stateParams.layerId) {

			var origLayer;

			$scope.$on('layer.delete.success', function() {
				$location.path('/dashboard/layers').replace();
			});

			Layer.resource.get({layerId: $stateParams.layerId}, function(layer) {

				if(!layer.styles) {
					layer.styles = {
						Point: {
							'marker-size': 'medium',
							'marker-color': '#7e7e7e',
							'marker-symbol': ''
						},
						Polygon: {
							'stroke': '#555555',
							'stroke-width': 2,
							'stroke-opacity': 1,
							'fill': '#555555',
							'fill-opacity': 0.5
						},
						LineString: {
							'stroke': '#555555',
							'stroke-width': 2,
							'stroke-opacity': 1
						}
					};
				}

				origLayer = angular.copy(layer);
				$scope.layer = angular.copy(layer);

				$scope.$watch('layer.styles', function() {
					Layer.edit($scope.layer); // trigger digest
				});

				$scope.baseUrl = '/layers/' + layer._id;

				Page.setTitle(layer.title);

				var map = MapService.init('layer-map', {
					center: [0,0],
					zoom: 2
				});

				if(!layer.description && !layer.features.length && !layer.contents.length) {
					MapView.sidebar(false);
				} else {
					MapView.sidebar(true);
				}

				if(layer.type == 'TileLayer') {

					MapService.removeBaseLayer();

					var tilelayer = MapService.addTileLayer(layer.url);

					if(layer.properties.service == 'mapbox') {
						tilelayer.on('load', _.once(function() {
							MapService.renderTileJSON(tilelayer.getTileJSON());
						}));
					}

				} else {

					if(!layer.contributors)
						layer.contributors = [];

					$scope.fitMarkerLayer = function() {
						MapService.fitFeatureLayer();
					}

					// Init features
					Feature.set(angular.copy($scope.layer.features));
					populateMap($scope.layer.features, $scope.layer, true);
					
					setTimeout(function() {
						MapService.fitFeatureLayer();
					}, 200);

					var viewingContent = false;
					$scope.$on('content.filtering.started', function(event, c, cF) {
						viewingContent = true;
						if(cF.length) {
							populateMap(cF, layer);
						}
					});

					$scope.$on('content.filtering.closed', function() {
						if(viewingContent) {
							populateMap(layer.features, layer);
							viewingContent = false;
						}
					});

					// Set content shared data
					Content.set(layer.contents);

					$rootScope.$broadcast('data.ready', layer);

					MapService.get().invalidateSize(true);

				}

				/*
				 * Edit functions
				 */
				if($location.path().indexOf('edit') !== -1) {

					$scope.previewLayer = function() {
						populateMap($scope.layer.features, $scope.layer, true, false);
					};

					var destroyConfirmation = $rootScope.$on('$stateChangeStart', function(event) {
						var editing = angular.copy($scope.layer);
						var original = angular.copy(origLayer);
						delete editing.features;
						delete editing.contents;
						delete original.features;
						delete original.contents;
						if(!angular.equals(editing, original)) {
							if(!confirm('Deseja sair sem salvar alterações?'))
								event.preventDefault();
							else
								Layer.deleteDraft($scope.layer);
						}
					});

					$scope.$on('$destroy', function() {
						destroyConfirmation();
					});

					setTimeout(function() {
						window.dispatchEvent(new Event('resize'));
					}, 100);

					if(!Layer.canEdit(layer)) {
						$location.path('/layers/' + layer._id);
						Message.add({
							status: 'error',
							text: 'Sem permissões para editar esta camada'
						});
					}

					if(Layer.isOwner(layer)) {
						$scope.activeObj = 'settings';
					} else {
						$scope.activeObj = 'feature';
					}

					$scope.layerObj = function(objType) {
						if($scope.activeObj == objType)
							return 'active';

						return false;
					}

					$scope.setLayerObj = function(obj) {

						$scope.activeObj = obj;
						setTimeout(function() {
							window.dispatchEvent(new Event('resize'));
						}, 100);

					}

					$scope.$watch('activeObj', function(active) {

						Feature.edit(false);
						Content.edit(false);
						$scope.$broadcast('layerObjectChange', active);

					});

					Layer.edit(layer);

					$scope.$on('$destroy', function() {
						Layer.edit(false);
					});

					var unHookFeaturesUpdate = $scope.$on('features.updated', function() {
						$scope.layer.features = Feature.get();
					});
					$scope.$on('$destroy', unHookFeaturesUpdate);

					$scope.$watch('$feature.edit()', function(editingFeature) {
						if(!editingFeature)
							populateMap($scope.layer.features, $scope.layer, true);
					});

					$scope.$watch('$content.get()', function(contents) {
						$scope.layer.contents = contents;
					});

					$scope.$watch('$feature.get()', function(features) {
						$scope.layer.features = features;
					});

					if($scope.layer.title == 'Untitled') {
						$scope.layer.title = '';
						Page.setTitle('Nova camada');
					}

					$scope.$on('layer.save.success', function(event, layer) {
						Page.setTitle(layer.title);
						origLayer = angular.copy(layer);
						$scope.layer = angular.copy(layer);
						populateMap($scope.layer.features, $scope.layer, true, false);
					});
					
					$scope.close = function() {

						if(Layer.isDraft($scope.layer)) {
							$location.path('/dashboard/layers').replace();
						} else {
							$location.path('/layers/' + layer._id);
						}

					}

					/*
					 * Styles
					 */

					$scope.maki = Maki.maki;
					$scope.makiSprite = Maki.makiSprite;

				} else {

					$scope.$on('marker.clicked', function(event, feature) {

						$state.go('singleLayer.feature', {
							featureId: feature._id
						});

					});

				}

			}, function() {

				$location.path('/layers').replace();

			});

			$scope.$on('$destroy', function() {
				MapService.destroy();
				$scope.features = [];
				$scope.contents = [];
				Feature.set([]);
				Content.set([]);
			});

		// All layers
		} else {

			Page.setTitle('Camadas');

			Layer.resource.query(function(res) {
				$scope.layers = res.layers;

				$scope.$watch('search', _.debounce(function(text) {

					if(text) {

						Layer.resource.query({
							search: text
						}, function(searchRes) {
							$scope.layers = searchRes.layers;
						});

					} else {

						Layer.resource.query(function(res) {
							$scope.layers = res.layers;
						});

					}

				}, 300));
			});

		}

		$scope.$on('layer.page.next', function(event, res) {
			if(res.layers.length) {
				angular.forEach(res.layers, function(layer) {
					$scope.layers.push(layer);
				});
				$scope.layers = $scope.layers; // trigger digest
			}
		});

	}

];
},{"../feature/featureToMapObjService":21}],32:[function(require,module,exports){
'use strict';

exports.newLayerService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'layer',
			templateUrl: '/views/layer/new.html'
		});
	}
];
},{}],33:[function(require,module,exports){
'use strict';

/*
 * Layer service
 */
exports.Layer = [
	'$resource',
	'$rootScope',
	'apiPrefix',
	'SessionService',
	'LoadingService',
	'MessageService',
	function($resource, $rootScope, apiPrefix, Session, Loading, Message) {

		var editing = false;

		var params = {};

		return {
			resource: $resource(apiPrefix + '/layers/:layerId', null, {
				'query': {
					isArray: false,
					method: 'GET',
					loadingMessage: 'Carregando camadas',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				'userLayers': {
					isArray: false,
					method: 'GET',
					url: apiPrefix + '/user/layers',
					loadingMessage: 'Carregando camadas',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando camada'
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando camada'
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo camada'
				},
				'addContributor': {
					url: apiPrefix + '/layers/:layerId/contributors/add',
					method: 'PUT',
					loadingMessage: 'Adicionando colaborador',
					params: {
						layerId: '@layerId',
						email: '@email'
					}
				},
				'removeContributor': {
					url: apiPrefix + '/layers/:layerId/contributors/remove',
					method: 'DELETE',
					loadingMessage: 'Removendo colaborador',
					params: {
						layerId: '@layerId',
						contributorId: '@contributorId'
					}
				}
			}),
			busy: false,
			nextPage: function() {
				var self = this;
				Loading.disable();
				if(!self.busy) {
					self.busy = true;
					this.resource.query(_.extend(params, {
						page: params.page + 1
					}), function(res) {
						if(res.layers.length) {
							self.busy = false;
							$rootScope.$broadcast('layer.page.next', res);
						}
						Loading.enable();
					});
				}
			},
			edit: function(layer) {
				if(typeof layer !== 'undefined')
					editing = layer;

				return editing;
			},
			isDraft: function(layer) {
				return layer.isDraft;
			},
			deleteDraft: function(layer) {
				Message.disable();
				if(this.isDraft(layer)) {
					this.resource.delete({layerId: layer._id}, function() {
						Message.enable();
					});
				}
			},
			isOwner: function(layer) {

				if(!layer || !Session.user())
					return false;

				if(typeof layer.creator == 'string' && layer.creator == Session.user()._id) {
					return true;
				} else if(typeof layer.creator == 'object' && layer.creator._id == Session.user()._id) {
					return true;
				}

				return false;

			},
			isContributor: function(layer) {

				if(!layer || !Session.user())
					return false;

				var is = false;

				if(layer.contributors && layer.contributors.length) {
					angular.forEach(layer.contributors, function(contributor) {
						if(typeof contributor == 'string' && contributor == Session.user()._id)
							is = true;
						else if(typeof contributor == 'object' && contributor._id == Session.user()._id)
							is = true;
					});
				}

				return is;

			},
			canEdit: function(layer) {

				if(this.isOwner(layer) || this.isContributor(layer))
					return true;

				return false;

			},
			canDelete: function(layer) {

				if(this.isOwner(layer))
					return true;

				return false;
			}
		};

	}
];
},{}],34:[function(require,module,exports){
'use strict';

exports.shareService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'share',
			templateUrl: '/views/layer/share.html'
		});
	}
];
},{}],35:[function(require,module,exports){
'use strict';

exports.tileLayerService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'LayerActionsCtrl',
			controllerAs: 'actions',
			templateUrl: '/views/layer/tilelayer.html'
		});
	}
];
},{}],36:[function(require,module,exports){
'use strict';

/*
 * Map controller
 */

exports.MapActionsCtrl = [
	'$rootScope',
	'$scope',
	'$q',
	'$location',
	'MessageService',
	'SessionService',
	'Map',
	'MapShare',
	function($rootScope, $scope, $q, $location, Message, Session, Map, MapShare) {

		$scope.$session = Session;

		$scope.$watch('$session.user()', function(user) {
			$scope.user = user;
		});

		$scope.getUrl = function(map) {

			var url = window.location.protocol + '//' + window.location.host + '/maps/' + map._id;

			return url;

		};

		/*
		 * Permission control
		 */
		$scope.canEdit = function(map) {

			if(!map || !$scope.user)
				return false;

			if(typeof map.creator == 'string' && map.creator == $scope.user._id) {
				return true;
			} else if(typeof map.creator == 'object' && map.creator._id == $scope.user._id) {
				return true;
			}

			return false;

		};

		$scope.edit = function(map) {

			$location.path('/maps/' + map._id + '/edit');

		};

		$scope.save = function(map) {

			if(map.bounds) {
				map.southWest = map.bounds[0];
				map.northEast = map.bounds[1];
			}

			map.isDraft = false;

			var deferred = $q.defer();

			Map.resource.update({mapId: map._id}, map, function(map) {
				// Send back formatted map bounds
				if(map.southWest && map.northEast) {
					map.bounds = [map.southWest, map.northEast];
				}
				Message.message({
					status: 'ok',
					text: 'Mapa atualizado'
				});
				$rootScope.$broadcast('map.save.success', map);
				deferred.resolve(map);
			}, function(err){
				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});
				$rootScope.$broadcast('map.save.error', err);
				deferred.resolve(err);
			});

			return deferred.promise;

		};

		$scope.delete = function(map, callback) {

			if(confirm('Você tem certeza que deseja remover este mapa?')) {
				Map.resource.delete({mapId: map._id}, function(res) {
					$rootScope.$broadcast('map.delete.success', map);
				});
			}

		};

		$scope.share = function(map) {
			MapShare.activate({
				map: map,
				social: {
					facebook: 'http://facebook.com/share.php?u=' + $scope.getUrl(map),
					twitter: 'http://twitter.com/share?url=' + $scope.getUrl(map)
				},
				socialWindow: function(url, type) {
					window.open(url, type, "width=550,height=300,resizable=1");
				},
				close: function() {
					MapShare.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				MapShare.deactivate();
			});
		};

		$scope.templates = {
			list: '/views/map/list-item.html'
		};

	}
];
},{}],37:[function(require,module,exports){
'use strict';

/* 
 * Map module
 */
angular
	.module('mapasColetivos.map', [
		'btford.modal',
		'ui.sortable',
		'mapasColetivos.leaflet',
		'mapasColetivos.layer'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('dashboard.maps', {
					url: 'maps/',
					templateUrl: '/views/dashboard/maps.html'
				})
				.state('maps', {
					url: '/maps/',
					controller: 'MapCtrl',
					templateUrl: '/views/map/index.html'
				})
				.state('newMap', {
					url: '/maps/new/',
					controller: 'MapCtrl',
					templateUrl: '/views/map/index.html'
				})
				.state('singleMap', {
					url: '/maps/:mapId/',
					controller: 'MapCtrl',
					templateUrl: '/views/map/show.html'
				})
				.state('singleMap.content', {
					url: 'content/:contentId/'
				})
				.state('singleMap.feature', {
					url: 'feature/:featureId/'
				})
				.state('editMap', {
					url: '/maps/:mapId/edit/',
					controller: 'MapCtrl',
					templateUrl: '/views/map/edit.html'
				});
		}
	])
	.factory('Map', require('./service').Map)
	.factory('MapShare', require('./share').shareService)
	.controller('MapCtrl', require('./controller').MapCtrl)
	.controller('MapActionsCtrl', require('./actions').MapActionsCtrl);
},{"./actions":36,"./controller":38,"./service":39,"./share":40}],38:[function(require,module,exports){
'use strict';

/*
 * Map controller
 */

exports.MapCtrl = [
	'$scope',
	'$rootScope',
	'$timeout',
	'$location',
	'$state',
	'$stateParams',
	'Page',
	'Map',
	'Layer',
	'Content',
	'Feature',
	'MapService',
	'MapView',
	'MessageService',
	'SessionService',
	function($scope, $rootScope, $timeout, $location, $state, $stateParams, Page, Map, Layer, Content, Feature, MapService, MapView, Message, Session) {

		$scope.$session = Session;

		$scope.$watch('$session.user()', function(user) {
			$scope.user = user;
		});

		$scope.$map = Map;

		// New map
		if($location.path() == '/maps/new/') {

			var draft = new Map.resource({
				title: 'Untitled',
				center: [0,0],
				zoom: 2
			});
			draft.$save(function(draft) {
				$location.path('/maps/' + draft._id + '/edit/').replace();
			}, function(err) {
				// TODO error handling
			});

		} else if($stateParams.mapId) {

			var origMap;

			$scope.activeObj = 'settings';

			$scope.mapObj = function(objType) {
				if($scope.activeObj == objType)
					return 'active';

				return false;
			}

			$scope.setMapObj = function(obj) {

				$scope.activeObj = obj;
				setTimeout(function() {
					window.dispatchEvent(new Event('resize'));
				}, 100);

			}

			$scope.isEditing = function() {
				return $location.path().indexOf('edit') !== -1;
			}

			Map.resource.get({mapId: $stateParams.mapId}, function(map) {

				MapView.sidebar(true);

				Page.setTitle(map.title);

				origMap = map;

				$scope.map = angular.copy(map);

				$scope.baseUrl = '/maps/' + map._id;

				var mapOptions = {
					center: $scope.map.center ? $scope.map.center : [0,0],
					zoom: $scope.map.zoom ? $scope.map.zoom : 2
				};

				if(!$scope.isEditing()) {
					mapOptions = _.extend(mapOptions, {
						minZoom: $scope.map.minZoom ? $scope.map.minZoom : undefined,
						maxZoom: $scope.map.maxZoom ? $scope.map.maxZoom : undefined,
						maxBounds: $scope.map.southWest.length ? L.latLngBounds($scope.map.southWest, $scope.map.northEast) : undefined
					});
				}

				var map = MapService.init('map', mapOptions);

				if($scope.isEditing()) {

					var destroyConfirmation = $rootScope.$on('$stateChangeStart', function(event) {
						if(!angular.equals($scope.map, origMap))
							if(!confirm('Deseja sair sem salvar alterações?'))
								event.preventDefault();
							else
								Map.deleteDraft($scope.map);
					});

					$scope.$on('$destroy', function() {
						destroyConfirmation();
					});

					Layer.resource.query({
						creatorOnly: true
					}, function(res) {

						$scope.userLayers = res.layers;
						$scope.availableLayers = angular.copy($scope.userLayers);

					});

				}

				$scope.layerSearch = '';

				$scope.$watch('layerSearch', _.debounce(function(text) {

					if(text) {

						Layer.resource.query({
							search: text
						}, function(res) {

							if(res.layers) {

								$scope.availableLayers = res.layers;

							}

						});

					} else {

						$timeout(function() {
							$scope.availableLayers = angular.copy($scope.userLayers);
						}, 100);

					}

				}, 300));

				$scope.toggleLayer = function(layer) {

					if(!$scope.map.layers)
						$scope.map.layers = [];

					var mapLayers = angular.copy($scope.map.layers);

					if($scope.hasLayer(layer)) {
						if($scope.isEditing() && confirm('Tem certeza que gostaria de remover esta camada do seu mapa?'))
							mapLayers = mapLayers.filter(function(layerId) { return layerId !== layer._id; });
					} else {
						mapLayers.push(layer._id);
					}

					$scope.map.layers = mapLayers;

				};

				$scope.hasLayer = function(layer) {

					if(!$scope.map.layers)
						$scope.map.layers = [];

					return $scope.map.layers.filter(function(layerId) { return layerId == layer._id; }).length;

				};

				$scope.$watch('map.layers', function(layers) {

					markers = [];

					MapService.clearAll();

					$scope.layers = [];

					$scope.contents = [];

					angular.forEach(layers, function(layerId) {

						var layer,
							layerData;

						if(fetchedLayers[layerId]) {
							layer = fetchedLayers[layerId];
							renderLayer(layer);
						} else {
							Layer.resource.get({layerId: layerId}, function(layer) {
								layer = fetchedLayers[layer._id] = layer;
								renderLayer(layer);
							});
						}

					});

				});

				// Cache fetched layers
				var fetchedLayers = {};

				var markers = [];

				var renderLayer = function(layer) {

					// Add layer to map and get feature data
					var layerData = MapService.addLayer(layer);

					if(layer.type == 'FeatureLayer') {

						layer._mcData = layerData;

						angular.forEach(layerData.features, function(marker) {

							markers.push(marker);

							marker.on('click', function() {

								if(!$scope.isEditing()) {

									$state.go('singleMap.feature', {
										featureId: marker.mcFeature._id
									});

								} else {

									// Do something?

								}

							});

						});

					}

					$scope.layers.push(layer);

					if($scope.layers.length === $scope.map.layers.length) {
						// Fix ordering
						$scope.fixLayerOrdering();

						// Setup map content
						$scope.setupMapContent();
					}

				};

				$scope.fixLayerOrdering = function() {
					var ordered = [];
					angular.forEach($scope.map.layers, function(layerId) {
						ordered.push($scope.layers.filter(function(layer) { return layer._id == layerId; })[0]);
					});
					$scope.layers = ordered;
				};

				$scope.setupMapContent = function() {
					var contents = [];
					var features = [];
					angular.forEach($scope.layers, function(layer) {
						angular.forEach(layer.features, function(lF) {
							lF.layer = layer;
							features.push(lF);
						});
						angular.forEach(layer.contents, function(lC) {
							lC.layer = layer;
							contents.push(lC);
						});
					});
					Content.set(contents);
					Feature.set(features);
					$rootScope.$broadcast('data.ready', $scope.map);

					$scope.$on('features.updated', function(event, features) {

						filterFeatures(features);

					});
				};

				var filterFeatures = function(features) {

					var filteredGroup = L.featureGroup();
					var map = MapService.get();

					angular.forEach($scope.layers, function(layer) {

						if(layer.type == 'FeatureLayer') {

							var markerLayer = layer._mcData.featureLayer;
							var markers = layer._mcData.features;

							angular.forEach(markers, function(marker) {

								if(!features.filter(function(f) { return marker.mcFeature._id == f._id; }).length)
									markerLayer.removeLayer(marker);
								else {
									if(!markerLayer.hasLayer(marker))
										markerLayer.addLayer(marker);

									filteredGroup.addLayer(marker);
								}

							});

						}

					});

					if(map && features.length !== markers.length) {
						//map.fitBounds(filteredGroup.getBounds());
					}
					else {
						map.setView($scope.map.center, $scope.map.zoom);
					}

				}

				$scope.hideAllLayers = function() {

					angular.forEach($scope.layers, function(layer) {
						$scope.hideLayer(layer._mcData.markerLayer);
					});

				};

				$scope.hideLayer = function(layer) {

					MapService.get().removeLayer(layer);

				};

				$scope.showAllLayers = function() {

					angular.forEach($scope.layers, function(layer) {
						$scope.showLayer(layer._mcData.markerLayer);
					});

				};

				$scope.showLayer = function(layer) {

					MapService.get().addLayer(layer);

				};

				/*
				 * Sortable config
				 */
				$scope.sortLayer = {
					stop: function() {
						var newOrder = [];
						angular.forEach($scope.layers, function(layer) {
							newOrder.push(layer._id);
						});
						$scope.map.layers = newOrder;
					}
				}

				/*
				 * Map options auto input methods
				 */

				$scope.autoInput = {
					center: function() {
						var center = MapService.get().getCenter();
						$scope.map.center = [center.lat, center.lng];
					},
					zoom: function() {
						$scope.map.zoom = MapService.get().getZoom();
					},
					bounds: function() {
						var bounds = MapService.get().getBounds();
						$scope.map.bounds = [
							[
								bounds.getSouth(),
								bounds.getWest()
							],
							[
								bounds.getNorth(),
								bounds.getEast()
							]
						];
					},
					minZoom: function() {
						$scope.map.minZoom = MapService.get().getZoom();
					},
					maxZoom: function() {
						$scope.map.maxZoom = MapService.get().getZoom();
					},
					all: function() {
						this.center();
						this.zoom();
						this.bounds();
						this.minZoom();
						this.maxZoom();
					}
				};

				$scope.$on('map.save.success', function(event, map) {
					Page.setTitle(map.title);
					origMap = map;
					$scope.map = angular.copy(map);
				});

				$scope.$on('map.delete.success', function() {
					$location.path('/dashboard/maps').replace();
				});

				$scope.close = function() {

					if(Map.isDraft($scope.map)) {
						$location.path('/dashboard/maps');
					} else {
						$location.path('/maps/' + $scope.map._id);
					}

				}

				if($location.path().indexOf('edit') !== -1) {
					if($scope.map.title == 'Untitled') {
						$scope.map.title = '';
						Page.setTitle('Novo mapa');
					}
				}

			});

		} else {

			Page.setTitle('Mapas');

			Map.resource.query(function(res) {
				$scope.maps = res.maps;

				$scope.$watch('search', _.debounce(function(text) {

					if(text) {

						Map.resource.query({
							search: text
						}, function(searchRes) {

							$scope.maps = searchRes.maps;

						});

					} else {

						Map.resource.query(function(res) {
							$scope.maps = res.maps;
						});

					}

				}, 300));

			});

		}

		$scope.$on('map.page.next', function(event, res) {
			if(res.maps.length) {
				angular.forEach(res.maps, function(map) {
					$scope.maps.push(map);
				});
				$scope.maps = $scope.maps; // trigger digest
			}
		});

	}
];
},{}],39:[function(require,module,exports){
'use strict';

/*
 * Map service
 */

exports.Map = [
	'$resource',
	'$rootScope',
	'apiPrefix',
	'LoadingService',
	'MessageService',
	function($resource, $rootScope, apiPrefix, Loading, Message) {

		var params = {};

		return {
			resource: $resource(apiPrefix + '/maps/:mapId', null, {
				'query': {
					isArray: false,
					method: 'GET',
					loadingMessage: 'Carregando mapas',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				'userMaps': {
					isArray: false,
					method: 'GET',
					url: apiPrefix + '/user/maps',
					loadingMessage: 'Carregando mapas',
					params: {
						perPage: 10,
						page: 1
					},
					interceptor: {
						response: function(data) {
							params = data.config.params;
							return data.data;
						}
					}
				},
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando mapa',
					interceptor: {
						response: function(data) {
							var map = data.data;

							if(map.southWest && map.northEast) {
								map.bounds = [map.southWest, map.northEast];
							}

							return map;
						}
					}
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando mapa'
				},
				'delete': {
					method: 'DELETE',
					loadingMessage: 'Removendo mapa'
				}
			}),
			busy: false,
			nextPage: function() {
				var self = this;
				Loading.disable();
				if(!self.busy) {
					self.busy = true;
					this.resource.query(_.extend(params, {
						page: params.page + 1
					}), function(res) {
						if(res.maps.length) {
							self.busy = false;
							$rootScope.$broadcast('map.page.next', res);
						}
						Loading.enable();
					});
				}
			},
			isDraft: function(map) {
				return map.isDraft;
			},
			deleteDraft: function(map) {
				Message.disable();
				if(this.isDraft(map)) {
					this.resource.delete({mapId: map._id}, function() {
						Message.enable();
					});
				}
			}
		}

	}
];
},{}],40:[function(require,module,exports){
'use strict';

exports.shareService = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'MapActionsCtrl',
			controllerAs: 'share',
			templateUrl: '/views/map/share.html'
		});
	}
];
},{}],41:[function(require,module,exports){
'use strict';

angular
	.module('mapasColetivos.session', [])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('login', {
					url: '/login/',
					controller: 'LoginCtrl',
					templateUrl: '/views/login.html'
				});
		}
	])
	.factory('SessionService', require('./sessionService'))
	.controller('LoginCtrl', require('./loginCtrl'))
	.factory('authInterceptor', [
		'$rootScope',
		'$q',
		'$window',
		function($rootScope, $q, $window) {
			return {
				request: function(config) {
					config.params = config.params || {};
					if ($window.sessionStorage.accessToken) {
						config.params.access_token = $window.sessionStorage.accessToken;
					}
					return config;
				},
				responseError: function(rejection) {
					if (rejection.status === 401) {
						// handle the case where the user is not authenticated
					}
					return $q.reject(rejection);
				}
			};
		}
	])
	.config([
		'$httpProvider',
		function($httpProvider) {
			$httpProvider.interceptors.push('authInterceptor');
		}
	]);
},{"./loginCtrl":42,"./sessionService":43}],42:[function(require,module,exports){
'use strict';

module.exports = [
	'$scope',
	'SessionService',
	'$location',
	'config',
	'$sce',
	function($scope, Session, $location, config, $sce) {

		$scope.authFacebook = $sce.trustAsResourceUrl(config.server + '/auth/facebook');
		$scope.authGoogle = $sce.trustAsResourceUrl(config.server + '/auth/google');

		$scope.local = window.location.href;

		$scope.$session = Session;

		$scope.$watch('$session.authenticated()', function(auth) {
			$scope.isAuthenticated = auth;
		});

		$scope.login = function(provider) {
			if(provider == 'facebook') {

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
},{}],43:[function(require,module,exports){
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
		return {
			authenticate: function(credentials, callback) {
				$http
					.post(apiPrefix + '/users/session', credentials)
					.success(function(data, status, headers, config) {
						console.log(data);
						for(var key in data) {
							$window.sessionStorage[key] = data[key];
						}
						$rootScope.$broadcast('session.logged.in');
						if(typeof callback === 'function')
							callback(data);
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
},{}],44:[function(require,module,exports){
'use strict';

/* 
 * User module
 */
angular
	.module('mapasColetivos.user', [
		'btford.modal'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('user', {
					url: '/user/:userId/',
					controller: 'UserCtrl',
					templateUrl: '/views/user/show.html'
				})
				.state('user.layers', {
					url: 'layers/',
					templateUrl: '/views/user/layers.html'
				})
				.state('user.maps', {
					url: 'maps/',
					templateUrl: '/views/user/maps.html'
				});
		}
	])
	.factory('User', require('./service').User)
	.factory('ChangePwd', require('./changePwd').changePwd)
	.factory('ChangeEmail', require('./changeEmail').changeEmail)
	.controller('UserCtrl', require('./controller').UserCtrl);
},{"./changeEmail":45,"./changePwd":46,"./controller":47,"./service":48}],45:[function(require,module,exports){
'use strict';

exports.changeEmail = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'UserCtrl',
			controllerAs: 'share',
			templateUrl: '/views/user/change-email.html'
		});
	}
];
},{}],46:[function(require,module,exports){
'use strict';

exports.changePwd = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'UserCtrl',
			controllerAs: 'share',
			templateUrl: '/views/user/change-password.html'
		});
	}
];
},{}],47:[function(require,module,exports){
'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'User',
	'ChangePwd',
	'ChangeEmail',
	'Layer',
	'Map',
	'Page',
	'MessageService',
	function($scope, $rootScope, $state, $stateParams, User, ChangePwd, ChangeEmail, Layer, Map, Page, Message) {

		$scope.save = function(user) {

			User.resource.update({userId: user._id}, user, function(res) {

				$rootScope.$broadcast('user.save.success', user);

			}, function(err) {

				$rootScope.$broadcast('user.save.error', err);

			});

		}

		$scope.openPwdModal = function(user) {
			ChangePwd.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangePwd.deactivate();
			});
		};

		$scope.closePwdModal = function() {
			ChangePwd.deactivate();
		};

		$scope.openEmailModal = function(user) {
			ChangeEmail.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangeEmail.deactivate();
			});
		};

		$scope.closeEmailModal = function() {
			ChangeEmail.deactivate();
		};

		$scope.changePassword = function(user, chPwd) {

			if(typeof chPwd === 'undefined') {
				return false;
			}

			if(!chPwd.userPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir sua senha atual.'
				});
				return false;
			}

			if(!chPwd.newPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir uma nova senha.'
				});
				return false;
			}

			if(chPwd.newPwd != chPwd.validatePwd) {
				Message.message({
					status: 'error',
					text: 'As senhas não são compatíveis'
				})
				return false;
			}

			User.resource.update({userId: user._id}, chPwd);

		}

		$scope.changeEmail = function(user) {

			if(!user.newEmail) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir um email.'
				});
				return false;
			}

			User.resource.update({userId: user._id}, {
				email: user.newEmail
			});

		}

		$scope.profileUrl = function(user) {

			if(typeof user !== 'undefined') {

				var slug = user._id;

				if(user.username)
					slug =  user.username;
	
				return '/user/' + slug + '/';
	
			}

			return '';

		}

		/* 
		 * Profile page
		 */
		if($stateParams.userId) {

			User.resource.get({
				userId: $stateParams.userId
			}, function(res) {

				Page.setTitle(res.name);

				$scope.user = res;

			}, function(err) {

				Message.message({
					status: 'error',
					text: 'Ocorreu um erro.'
				});

			});

			/*
			 * Layer
			 */

			$scope.$layer = Layer;

			Layer.resource.query({
				userId: $stateParams.userId
			}, function(res) {
				$scope.totalLayer = res.layersTotal;
				$scope.layers = res.layers;
			});

			$scope.$on('layer.page.next', function(event, res) {
				if(res.layers.length) {
					angular.forEach(res.layers, function(layer) {
						$scope.layers.push(layer);
					});
					$scope.layers = $scope.layers; // trigger digest
				}
			});

			/*
			 * Map
			 */

			$scope.$map = Map;

			Map.resource.query({
				userId: $stateParams.userId
			}, function(res) {
				$scope.totalMap = res.mapsTotal;
				$scope.maps = res.maps;
			});

			$scope.$on('map.page.next', function(event, res) {
				if(res.maps.length) {
					angular.forEach(res.maps, function(map) {
						$scope.maps.push(map);
					});
					$scope.maps = $scope.maps; // trigger digest
				}
			});

			/*
			 * State management (profile sub content)
			 */

			var stateFunctions = function() {
				$scope.currentState = $state.current.name.replace('user.', '');
			}

			$rootScope.$on('$viewContentLoaded', function() {
				stateFunctions();
			});

			$rootScope.$on('$stateChangeSuccess', function() {
				stateFunctions();
			});

		}

	}
];
},{}],48:[function(require,module,exports){
'use strict';

/*
 * User service
 */

exports.User = [
	'$resource',
	'apiPrefix',
	function($resource, apiPrefix) {

		var gravatar = function(email, size) {

			if(typeof size === 'undefined')
				size = 100;

			return grvtr.create(email, {
				size: size,
				defaultImage: 'mm',
				rating: 'g'
			});
		}

		return {
			resource: $resource(apiPrefix + '/users/:userId', {}, {
				'get': {
					method: 'GET',
					loadingMessage: 'Carregando usuário',
					interceptor: {
						response: function(data) {
							var res = data.data;
							res.gravatar = function(size) {
								return gravatar(res.email, size);
							}
							return res;
						}
					}
				},
				'update': {
					method: 'PUT',
					loadingMessage: 'Atualizando usuário',
					url: apiPrefix + '/users'
				},
				'updatePwd': {
					method: 'PUT',
					loadingMessage: 'Alterando senha'
				}
			}),
			gravatar: gravatar
		}

	}
]
},{}],49:[function(require,module,exports){

},{}],50:[function(require,module,exports){
module.exports=require(49)
},{}],51:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],52:[function(require,module,exports){
var dsv = require('dsv'),
    sexagesimal = require('sexagesimal');

function isLat(f) { return !!f.match(/(Lat)(itude)?/gi); }
function isLon(f) { return !!f.match(/(L)(on|ng)(gitude)?/i); }

function keyCount(o) {
    return (typeof o == 'object') ? Object.keys(o).length : 0;
}

function autoDelimiter(x) {
    var delimiters = [',', ';', '\t', '|'];
    var results = [];

    delimiters.forEach(function(delimiter) {
        var res = dsv(delimiter).parse(x);
        if (res.length >= 1) {
            var count = keyCount(res[0]);
            for (var i = 0; i < res.length; i++) {
                if (keyCount(res[i]) !== count) return;
            }
            results.push({
                delimiter: delimiter,
                arity: Object.keys(res[0]).length,
            });
        }
    });

    if (results.length) {
        return results.sort(function(a, b) {
            return b.arity - a.arity;
        })[0].delimiter;
    } else {
        return null;
    }
}

function auto(x) {
    var delimiter = autoDelimiter(x);
    if (!delimiter) return null;
    return dsv(delimiter).parse(x);
}

function csv2geojson(x, options, callback) {

    if (!callback) {
        callback = options;
        options = {};
    }

    options.delimiter = options.delimiter || ',';

    var latfield = options.latfield || '',
        lonfield = options.lonfield || '';

    var features = [],
        featurecollection = { type: 'FeatureCollection', features: features };

    if (options.delimiter === 'auto' && typeof x == 'string') {
        options.delimiter = autoDelimiter(x);
        if (!options.delimiter) return callback({
            type: 'Error',
            message: 'Could not autodetect delimiter'
        });
    }

    var parsed = (typeof x == 'string') ? dsv(options.delimiter).parse(x) : x;

    if (!parsed.length) return callback(null, featurecollection);

    if (!latfield || !lonfield) {
        for (var f in parsed[0]) {
            if (!latfield && isLat(f)) latfield = f;
            if (!lonfield && isLon(f)) lonfield = f;
        }
        if (!latfield || !lonfield) {
            var fields = [];
            for (var k in parsed[0]) fields.push(k);
            return callback({
                type: 'Error',
                message: 'Latitude and longitude fields not present',
                data: parsed,
                fields: fields
            });
        }
    }

    var errors = [];

    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][lonfield] !== undefined &&
            parsed[i][lonfield] !== undefined) {

            var lonk = parsed[i][lonfield],
                latk = parsed[i][latfield],
                lonf, latf,
                a;

            a = sexagesimal(lonk, 'EW');
            if (a) lonk = a;
            a = sexagesimal(latk, 'NS');
            if (a) latk = a;

            lonf = parseFloat(lonk);
            latf = parseFloat(latk);

            if (isNaN(lonf) ||
                isNaN(latf)) {
                errors.push({
                    message: 'A row contained an invalid value for latitude or longitude',
                    row: parsed[i]
                });
            } else {
                if (!options.includeLatLon) {
                    delete parsed[i][lonfield];
                    delete parsed[i][latfield];
                }

                features.push({
                    type: 'Feature',
                    properties: parsed[i],
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(lonf),
                            parseFloat(latf)
                        ]
                    }
                });
            }
        }
    }

    callback(errors.length ? errors: null, featurecollection);
}

function toLine(gj) {
    var features = gj.features;
    var line = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    for (var i = 0; i < features.length; i++) {
        line.geometry.coordinates.push(features[i].geometry.coordinates);
    }
    line.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [line]
    };
}

function toPolygon(gj) {
    var features = gj.features;
    var poly = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    };
    for (var i = 0; i < features.length; i++) {
        poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
    }
    poly.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [poly]
    };
}

module.exports = {
    isLon: isLon,
    isLat: isLat,
    csv: dsv.csv.parse,
    tsv: dsv.tsv.parse,
    dsv: dsv,
    auto: auto,
    csv2geojson: csv2geojson,
    toLine: toLine,
    toPolygon: toPolygon
};

},{"dsv":53,"sexagesimal":54}],53:[function(require,module,exports){
var fs = require("fs");

module.exports = new Function("dsv.version = \"0.0.3\";\n\ndsv.tsv = dsv(\"\\t\");\ndsv.csv = dsv(\",\");\n\nfunction dsv(delimiter) {\n  var dsv = {},\n      reFormat = new RegExp(\"[\\\"\" + delimiter + \"\\n]\"),\n      delimiterCode = delimiter.charCodeAt(0);\n\n  dsv.parse = function(text, f) {\n    var o;\n    return dsv.parseRows(text, function(row, i) {\n      if (o) return o(row, i - 1);\n      var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n        return JSON.stringify(name) + \": d[\" + i + \"]\";\n      }).join(\",\") + \"}\");\n      o = f ? function(row, i) { return f(a(row), i); } : a;\n    });\n  };\n\n  dsv.parseRows = function(text, f) {\n    var EOL = {}, // sentinel value for end-of-line\n        EOF = {}, // sentinel value for end-of-file\n        rows = [], // output rows\n        N = text.length,\n        I = 0, // current character index\n        n = 0, // the current line number\n        t, // the current token\n        eol; // is the current token followed by EOL?\n\n    function token() {\n      if (I >= N) return EOF; // special case: end of file\n      if (eol) return eol = false, EOL; // special case: end of line\n\n      // special case: quotes\n      var j = I;\n      if (text.charCodeAt(j) === 34) {\n        var i = j;\n        while (i++ < N) {\n          if (text.charCodeAt(i) === 34) {\n            if (text.charCodeAt(i + 1) !== 34) break;\n            ++i;\n          }\n        }\n        I = i + 2;\n        var c = text.charCodeAt(i + 1);\n        if (c === 13) {\n          eol = true;\n          if (text.charCodeAt(i + 2) === 10) ++I;\n        } else if (c === 10) {\n          eol = true;\n        }\n        return text.substring(j + 1, i).replace(/\"\"/g, \"\\\"\");\n      }\n\n      // common case: find next delimiter or newline\n      while (I < N) {\n        var c = text.charCodeAt(I++), k = 1;\n        if (c === 10) eol = true; // \\n\n        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \\r|\\r\\n\n        else if (c !== delimiterCode) continue;\n        return text.substring(j, I - k);\n      }\n\n      // special case: last token before EOF\n      return text.substring(j);\n    }\n\n    while ((t = token()) !== EOF) {\n      var a = [];\n      while (t !== EOL && t !== EOF) {\n        a.push(t);\n        t = token();\n      }\n      if (f && !(a = f(a, n++))) continue;\n      rows.push(a);\n    }\n\n    return rows;\n  };\n\n  dsv.format = function(rows) {\n    if (Array.isArray(rows[0])) return dsv.formatRows(rows); // deprecated; use formatRows\n    var fieldSet = {}, fields = [];\n\n    // Compute unique fields in order of discovery.\n    rows.forEach(function(row) {\n      for (var field in row) {\n        if (!(field in fieldSet)) {\n          fields.push(fieldSet[field] = field);\n        }\n      }\n    });\n\n    return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {\n      return fields.map(function(field) {\n        return formatValue(row[field]);\n      }).join(delimiter);\n    })).join(\"\\n\");\n  };\n\n  dsv.formatRows = function(rows) {\n    return rows.map(formatRow).join(\"\\n\");\n  };\n\n  function formatRow(row) {\n    return row.map(formatValue).join(delimiter);\n  }\n\n  function formatValue(text) {\n    return reFormat.test(text) ? \"\\\"\" + text.replace(/\\\"/g, \"\\\"\\\"\") + \"\\\"\" : text;\n  }\n\n  return dsv;\n}\n" + ";return dsv")();

},{"fs":49}],54:[function(require,module,exports){
module.exports = function(x, dims) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return null;
    var r = /^([0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/,
        m = x.match(r);
    if (!m) return null;
    else if (m[4] && dims.indexOf(m[4]) === -1) return null;
    else return (((m[1]) ? parseFloat(m[1]) : 0) +
        ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
        ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
        ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1);
};

},{}],55:[function(require,module,exports){
module.exports=[
    {
        "name": "Circle stroked",
        "tags": [
            "circle",
            "disc",
            "shape",
            "shapes",
            "geometric",
            "stroke",
            "round"
        ],
        "icon": "circle-stroked"
    },
    {
        "name": "Circle solid",
        "tags": [
            "circle",
            "shape",
            "shapes",
            "geometric",
            "round"
        ],
        "icon": "circle"
    },
    {
        "name": "Square stroked",
        "tags": [
            "box",
            "square",
            "shapes",
            "shape",
            "geometric",
            "stroke"
        ],
        "icon": "square-stroked"
    },
    {
        "name": "Square solid",
        "tags": [
            "box",
            "square",
            "shape",
            "shapes",
            "geometric"
        ],
        "icon": "square"
    },
    {
        "name": "Triangle stroked",
        "tags": [
            "triangle",
            "shape",
            "shapes",
            "geometric",
            "stroke"
        ],
        "icon": "triangle-stroked"
    },
    {
        "name": "Triangle solid",
        "tags": [
            "triangle",
            "shape",
            "shapes",
            "geometric"
        ],
        "icon": "triangle"
    },
    {
        "name": "Star stroked",
        "tags": [
            "star",
            "shape",
            "shapes",
            "geometric",
            "stroke"
        ],
        "icon": "star-stroked"
    },
    {
        "name": "Star solid",
        "tags": [
            "star",
            "shape",
            "shapes",
            "geometric"
        ],
        "icon": "star"
    },
    {
        "name": "Cross",
        "tags": [
            "cross",
            "x",
            "ex",
            "shape",
            "shapes",
            "geometric"
        ],
        "icon": "cross"
    },
    {
        "name": "Marker Stroke",
        "tags": [
            "marker",
            "point",
            "shape",
            "shapes",
            "stroke"
        ],
        "icon": "marker-stroked"
    },
    {
        "name": "Marker Solid",
        "tags": [
            "marker",
            "point",
            "shape",
            "shapes"
        ],
        "icon": "marker"
    },
    {
        "name": "Religious Jewish",
        "tags": [
            "jewish",
            "judaism",
            "hebrew",
            "star",
            "david",
            "religious",
            "religion",
            "temple",
            "synagogue"
        ],
        "icon": "religious-jewish"
    },
    {
        "name": "Religious Christian",
        "tags": [
            "christian",
            "cross",
            "religious",
            "religion",
            "church",
            "cathedral"
        ],
        "icon": "religious-christian"
    },
    {
        "name": "Religious Muslim",
        "tags": [
            "muslim",
            "crescent",
            "star",
            "religious",
            "religion",
            "mosque"
        ],
        "icon": "religious-muslim"
    },
    {
        "name": "Cemetery",
        "tags": [
            "cemetery",
            "graveyard",
            "funeral",
            "religious",
            "religion",
            "memorial"
        ],
        "icon": "cemetery"
    },
    {
        "name": "Rocket",
        "tags": [
            "rocket",
            "space",
            "launch",
            "transportation"
        ],
        "icon": "rocket"
    },
    {
        "name": "Airport",
        "tags": [
            "airplane",
            "plane",
            "airport",
            "transportation"
        ],
        "icon": "airport"
    },
    {
        "name": "Heliport",
        "tags": [
            "heliport",
            "helicopter",
            "transportation"
        ],
        "icon": "heliport"
    },
    {
        "name": "Rail",
        "tags": [
            "rail",
            "train",
            "transportation"
        ],
        "icon": "rail"
    },
    {
        "name": "Rail Metro",
        "tags": [
            "rail",
            "train",
            "metro",
            "subway",
            "rapid-transit",
            "transportation"
        ],
        "icon": "rail-metro"
    },
    {
        "name": "Rail Light",
        "tags": [
            "rail",
            "train",
            "light-rail",
            "transportation"
        ],
        "icon": "rail-light"
    },
    {
        "name": "Bus",
        "tags": [
            "vehicle",
            "bus",
            "transportation"
        ],
        "icon": "bus"
    },
    {
        "name": "Fuel",
        "tags": [
            "petrol",
            "fuel",
            "gas",
            "transportation",
            "station"
        ],
        "icon": "fuel"
    },
    {
        "name": "Parking",
        "tags": [
            "parking",
            "transportation"
        ],
        "icon": "parking"
    },
    {
        "name": "Parking Garage",
        "tags": [
            "parking",
            "transportation",
            "garage"
        ],
        "icon": "parking-garage"
    },
    {
        "name": "Airfield",
        "tags": [
            "airfield",
            "airport",
            "plane",
            "landing strip"
        ],
        "icon": "airfield"
    },
    {
        "name": "Roadblock",
        "tags": [
            "roadblock",
            "stop",
            "warning",
            "dead end"
        ],
        "icon": "roadblock"
    },
    {
        "name": "Ferry",
        "tags": [
            "ship",
            "boat",
            "water",
            "ferry",
            "transportation"
        ],
        "icon": "ferry"
    },
    {
        "name": "Harbor",
        "tags": [
            "marine",
            "dock",
            "water",
            "wharf"
        ],
        "icon": "harbor"
    },
    {
        "name": "Bicycle",
        "tags": [
            "cycling",
            "cycle",
            "transportation"
        ],
        "icon": "bicycle"
    },
    {
        "name": "Park",
        "tags": [
            "recreation",
            "park",
            "forest",
            "tree",
            "green",
            "woods",
            "nature"
        ],
        "icon": "park"
    },
    {
        "name": "Park 2",
        "tags": [
            "recreation",
            "park",
            "forest",
            "tree",
            "green",
            "woods",
            "nature"
        ],
        "icon": "park2"
    },
    {
        "name": "Museum",
        "tags": [
            "recreation",
            "museum",
            "tourism"
        ],
        "icon": "museum"
    },
    {
        "name": "Lodging",
        "tags": [
            "lodging",
            "hotel",
            "recreation",
            "motel",
            "tourism"
        ],
        "icon": "lodging"
    },
    {
        "name": "Monument",
        "tags": [
            "recreation",
            "statue",
            "monument",
            "tourism"
        ],
        "icon": "monument"
    },
    {
        "name": "Zoo",
        "tags": [
            "recreation",
            "zoo",
            "animal",
            "giraffe"
        ],
        "icon": "zoo"
    },
    {
        "name": "Garden",
        "tags": [
            "recreation",
            "garden",
            "park",
            "flower",
            "nature"
        ],
        "icon": "garden"
    },
    {
        "name": "Campsite",
        "tags": [
            "recreation",
            "campsite",
            "camp",
            "camping",
            "tent",
            "nature"
        ],
        "icon": "campsite"
    },
    {
        "name": "Theatre",
        "tags": [
            "recreation",
            "theatre",
            "theater",
            "entertainment",
            "play",
            "performance"
        ],
        "icon": "theatre"
    },
    {
        "name": "Art gallery",
        "tags": [
            "art",
            "center",
            "museum",
            "gallery",
            "creative",
            "recreation",
            "entertainment",
            "studio"
        ],
        "icon": "art-gallery"
    },
    {
        "name": "Pitch",
        "tags": [
            "pitch",
            "track",
            "athletic",
            "sports",
            "field"
        ],
        "icon": "pitch"
    },
    {
        "name": "Soccer",
        "tags": [
            "soccer",
            "sports"
        ],
        "icon": "soccer"
    },
    {
        "name": "American Football",
        "tags": [
            "football",
            "sports"
        ],
        "icon": "america-football"
    },
    {
        "name": "Tennis",
        "tags": [
            "tennis",
            "court",
            "ball",
            "sports"
        ],
        "icon": "tennis"
    },
    {
        "name": "Basketball",
        "tags": [
            "basketball",
            "ball",
            "sports"
        ],
        "icon": "basketball"
    },
    {
        "name": "Baseball",
        "tags": [
            "baseball",
            "softball",
            "ball",
            "sports"
        ],
        "icon": "baseball"
    },
    {
        "name": "Golf",
        "tags": [
            "golf",
            "sports",
            "course"
        ],
        "icon": "golf"
    },
    {
        "name": "Swimming",
        "tags": [
            "swimming",
            "water",
            "swim",
            "sports"
        ],
        "icon": "swimming"
    },
    {
        "name": "Cricket",
        "tags": [
            "cricket",
            "sports"
        ],
        "icon": "cricket"
    },
    {
        "name": "Skiing",
        "tags": [
            "winter",
            "skiing",
            "ski",
            "sports"
        ],
        "icon": "skiing"
    },
    {
        "name": "School",
        "tags": [
            "school",
            "highschool",
            "elementary",
            "children",
            "amenity",
            "middle"
        ],
        "icon": "school"
    },
    {
        "name": "College",
        "tags": [
            "college",
            "school",
            "amenity",
            "university"
        ],
        "icon": "college"
    },
    {
        "name": "Library",
        "tags": [
            "library",
            "books",
            "amenity"
        ],
        "icon": "library"
    },
    {
        "name": "Post",
        "tags": [
            "post",
            "office",
            "amenity",
            "mail",
            "letter"
        ],
        "icon": "post"
    },
    {
        "name": "Fire station",
        "tags": [
            "fire",
            "station",
            "amenity"
        ],
        "icon": "fire-station"
    },
    {
        "name": "Town hall",
        "tags": [
            "townhall",
            "mayor",
            "building",
            "amenity",
            "government"
        ],
        "icon": "town-hall"
    },
    {
        "name": "Police",
        "tags": [
            "police",
            "jail",
            "arrest",
            "amenity",
            "station"
        ],
        "icon": "police"
    },
    {
        "name": "Prison",
        "tags": [
            "prison",
            "jail",
            "amenity"
        ],
        "icon": "prison"
    },
    {
        "name": "Embassy",
        "tags": [
            "embassy",
            "diplomacy",
            "consulate",
            "amenity",
            "flag"
        ],
        "icon": "embassy"
    },
    {
        "name": "Beer",
        "tags": [
            "bar",
            "beer",
            "drink",
            "commercial",
            "biergarten",
            "pub"
        ],
        "icon": "beer"
    },
    {
        "name": "Restaurant",
        "tags": [
            "restaurant",
            "commercial"
        ],
        "icon": "restaurant"
    },
    {
        "name": "Cafe",
        "tags": [
            "cafe",
            "coffee",
            "commercial",
            "tea"
        ],
        "icon": "cafe"
    },
    {
        "name": "Shop",
        "tags": [
            "shop",
            "mall",
            "commercial",
            "store"
        ],
        "icon": "shop"
    },
    {
        "name": "Fast Food",
        "tags": [
            "food",
            "fast",
            "commercial",
            "burger",
            "drive-through"
        ],
        "icon": "fast-food"
    },
    {
        "name": "Bar",
        "tags": [
            "bar",
            "drink",
            "commercial",
            "club",
            "martini",
            "lounge"
        ],
        "icon": "bar"
    },
    {
        "name": "Bank",
        "tags": [
            "bank",
            "atm",
            "commercial",
            "money"
        ],
        "icon": "bank"
    },
    {
        "name": "Grocery",
        "tags": [
            "food",
            "grocery",
            "commercial",
            "store",
            "market"
        ],
        "icon": "grocery"
    },
    {
        "name": "Cinema",
        "tags": [
            "cinema",
            "theatre",
            "film",
            "movie",
            "commercial",
            "theater",
            "entertainment"
        ],
        "icon": "cinema"
    },
    {
        "name": "Pharmacy",
        "tags": [
            "pharmacy",
            "drugs",
            "medication",
            "social",
            "medicine",
            "prescription"
        ],
        "icon": "pharmacy"
    },
    {
        "name": "Hospital",
        "tags": [
            "hospital",
            "health",
            "medication",
            "social",
            "medicine",
            "medical",
            "clinic"
        ],
        "icon": "hospital"
    },
    {
        "name": "Danger",
        "tags": [
            "minefield",
            "landmine",
            "disaster",
            "dangerous",
            "hazard"
        ],
        "icon": "danger"
    },
    {
        "name": "Industrial",
        "tags": [
            "industrial",
            "factory",
            "property",
            "building"
        ],
        "icon": "industrial"
    },
    {
        "name": "Warehouse",
        "tags": [
            "warehouse",
            "property",
            "storage",
            "building"
        ],
        "icon": "warehouse"
    },
    {
        "name": "Commercial",
        "tags": [
            "commercial",
            "property",
            "business",
            "building"
        ],
        "icon": "commercial"
    },
    {
        "name": "Building",
        "tags": [
            "building",
            "property",
            "structure",
            "business",
            "building"
        ],
        "icon": "building"
    },
    {
        "name": "Place of worship",
        "tags": [
            "religion",
            "ceremony",
            "religious",
            "nondenominational",
            "church",
            "temple"
        ],
        "icon": "place-of-worship"
    },
    {
        "name": "Alcohol shop",
        "tags": [
            "alcohol",
            "liquor",
            "store",
            "shop",
            "beer",
            "wine",
            "vodka"
        ],
        "icon": "alcohol-shop"
    },
    {
        "name": "Logging",
        "tags": [
            "logger",
            "chainsaw",
            "woods",
            "industry"
        ],
        "icon": "logging"
    },
    {
        "name": "Oil well",
        "tags": [
            "oil",
            "natural",
            "environment",
            "industry",
            "resources"
        ],
        "icon": "oil-well"
    },
    {
        "name": "Slaughterhouse",
        "tags": [
            "cows",
            "cattle",
            "food",
            "meat",
            "industry",
            "resources"
        ],
        "icon": "slaughterhouse"
    },
    {
        "name": "Dam",
        "tags": [
            "water",
            "natural",
            "hydro",
            "hydroelectric",
            "energy",
            "environment",
            "industry",
            "resources"
        ],
        "icon": "dam"
    },
    {
    "name": "Water",
    "tags": [
        "water",
        "natural",
        "hydro",
        "lake",
        "river",
        "ocean",
        "resources"
    ],
    "icon": "water"
    },
    {
    "name": "Wetland",
    "tags": [
        "water",
        "swamp",
        "natural"
    ],
    "icon": "wetland"
    },
    {
    "name": "Disability",
    "tags": [
        "handicap",
        "wheelchair",
        "access"
    ],
    "icon": "disability"
    },
    {
    "name": "Telephone",
    "tags": [
        "payphone",
        "call"
    ],
    "icon": "telephone"
    },
    {
    "name": "Emergency Telephone",
    "tags": [
        "payphone",
        "danger",
        "safety",
        "call"
    ],
    "icon": "emergency-telephone"
    },
    {
    "name": "Toilets",
    "tags": [
        "bathroom",
        "men",
        "women",
        "sink",
        "washroom",
        "lavatory"
    ],
    "icon": "toilets"
    },
    {
    "name": "Waste Basket",
    "tags": [
        "trash",
        "rubbish",
        "bin",
        "garbage"
    ],
    "icon": "waste-basket"
    },
    {
    "name": "Music",
    "tags": [
        "stage",
        "performance",
        "band",
        "concert",
        "venue"
    ],
    "icon": "music"
    },
    {
    "name": "Land Use",
    "tags": [
        "zoning",
        "usage",
        "area"
    ],
    "icon": "land-use"
    },
    {
    "name": "City",
    "tags": [
        "area",
        "point",
        "place",
        "urban"
    ],
    "icon": "city"
    },
    {
    "name": "Town",
    "tags": [
        "area",
        "point",
        "place",
        "small"
    ],
    "icon": "town"
    },
    {
    "name": "Village",
    "tags": [
        "area",
        "point",
        "place",
        "small",
        "rural"
    ],
    "icon": "village"
    },
    {
    "name": "Farm",
    "tags": [
        "building",
        "farming",
        "crops",
        "plants",
        "agriculture",
        "rural"
    ],
    "icon": "farm"
    },
    {
    "name": "Bakery",
    "tags": [
        "bakery",
        "pastry",
        "croissant",
        "food",
        "shop",
        "bread"
    ],
    "icon": "bakery"
    },
	{
    "name": "Dog Park",
    "tags": [
        "dog",
        "pet"
    ],
    "icon": "dog-park"
    },
   {
    "name": "Lighthouse",
    "tags": [
        "building",
        "navigation",
        "nautical",
        "ocean",
        "logistics"
    ],
    "icon": "lighthouse"
    },
    {
    "name": "Clothing Store",
    "tags": [
        "clothing",
        "store",
        "shop"
    ],
    "icon": "clothing-store"
    },
    {
    "name": "Polling Place",
    "tags": [
        "poll",
        "polling",
        "vote"
    ],
    "icon": "polling-place"
    },
    {
    "name": "Playground",
    "tags": [
        "playground",
        "play",
        "park",
        "children"
    ],
    "icon": "playground"
    },
    {
    "name": "Entrance",
    "tags": [
        "entrance",
        "enter",
        "subway",
        "rail"
    ],
    "icon": "entrance"
    },
    {
    "name": "Heart",
    "tags": [
        "heart",
        "love",
        "shape",
        "shapes",
        "wedding"
    ],
    "icon": "heart"
    },
    {
    "name": "London Underground",
    "tags": [
        "deprecated"
    ],
    "icon": "london-underground"
    },
    {
    "name": "Minefield",
    "tags": [
        "deprecated"
    ],
    "icon": "minefield"
    },
    {
    "name": "Rail Underground",
    "tags": [
        "deprecated"
    ],
    "icon": "rail-underground"
    },
    {
    "name": "Rail Above",
    "tags": [
        "deprecated"
    ],
    "icon": "rail-above"
    },
    {
     "name": "Camera",
     "tags": [
         "camera",
         "photo",
         "commercial",
         "shop"
     ],
     "icon": "camera"
    },
    {
    "name": "Laundry",
    "tags": [
        "laundry",
        "washing machine",
        "dry_cleaning",
        "commercial",
        "store"
    ],
    "icon": "laundry"
    },
    {
        "name": "Car",
        "tags": [
            "car",
            "auto",
            "vehicle",
            "transportation"
        ],
        "icon": "car"
    },
    {
    "name": "Suitcase",
    "tags": [
      "suitcase",
      "travel",
      "travel agency",
      "commercial",
      "store"
    ],
    "icon": "suitcase"
    }
]

},{}],56:[function(require,module,exports){
module.exports={
"circle-stroked-24": { "x": 0, "y": 0, "width": 24, "height": 24 },
"circle-stroked-18": { "x": 24, "y": 0, "width": 18, "height": 18 },
"circle-stroked-12": { "x": 42, "y": 0, "width": 12, "height": 12 },
"circle-24": { "x": 54, "y": 0, "width": 24, "height": 24 },
"circle-18": { "x": 78, "y": 0, "width": 18, "height": 18 },
"circle-12": { "x": 96, "y": 0, "width": 12, "height": 12 },
"square-stroked-24": { "x": 108, "y": 0, "width": 24, "height": 24 },
"square-stroked-18": { "x": 132, "y": 0, "width": 18, "height": 18 },
"square-stroked-12": { "x": 150, "y": 0, "width": 12, "height": 12 },
"square-24": { "x": 162, "y": 0, "width": 24, "height": 24 },
"square-18": { "x": 186, "y": 0, "width": 18, "height": 18 },
"square-12": { "x": 204, "y": 0, "width": 12, "height": 12 },
"triangle-stroked-24": { "x": 216, "y": 0, "width": 24, "height": 24 },
"triangle-stroked-18": { "x": 240, "y": 0, "width": 18, "height": 18 },
"triangle-stroked-12": { "x": 258, "y": 0, "width": 12, "height": 12 },
"triangle-24": { "x": 0, "y": 24, "width": 24, "height": 24 },
"triangle-18": { "x": 24, "y": 24, "width": 18, "height": 18 },
"triangle-12": { "x": 42, "y": 24, "width": 12, "height": 12 },
"star-stroked-24": { "x": 54, "y": 24, "width": 24, "height": 24 },
"star-stroked-18": { "x": 78, "y": 24, "width": 18, "height": 18 },
"star-stroked-12": { "x": 96, "y": 24, "width": 12, "height": 12 },
"star-24": { "x": 108, "y": 24, "width": 24, "height": 24 },
"star-18": { "x": 132, "y": 24, "width": 18, "height": 18 },
"star-12": { "x": 150, "y": 24, "width": 12, "height": 12 },
"cross-24": { "x": 162, "y": 24, "width": 24, "height": 24 },
"cross-18": { "x": 186, "y": 24, "width": 18, "height": 18 },
"cross-12": { "x": 204, "y": 24, "width": 12, "height": 12 },
"marker-stroked-24": { "x": 216, "y": 24, "width": 24, "height": 24 },
"marker-stroked-18": { "x": 240, "y": 24, "width": 18, "height": 18 },
"marker-stroked-12": { "x": 258, "y": 24, "width": 12, "height": 12 },
"marker-24": { "x": 0, "y": 48, "width": 24, "height": 24 },
"marker-18": { "x": 24, "y": 48, "width": 18, "height": 18 },
"marker-12": { "x": 42, "y": 48, "width": 12, "height": 12 },
"religious-jewish-24": { "x": 54, "y": 48, "width": 24, "height": 24 },
"religious-jewish-18": { "x": 78, "y": 48, "width": 18, "height": 18 },
"religious-jewish-12": { "x": 96, "y": 48, "width": 12, "height": 12 },
"religious-christian-24": { "x": 108, "y": 48, "width": 24, "height": 24 },
"religious-christian-18": { "x": 132, "y": 48, "width": 18, "height": 18 },
"religious-christian-12": { "x": 150, "y": 48, "width": 12, "height": 12 },
"religious-muslim-24": { "x": 162, "y": 48, "width": 24, "height": 24 },
"religious-muslim-18": { "x": 186, "y": 48, "width": 18, "height": 18 },
"religious-muslim-12": { "x": 204, "y": 48, "width": 12, "height": 12 },
"cemetery-24": { "x": 216, "y": 48, "width": 24, "height": 24 },
"cemetery-18": { "x": 240, "y": 48, "width": 18, "height": 18 },
"cemetery-12": { "x": 258, "y": 48, "width": 12, "height": 12 },
"rocket-24": { "x": 0, "y": 72, "width": 24, "height": 24 },
"rocket-18": { "x": 24, "y": 72, "width": 18, "height": 18 },
"rocket-12": { "x": 42, "y": 72, "width": 12, "height": 12 },
"airport-24": { "x": 54, "y": 72, "width": 24, "height": 24 },
"airport-18": { "x": 78, "y": 72, "width": 18, "height": 18 },
"airport-12": { "x": 96, "y": 72, "width": 12, "height": 12 },
"heliport-24": { "x": 108, "y": 72, "width": 24, "height": 24 },
"heliport-18": { "x": 132, "y": 72, "width": 18, "height": 18 },
"heliport-12": { "x": 150, "y": 72, "width": 12, "height": 12 },
"rail-24": { "x": 162, "y": 72, "width": 24, "height": 24 },
"rail-18": { "x": 186, "y": 72, "width": 18, "height": 18 },
"rail-12": { "x": 204, "y": 72, "width": 12, "height": 12 },
"rail-metro-24": { "x": 216, "y": 72, "width": 24, "height": 24 },
"rail-metro-18": { "x": 240, "y": 72, "width": 18, "height": 18 },
"rail-metro-12": { "x": 258, "y": 72, "width": 12, "height": 12 },
"rail-light-24": { "x": 0, "y": 96, "width": 24, "height": 24 },
"rail-light-18": { "x": 24, "y": 96, "width": 18, "height": 18 },
"rail-light-12": { "x": 42, "y": 96, "width": 12, "height": 12 },
"bus-24": { "x": 54, "y": 96, "width": 24, "height": 24 },
"bus-18": { "x": 78, "y": 96, "width": 18, "height": 18 },
"bus-12": { "x": 96, "y": 96, "width": 12, "height": 12 },
"fuel-24": { "x": 108, "y": 96, "width": 24, "height": 24 },
"fuel-18": { "x": 132, "y": 96, "width": 18, "height": 18 },
"fuel-12": { "x": 150, "y": 96, "width": 12, "height": 12 },
"parking-24": { "x": 162, "y": 96, "width": 24, "height": 24 },
"parking-18": { "x": 186, "y": 96, "width": 18, "height": 18 },
"parking-12": { "x": 204, "y": 96, "width": 12, "height": 12 },
"parking-garage-24": { "x": 216, "y": 96, "width": 24, "height": 24 },
"parking-garage-18": { "x": 240, "y": 96, "width": 18, "height": 18 },
"parking-garage-12": { "x": 258, "y": 96, "width": 12, "height": 12 },
"airfield-24": { "x": 0, "y": 120, "width": 24, "height": 24 },
"airfield-18": { "x": 24, "y": 120, "width": 18, "height": 18 },
"airfield-12": { "x": 42, "y": 120, "width": 12, "height": 12 },
"roadblock-24": { "x": 54, "y": 120, "width": 24, "height": 24 },
"roadblock-18": { "x": 78, "y": 120, "width": 18, "height": 18 },
"roadblock-12": { "x": 96, "y": 120, "width": 12, "height": 12 },
"ferry-24": { "x": 108, "y": 120, "width": 24, "height": 24 },
"ferry-18": { "x": 132, "y": 120, "width": 18, "height": 18 },
"ferry-12": { "x": 150, "y": 120, "width": 12, "height": 12 },
"harbor-24": { "x": 162, "y": 120, "width": 24, "height": 24 },
"harbor-18": { "x": 186, "y": 120, "width": 18, "height": 18 },
"harbor-12": { "x": 204, "y": 120, "width": 12, "height": 12 },
"bicycle-24": { "x": 216, "y": 120, "width": 24, "height": 24 },
"bicycle-18": { "x": 240, "y": 120, "width": 18, "height": 18 },
"bicycle-12": { "x": 258, "y": 120, "width": 12, "height": 12 },
"park-24": { "x": 0, "y": 144, "width": 24, "height": 24 },
"park-18": { "x": 24, "y": 144, "width": 18, "height": 18 },
"park-12": { "x": 42, "y": 144, "width": 12, "height": 12 },
"park2-24": { "x": 54, "y": 144, "width": 24, "height": 24 },
"park2-18": { "x": 78, "y": 144, "width": 18, "height": 18 },
"park2-12": { "x": 96, "y": 144, "width": 12, "height": 12 },
"museum-24": { "x": 108, "y": 144, "width": 24, "height": 24 },
"museum-18": { "x": 132, "y": 144, "width": 18, "height": 18 },
"museum-12": { "x": 150, "y": 144, "width": 12, "height": 12 },
"lodging-24": { "x": 162, "y": 144, "width": 24, "height": 24 },
"lodging-18": { "x": 186, "y": 144, "width": 18, "height": 18 },
"lodging-12": { "x": 204, "y": 144, "width": 12, "height": 12 },
"monument-24": { "x": 216, "y": 144, "width": 24, "height": 24 },
"monument-18": { "x": 240, "y": 144, "width": 18, "height": 18 },
"monument-12": { "x": 258, "y": 144, "width": 12, "height": 12 },
"zoo-24": { "x": 0, "y": 168, "width": 24, "height": 24 },
"zoo-18": { "x": 24, "y": 168, "width": 18, "height": 18 },
"zoo-12": { "x": 42, "y": 168, "width": 12, "height": 12 },
"garden-24": { "x": 54, "y": 168, "width": 24, "height": 24 },
"garden-18": { "x": 78, "y": 168, "width": 18, "height": 18 },
"garden-12": { "x": 96, "y": 168, "width": 12, "height": 12 },
"campsite-24": { "x": 108, "y": 168, "width": 24, "height": 24 },
"campsite-18": { "x": 132, "y": 168, "width": 18, "height": 18 },
"campsite-12": { "x": 150, "y": 168, "width": 12, "height": 12 },
"theatre-24": { "x": 162, "y": 168, "width": 24, "height": 24 },
"theatre-18": { "x": 186, "y": 168, "width": 18, "height": 18 },
"theatre-12": { "x": 204, "y": 168, "width": 12, "height": 12 },
"art-gallery-24": { "x": 216, "y": 168, "width": 24, "height": 24 },
"art-gallery-18": { "x": 240, "y": 168, "width": 18, "height": 18 },
"art-gallery-12": { "x": 258, "y": 168, "width": 12, "height": 12 },
"pitch-24": { "x": 0, "y": 192, "width": 24, "height": 24 },
"pitch-18": { "x": 24, "y": 192, "width": 18, "height": 18 },
"pitch-12": { "x": 42, "y": 192, "width": 12, "height": 12 },
"soccer-24": { "x": 54, "y": 192, "width": 24, "height": 24 },
"soccer-18": { "x": 78, "y": 192, "width": 18, "height": 18 },
"soccer-12": { "x": 96, "y": 192, "width": 12, "height": 12 },
"america-football-24": { "x": 108, "y": 192, "width": 24, "height": 24 },
"america-football-18": { "x": 132, "y": 192, "width": 18, "height": 18 },
"america-football-12": { "x": 150, "y": 192, "width": 12, "height": 12 },
"tennis-24": { "x": 162, "y": 192, "width": 24, "height": 24 },
"tennis-18": { "x": 186, "y": 192, "width": 18, "height": 18 },
"tennis-12": { "x": 204, "y": 192, "width": 12, "height": 12 },
"basketball-24": { "x": 216, "y": 192, "width": 24, "height": 24 },
"basketball-18": { "x": 240, "y": 192, "width": 18, "height": 18 },
"basketball-12": { "x": 258, "y": 192, "width": 12, "height": 12 },
"baseball-24": { "x": 0, "y": 216, "width": 24, "height": 24 },
"baseball-18": { "x": 24, "y": 216, "width": 18, "height": 18 },
"baseball-12": { "x": 42, "y": 216, "width": 12, "height": 12 },
"golf-24": { "x": 54, "y": 216, "width": 24, "height": 24 },
"golf-18": { "x": 78, "y": 216, "width": 18, "height": 18 },
"golf-12": { "x": 96, "y": 216, "width": 12, "height": 12 },
"swimming-24": { "x": 108, "y": 216, "width": 24, "height": 24 },
"swimming-18": { "x": 132, "y": 216, "width": 18, "height": 18 },
"swimming-12": { "x": 150, "y": 216, "width": 12, "height": 12 },
"cricket-24": { "x": 162, "y": 216, "width": 24, "height": 24 },
"cricket-18": { "x": 186, "y": 216, "width": 18, "height": 18 },
"cricket-12": { "x": 204, "y": 216, "width": 12, "height": 12 },
"skiing-24": { "x": 216, "y": 216, "width": 24, "height": 24 },
"skiing-18": { "x": 240, "y": 216, "width": 18, "height": 18 },
"skiing-12": { "x": 258, "y": 216, "width": 12, "height": 12 },
"school-24": { "x": 0, "y": 240, "width": 24, "height": 24 },
"school-18": { "x": 24, "y": 240, "width": 18, "height": 18 },
"school-12": { "x": 42, "y": 240, "width": 12, "height": 12 },
"college-24": { "x": 54, "y": 240, "width": 24, "height": 24 },
"college-18": { "x": 78, "y": 240, "width": 18, "height": 18 },
"college-12": { "x": 96, "y": 240, "width": 12, "height": 12 },
"library-24": { "x": 108, "y": 240, "width": 24, "height": 24 },
"library-18": { "x": 132, "y": 240, "width": 18, "height": 18 },
"library-12": { "x": 150, "y": 240, "width": 12, "height": 12 },
"post-24": { "x": 162, "y": 240, "width": 24, "height": 24 },
"post-18": { "x": 186, "y": 240, "width": 18, "height": 18 },
"post-12": { "x": 204, "y": 240, "width": 12, "height": 12 },
"fire-station-24": { "x": 216, "y": 240, "width": 24, "height": 24 },
"fire-station-18": { "x": 240, "y": 240, "width": 18, "height": 18 },
"fire-station-12": { "x": 258, "y": 240, "width": 12, "height": 12 },
"town-hall-24": { "x": 0, "y": 264, "width": 24, "height": 24 },
"town-hall-18": { "x": 24, "y": 264, "width": 18, "height": 18 },
"town-hall-12": { "x": 42, "y": 264, "width": 12, "height": 12 },
"police-24": { "x": 54, "y": 264, "width": 24, "height": 24 },
"police-18": { "x": 78, "y": 264, "width": 18, "height": 18 },
"police-12": { "x": 96, "y": 264, "width": 12, "height": 12 },
"prison-24": { "x": 108, "y": 264, "width": 24, "height": 24 },
"prison-18": { "x": 132, "y": 264, "width": 18, "height": 18 },
"prison-12": { "x": 150, "y": 264, "width": 12, "height": 12 },
"embassy-24": { "x": 162, "y": 264, "width": 24, "height": 24 },
"embassy-18": { "x": 186, "y": 264, "width": 18, "height": 18 },
"embassy-12": { "x": 204, "y": 264, "width": 12, "height": 12 },
"beer-24": { "x": 216, "y": 264, "width": 24, "height": 24 },
"beer-18": { "x": 240, "y": 264, "width": 18, "height": 18 },
"beer-12": { "x": 258, "y": 264, "width": 12, "height": 12 },
"restaurant-24": { "x": 0, "y": 288, "width": 24, "height": 24 },
"restaurant-18": { "x": 24, "y": 288, "width": 18, "height": 18 },
"restaurant-12": { "x": 42, "y": 288, "width": 12, "height": 12 },
"cafe-24": { "x": 54, "y": 288, "width": 24, "height": 24 },
"cafe-18": { "x": 78, "y": 288, "width": 18, "height": 18 },
"cafe-12": { "x": 96, "y": 288, "width": 12, "height": 12 },
"shop-24": { "x": 108, "y": 288, "width": 24, "height": 24 },
"shop-18": { "x": 132, "y": 288, "width": 18, "height": 18 },
"shop-12": { "x": 150, "y": 288, "width": 12, "height": 12 },
"fast-food-24": { "x": 162, "y": 288, "width": 24, "height": 24 },
"fast-food-18": { "x": 186, "y": 288, "width": 18, "height": 18 },
"fast-food-12": { "x": 204, "y": 288, "width": 12, "height": 12 },
"bar-24": { "x": 216, "y": 288, "width": 24, "height": 24 },
"bar-18": { "x": 240, "y": 288, "width": 18, "height": 18 },
"bar-12": { "x": 258, "y": 288, "width": 12, "height": 12 },
"bank-24": { "x": 0, "y": 312, "width": 24, "height": 24 },
"bank-18": { "x": 24, "y": 312, "width": 18, "height": 18 },
"bank-12": { "x": 42, "y": 312, "width": 12, "height": 12 },
"grocery-24": { "x": 54, "y": 312, "width": 24, "height": 24 },
"grocery-18": { "x": 78, "y": 312, "width": 18, "height": 18 },
"grocery-12": { "x": 96, "y": 312, "width": 12, "height": 12 },
"cinema-24": { "x": 108, "y": 312, "width": 24, "height": 24 },
"cinema-18": { "x": 132, "y": 312, "width": 18, "height": 18 },
"cinema-12": { "x": 150, "y": 312, "width": 12, "height": 12 },
"pharmacy-24": { "x": 162, "y": 312, "width": 24, "height": 24 },
"pharmacy-18": { "x": 186, "y": 312, "width": 18, "height": 18 },
"pharmacy-12": { "x": 204, "y": 312, "width": 12, "height": 12 },
"hospital-24": { "x": 216, "y": 312, "width": 24, "height": 24 },
"hospital-18": { "x": 240, "y": 312, "width": 18, "height": 18 },
"hospital-12": { "x": 258, "y": 312, "width": 12, "height": 12 },
"danger-24": { "x": 0, "y": 336, "width": 24, "height": 24 },
"danger-18": { "x": 24, "y": 336, "width": 18, "height": 18 },
"danger-12": { "x": 42, "y": 336, "width": 12, "height": 12 },
"industrial-24": { "x": 54, "y": 336, "width": 24, "height": 24 },
"industrial-18": { "x": 78, "y": 336, "width": 18, "height": 18 },
"industrial-12": { "x": 96, "y": 336, "width": 12, "height": 12 },
"warehouse-24": { "x": 108, "y": 336, "width": 24, "height": 24 },
"warehouse-18": { "x": 132, "y": 336, "width": 18, "height": 18 },
"warehouse-12": { "x": 150, "y": 336, "width": 12, "height": 12 },
"commercial-24": { "x": 162, "y": 336, "width": 24, "height": 24 },
"commercial-18": { "x": 186, "y": 336, "width": 18, "height": 18 },
"commercial-12": { "x": 204, "y": 336, "width": 12, "height": 12 },
"building-24": { "x": 216, "y": 336, "width": 24, "height": 24 },
"building-18": { "x": 240, "y": 336, "width": 18, "height": 18 },
"building-12": { "x": 258, "y": 336, "width": 12, "height": 12 },
"place-of-worship-24": { "x": 0, "y": 360, "width": 24, "height": 24 },
"place-of-worship-18": { "x": 24, "y": 360, "width": 18, "height": 18 },
"place-of-worship-12": { "x": 42, "y": 360, "width": 12, "height": 12 },
"alcohol-shop-24": { "x": 54, "y": 360, "width": 24, "height": 24 },
"alcohol-shop-18": { "x": 78, "y": 360, "width": 18, "height": 18 },
"alcohol-shop-12": { "x": 96, "y": 360, "width": 12, "height": 12 },
"logging-24": { "x": 108, "y": 360, "width": 24, "height": 24 },
"logging-18": { "x": 132, "y": 360, "width": 18, "height": 18 },
"logging-12": { "x": 150, "y": 360, "width": 12, "height": 12 },
"oil-well-24": { "x": 162, "y": 360, "width": 24, "height": 24 },
"oil-well-18": { "x": 186, "y": 360, "width": 18, "height": 18 },
"oil-well-12": { "x": 204, "y": 360, "width": 12, "height": 12 },
"slaughterhouse-24": { "x": 216, "y": 360, "width": 24, "height": 24 },
"slaughterhouse-18": { "x": 240, "y": 360, "width": 18, "height": 18 },
"slaughterhouse-12": { "x": 258, "y": 360, "width": 12, "height": 12 },
"dam-24": { "x": 0, "y": 384, "width": 24, "height": 24 },
"dam-18": { "x": 24, "y": 384, "width": 18, "height": 18 },
"dam-12": { "x": 42, "y": 384, "width": 12, "height": 12 },
"water-24": { "x": 54, "y": 384, "width": 24, "height": 24 },
"water-18": { "x": 78, "y": 384, "width": 18, "height": 18 },
"water-12": { "x": 96, "y": 384, "width": 12, "height": 12 },
"wetland-24": { "x": 108, "y": 384, "width": 24, "height": 24 },
"wetland-18": { "x": 132, "y": 384, "width": 18, "height": 18 },
"wetland-12": { "x": 150, "y": 384, "width": 12, "height": 12 },
"disability-24": { "x": 162, "y": 384, "width": 24, "height": 24 },
"disability-18": { "x": 186, "y": 384, "width": 18, "height": 18 },
"disability-12": { "x": 204, "y": 384, "width": 12, "height": 12 },
"telephone-24": { "x": 216, "y": 384, "width": 24, "height": 24 },
"telephone-18": { "x": 240, "y": 384, "width": 18, "height": 18 },
"telephone-12": { "x": 258, "y": 384, "width": 12, "height": 12 },
"emergency-telephone-24": { "x": 0, "y": 408, "width": 24, "height": 24 },
"emergency-telephone-18": { "x": 24, "y": 408, "width": 18, "height": 18 },
"emergency-telephone-12": { "x": 42, "y": 408, "width": 12, "height": 12 },
"toilets-24": { "x": 54, "y": 408, "width": 24, "height": 24 },
"toilets-18": { "x": 78, "y": 408, "width": 18, "height": 18 },
"toilets-12": { "x": 96, "y": 408, "width": 12, "height": 12 },
"waste-basket-24": { "x": 108, "y": 408, "width": 24, "height": 24 },
"waste-basket-18": { "x": 132, "y": 408, "width": 18, "height": 18 },
"waste-basket-12": { "x": 150, "y": 408, "width": 12, "height": 12 },
"music-24": { "x": 162, "y": 408, "width": 24, "height": 24 },
"music-18": { "x": 186, "y": 408, "width": 18, "height": 18 },
"music-12": { "x": 204, "y": 408, "width": 12, "height": 12 },
"land-use-24": { "x": 216, "y": 408, "width": 24, "height": 24 },
"land-use-18": { "x": 240, "y": 408, "width": 18, "height": 18 },
"land-use-12": { "x": 258, "y": 408, "width": 12, "height": 12 },
"city-24": { "x": 0, "y": 432, "width": 24, "height": 24 },
"city-18": { "x": 24, "y": 432, "width": 18, "height": 18 },
"city-12": { "x": 42, "y": 432, "width": 12, "height": 12 },
"town-24": { "x": 54, "y": 432, "width": 24, "height": 24 },
"town-18": { "x": 78, "y": 432, "width": 18, "height": 18 },
"town-12": { "x": 96, "y": 432, "width": 12, "height": 12 },
"village-24": { "x": 108, "y": 432, "width": 24, "height": 24 },
"village-18": { "x": 132, "y": 432, "width": 18, "height": 18 },
"village-12": { "x": 150, "y": 432, "width": 12, "height": 12 },
"farm-24": { "x": 162, "y": 432, "width": 24, "height": 24 },
"farm-18": { "x": 186, "y": 432, "width": 18, "height": 18 },
"farm-12": { "x": 204, "y": 432, "width": 12, "height": 12 },
"bakery-24": { "x": 216, "y": 432, "width": 24, "height": 24 },
"bakery-18": { "x": 240, "y": 432, "width": 18, "height": 18 },
"bakery-12": { "x": 258, "y": 432, "width": 12, "height": 12 },
"dog-park-24": { "x": 0, "y": 456, "width": 24, "height": 24 },
"dog-park-18": { "x": 24, "y": 456, "width": 18, "height": 18 },
"dog-park-12": { "x": 42, "y": 456, "width": 12, "height": 12 },
"lighthouse-24": { "x": 54, "y": 456, "width": 24, "height": 24 },
"lighthouse-18": { "x": 78, "y": 456, "width": 18, "height": 18 },
"lighthouse-12": { "x": 96, "y": 456, "width": 12, "height": 12 },
"clothing-store-24": { "x": 108, "y": 456, "width": 24, "height": 24 },
"clothing-store-18": { "x": 132, "y": 456, "width": 18, "height": 18 },
"clothing-store-12": { "x": 150, "y": 456, "width": 12, "height": 12 },
"polling-place-24": { "x": 162, "y": 456, "width": 24, "height": 24 },
"polling-place-18": { "x": 186, "y": 456, "width": 18, "height": 18 },
"polling-place-12": { "x": 204, "y": 456, "width": 12, "height": 12 },
"playground-24": { "x": 216, "y": 456, "width": 24, "height": 24 },
"playground-18": { "x": 240, "y": 456, "width": 18, "height": 18 },
"playground-12": { "x": 258, "y": 456, "width": 12, "height": 12 },
"entrance-24": { "x": 0, "y": 480, "width": 24, "height": 24 },
"entrance-18": { "x": 24, "y": 480, "width": 18, "height": 18 },
"entrance-12": { "x": 42, "y": 480, "width": 12, "height": 12 },
"heart-24": { "x": 54, "y": 480, "width": 24, "height": 24 },
"heart-18": { "x": 78, "y": 480, "width": 18, "height": 18 },
"heart-12": { "x": 96, "y": 480, "width": 12, "height": 12 },
"london-underground-24": { "x": 108, "y": 480, "width": 24, "height": 24 },
"london-underground-18": { "x": 132, "y": 480, "width": 18, "height": 18 },
"london-underground-12": { "x": 150, "y": 480, "width": 12, "height": 12 },
"minefield-24": { "x": 162, "y": 480, "width": 24, "height": 24 },
"minefield-18": { "x": 186, "y": 480, "width": 18, "height": 18 },
"minefield-12": { "x": 204, "y": 480, "width": 12, "height": 12 },
"rail-underground-24": { "x": 216, "y": 480, "width": 24, "height": 24 },
"rail-underground-18": { "x": 240, "y": 480, "width": 18, "height": 18 },
"rail-underground-12": { "x": 258, "y": 480, "width": 12, "height": 12 },
"rail-above-24": { "x": 0, "y": 504, "width": 24, "height": 24 },
"rail-above-18": { "x": 24, "y": 504, "width": 18, "height": 18 },
"rail-above-12": { "x": 42, "y": 504, "width": 12, "height": 12 },
"camera-24": { "x": 54, "y": 504, "width": 24, "height": 24 },
"camera-18": { "x": 78, "y": 504, "width": 18, "height": 18 },
"camera-12": { "x": 96, "y": 504, "width": 12, "height": 12 },
"laundry-24": { "x": 108, "y": 504, "width": 24, "height": 24 },
"laundry-18": { "x": 132, "y": 504, "width": 18, "height": 18 },
"laundry-12": { "x": 150, "y": 504, "width": 12, "height": 12 },
"car-24": { "x": 162, "y": 504, "width": 24, "height": 24 },
"car-18": { "x": 186, "y": 504, "width": 18, "height": 18 },
"car-12": { "x": 204, "y": 504, "width": 12, "height": 12 },
"suitcase-24": { "x": 216, "y": 504, "width": 24, "height": 24 },
"suitcase-18": { "x": 240, "y": 504, "width": 18, "height": 18 },
"suitcase-12": { "x": 258, "y": 504, "width": 12, "height": 12 }}

},{}],57:[function(require,module,exports){
var _ = require("./lodash.custom.js");
var rewind = require("geojson-rewind");

// see https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features
var polygonFeatures = require("./polygon_features.json");

var osmtogeojson = {};

osmtogeojson = function( data, options ) {

  options = _.merge(
    {
      flatProperties: false,
      uninterestingTags: {
        "source": true,
        "source_ref": true,
        "source:ref": true,
        "history": true,
        "attribution": true,
        "created_by": true,
        "tiger:county": true,
        "tiger:tlid": true,
        "tiger:upload_uuid": true
      },
      polygonFeatures: polygonFeatures,
    },
    options
  );

  var result;
  if ( ((typeof XMLDocument !== "undefined") && data instanceof XMLDocument ||
        (typeof XMLDocument === "undefined") && data.childNodes) )
    result = _osmXML2geoJSON(data);
  else
    result = _overpassJSON2geoJSON(data);
  return result;

  function _overpassJSON2geoJSON(json) {
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // create copies of individual json objects to make sure the original data doesn't get altered
    // todo: cloning is slow: see if this can be done differently!
    for (var i=0;i<json.elements.length;i++) {
      switch (json.elements[i].type) {
      case "node":
        var node = json.elements[i];
        nodes.push(node);
      break;
      case "way":
        var way = _.clone(json.elements[i]);
        way.nodes = _.clone(way.nodes);
        ways.push(way);
      break;
      case "relation":
        var rel = _.clone(json.elements[i]);
        rel.members = _.clone(rel.members);
        rels.push(rel);
      break;
      default:
      // type=area (from coord-query) is an example for this case.
      }
    }
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _osmXML2geoJSON(xml) {
    // helper function
    function copy_attribute( x, o, attr ) {
      if (x.hasAttribute(attr))
        o[attr] = x.getAttribute(attr);
    }
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // nodes
    _.each( xml.getElementsByTagName('node'), function( node, i ) {
      var tags = {};
      _.each( node.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      nodes[i] = {
        'type': 'node'
      };
      copy_attribute( node, nodes[i], 'id' );
      copy_attribute( node, nodes[i], 'lat' );
      copy_attribute( node, nodes[i], 'lon' );
      copy_attribute( node, nodes[i], 'version' );
      copy_attribute( node, nodes[i], 'timestamp' );
      copy_attribute( node, nodes[i], 'changeset' );
      copy_attribute( node, nodes[i], 'uid' );
      copy_attribute( node, nodes[i], 'user' );
      if (!_.isEmpty(tags))
        nodes[i].tags = tags;
    });
    // ways
    _.each( xml.getElementsByTagName('way'), function( way, i ) {
      var tags = {};
      var wnodes = [];
      _.each( way.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      _.each( way.getElementsByTagName('nd'), function( nd, i ) {
        wnodes[i] = nd.getAttribute('ref');
      });
      ways[i] = {
        "type": "way"
      };
      copy_attribute( way, ways[i], 'id' );
      copy_attribute( way, ways[i], 'version' );
      copy_attribute( way, ways[i], 'timestamp' );
      copy_attribute( way, ways[i], 'changeset' );
      copy_attribute( way, ways[i], 'uid' );
      copy_attribute( way, ways[i], 'user' );
      if (wnodes.length > 0)
        ways[i].nodes = wnodes;
      if (!_.isEmpty(tags))
        ways[i].tags = tags;
    });
    // relations
    _.each( xml.getElementsByTagName('relation'), function( relation, i ) {
      var tags = {};
      var members = [];
      _.each( relation.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      _.each( relation.getElementsByTagName('member'), function( member, i ) {
        members[i] = {};
        copy_attribute( member, members[i], 'ref' );
        copy_attribute( member, members[i], 'role' );
        copy_attribute( member, members[i], 'type' );
      });
      rels[i] = {
        "type": "relation"
      }
      copy_attribute( relation, rels[i], 'id' );
      copy_attribute( relation, rels[i], 'version' );
      copy_attribute( relation, rels[i], 'timestamp' );
      copy_attribute( relation, rels[i], 'changeset' );
      copy_attribute( relation, rels[i], 'uid' );
      copy_attribute( relation, rels[i], 'user' );
      if (members.length > 0)
        rels[i].members = members;
      if (!_.isEmpty(tags))
        rels[i].tags = tags;
    });
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _convert2geoJSON(nodes,ways,rels) {

    // helper function that checks if there are any tags other than "created_by", "source", etc. or any tag provided in ignore_tags
    function has_interesting_tags(t, ignore_tags) {
      if (typeof ignore_tags !== "object")
        ignore_tags={};
      if (typeof options.uninterestingTags === "function")
        return !options.uninterestingTags(t, ignore_tags);
      for (var k in t)
        if (!(options.uninterestingTags[k]===true) &&
            !(ignore_tags[k]===true || ignore_tags[k]===t[k]))
          return true;
      return false;
    };
    // helper function to extract meta information
    function build_meta_information(object) {
      var res = {
        "timestamp": object.timestamp,
        "version": object.version,
        "changeset": object.changeset,
        "user": object.user,
        "uid": object.uid
      };
      for (k in res)
        if (res[k] === undefined)
          delete res[k];
      return res;
    }

    // some data processing (e.g. filter nodes only used for ways)
    var nodeids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (nodes[i].lat === undefined)
        continue; // ignore nodes without coordinates (e.g. returned by an ids_only query)
      nodeids[nodes[i].id] = nodes[i];
    }
    var poinids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined' &&
          has_interesting_tags(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
        poinids[nodes[i].id] = true;
    }
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      for (var j=0;j<rels[i].members.length;j++) {
        if (rels[i].members[j].type == "node")
          poinids[rels[i].members[j].ref] = true;
      }
    }
    var wayids = new Object();
    var waynids = new Object();
    for (var i=0;i<ways.length;i++) {
      if (!_.isArray(ways[i].nodes))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      wayids[ways[i].id] = ways[i];
      for (var j=0;j<ways[i].nodes.length;j++) {
        waynids[ways[i].nodes[j]] = true;
        ways[i].nodes[j] = nodeids[ways[i].nodes[j]];
      }
    }
    var pois = new Array();
    for (var i=0;i<nodes.length;i++) {
      if ((!waynids[nodes[i].id]) ||
          (poinids[nodes[i].id]))
        pois.push(nodes[i]);
    }
    var relids = new Array();
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      relids[rels[i].id] = rels[i];
    }
    var relsmap = {node: {}, way: {}, relation: {}};
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      for (var j=0;j<rels[i].members.length;j++) {
        var m;
        switch (rels[i].members[j].type) {
          case "node":
            m = nodeids[rels[i].members[j].ref];
          break;
          case "way":
            m = wayids[rels[i].members[j].ref];
          break;
          case "relation":
            m = relids[rels[i].members[j].ref];
          break;
        }
        if (!m) continue;
        var m_type = rels[i].members[j].type;
        var m_ref = rels[i].members[j].ref;
        if (typeof relsmap[m_type][m_ref] === "undefined")
          relsmap[m_type][m_ref] = [];
        relsmap[m_type][m_ref].push({
          "role" : rels[i].members[j].role,
          "rel" : rels[i].id,
          "reltags" : rels[i].tags,
        });
      }
    }
    // construct geojson
    var geojson;
    var geojsonnodes = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (i=0;i<pois.length;i++) {
      if (typeof pois[i].lon == "undefined" || typeof pois[i].lat == "undefined")
        continue; // lon and lat are required for showing a point
      geojsonnodes.features.push({
        "type"       : "Feature",
        "id"         : "node/"+pois[i].id,
        "properties" : {
          "type" : "node",
          "id"   : pois[i].id,
          "tags" : pois[i].tags || {},
          "relations" : relsmap["node"][pois[i].id] || [],
          "meta": build_meta_information(pois[i])
        },
        "geometry"   : {
          "type" : "Point",
          "coordinates" : [+pois[i].lon, +pois[i].lat],
        }
      });
    }
    var geojsonlines = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    var geojsonpolygons = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    // process multipolygons
    for (var i=0;i<rels.length;i++) {
      if ((typeof rels[i].tags != "undefined") &&
          (rels[i].tags["type"] == "multipolygon" || rels[i].tags["type"] == "boundary")) {
        if (!_.isArray(rels[i].members))
          continue; // ignore relations without members (e.g. returned by an ids_only query)
        var outer_count = 0;
        for (var j=0;j<rels[i].members.length;j++)
          if (rels[i].members[j].role == "outer")
            outer_count++;
        rels[i].members.forEach(function(m) {
          if (wayids[m.ref]) {
            // this even works in the following corner case:
            // a multipolygon amenity=xxx with outer line tagged amenity=yyy
            // see https://github.com/tyrasd/osmtogeojson/issues/7
            if (m.role==="outer" && !has_interesting_tags(wayids[m.ref].tags,rels[i].tags))
              wayids[m.ref].is_multipolygon_outline = true;
            if (m.role==="inner" && !has_interesting_tags(wayids[m.ref].tags))
              wayids[m.ref].is_multipolygon_outline = true;
          }
        });
        if (outer_count == 0)
          continue; // ignore multipolygons without outer ways
        var simple_mp = false;
        if (outer_count == 1 && !has_interesting_tags(rels[i].tags, {"type":true}))
          simple_mp = true;
        var feature = null;
        if (!simple_mp) {
          feature = construct_multipolygon(rels[i], rels[i]);
        } else {
          // simple multipolygon
          var outer_way = rels[i].members.filter(function(m) {return m.role === "outer";})[0];
          outer_way = wayids[outer_way.ref];
          if (outer_way === undefined)
            continue; // abort if outer way object is not present
          outer_way.is_multipolygon_outline = true;
          feature = construct_multipolygon(outer_way, rels[i]);
        }
        if (feature === false)
          continue; // abort if feature could not be constructed
        geojsonpolygons.features.push(feature);
        function construct_multipolygon(tag_object, rel) {
          var is_tainted = false;
          // prepare mp members
          var members;
          members = rel.members.filter(function(m) {return m.type === "way";});
          members = members.map(function(m) {
            var way = wayids[m.ref];
            if (way === undefined) { // check for missing ways
              is_tainted = true;
              return;
            }
            return { // TODO: this is slow! :(
              id: m.ref,
              role: m.role || "outer",
              way: way,
              nodes: way.nodes.filter(function(n) {
                if (n !== undefined)
                  return true;
                is_tainted = true;
                return false;
              })
            };
          });
          members = _.compact(members);
          // construct outer and inner rings
          var outers, inners;
          function join(ways) {
            var _first = function(arr) {return arr[0]};
            var _last  = function(arr) {return arr[arr.length-1]};
            // stolen from iD/relation.js
            var joined = [], current, first, last, i, how, what;
            while (ways.length) {
              current = ways.pop().nodes.slice();
              joined.push(current);
              while (ways.length && _first(current) !== _last(current)) {
                first = _first(current);
                last  = _last(current);
                for (i = 0; i < ways.length; i++) {
                  what = ways[i].nodes;
                  if (last === _first(what)) {
                    how  = current.push;
                    what = what.slice(1);
                    break;
                  } else if (last === _last(what)) {
                    how  = current.push;
                    what = what.slice(0, -1).reverse();
                    break;
                  } else if (first == _last(what)) {
                    how  = current.unshift;
                    what = what.slice(0, -1);
                    break;
                  } else if (first == _first(what)) {
                    how  = current.unshift;
                    what = what.slice(1).reverse();
                    break;
                  } else {
                    what = how = null;
                  }
                }
                if (!what)
                  break; // Invalid geometry (dangling way, unclosed ring)
                ways.splice(i, 1);
                how.apply(current, what);
              }
            }
            return joined;
          }
          outers = join(members.filter(function(m) {return m.role==="outer";}));
          inners = join(members.filter(function(m) {return m.role==="inner";}));
          // sort rings
          var mp;
          function findOuter(inner) {
            var polygonIntersectsPolygon = function(outer, inner) {
              for (var i=0; i<inner.length; i++)
                if (pointInPolygon(inner[i], outer))
                  return true;
              return false;
            }
            var mapCoordinates = function(from) {
              return from.map(function(n) {
                return [+n.lat,+n.lon];
              });
            }
            // stolen from iD/geo.js, 
            // based on https://github.com/substack/point-in-polygon, 
            // ray-casting algorithm based on http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var pointInPolygon = function(point, polygon) {
              var x = point[0], y = point[1], inside = false;
              for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                var xi = polygon[i][0], yi = polygon[i][1];
                var xj = polygon[j][0], yj = polygon[j][1];
                var intersect = ((yi > y) != (yj > y)) &&
                  (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              return inside;
            };
            // stolen from iD/relation.js
            var o, outer;
            // todo: all this coordinate mapping makes this unneccesarily slow.
            // see the "todo: this is slow! :(" above.
            inner = mapCoordinates(inner);
            /*for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonContainsPolygon(outer, inner))
                return o;
            }*/
            for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonIntersectsPolygon(outer, inner))
                return o;
            }
          }
          mp = outers.map(function(o) {return [o];});
          for (var j=0; j<inners.length; j++) {
            var o = findOuter(inners[j]);
            if (o !== undefined)
              mp[o].push(inners[j]);
            else
              // so, no outer ring for this inner ring is found.
              // We're going to ignore holes in empty space.
              ;
          }
          // sanitize mp-coordinates (remove empty clusters or rings, {lat,lon,...} to [lon,lat]
          var mp_coords = [];
          mp_coords = _.compact(mp.map(function(cluster) { 
            var cl = _.compact(cluster.map(function(ring) {
              if (ring.length < 4) // todo: is this correct: ring.length < 4 ?
                return;
              return _.compact(ring.map(function(node) {
                return [+node.lon,+node.lat];
              }));
            }));
            if (cl.length == 0)
              return;
            return cl;
          }));

          if (mp_coords.length == 0)
            return false; // ignore multipolygons without coordinates
          var mp_type = "MultiPolygon";
          if (mp_coords.length === 1) {
            mp_type = "Polygon";
            mp_coords = mp_coords[0];
          }
          // mp parsed, now construct the geoJSON
          var feature = {
            "type"       : "Feature",
            "id"         : tag_object.type+"/"+tag_object.id,
            "properties" : {
              "type" : tag_object.type,
              "id"   : tag_object.id,
              "tags" : tag_object.tags || {},
              "relations" :  relsmap[tag_object.type][tag_object.id] || [],
              "meta": build_meta_information(tag_object)
            },
            "geometry"   : {
              "type" : mp_type,
              "coordinates" : mp_coords,
            }
          }
          if (is_tainted)
            feature.properties["tainted"] = true;
          return feature;
        }
      }
    }
    // process lines and polygons
    for (var i=0;i<ways.length;i++) {
      if (!_.isArray(ways[i].nodes))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      if (ways[i].is_multipolygon_outline)
        continue; // ignore ways which are already rendered as (part of) a multipolygon
      ways[i].tainted = false;
      ways[i].hidden = false;
      coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([+ways[i].nodes[j].lon, +ways[i].nodes[j].lat]);
        else
          ways[i].tainted = true;
      }
      if (coords.length <= 1) // invalid way geometry
        continue;
      var way_type = "LineString"; // default
      if (typeof ways[i].nodes[0] != "undefined" && // way has its nodes loaded
        ways[i].nodes[0] === ways[i].nodes[ways[i].nodes.length-1] && // ... and forms a closed ring
        typeof ways[i].tags != "undefined" && // ... and has tags
        _isPolygonFeature(ways[i].tags) // ... and tags say it is a polygon
      ) {
        way_type = "Polygon";
        coords = [coords];
      }
      var feature = {
        "type"       : "Feature",
        "id"         : "way/"+ways[i].id,
        "properties" : {
          "type" : "way",
          "id"   : ways[i].id,
          "tags" : ways[i].tags || {},
          "relations" : relsmap["way"][ways[i].id] || [],
          "meta": build_meta_information(ways[i])
        },
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      }
      if (ways[i].tainted)
        feature.properties["tainted"] = true;
      if (way_type == "LineString")
        geojsonlines.features.push(feature);
      else
        geojsonpolygons.features.push(feature);
    }

    geojson = {
      "type": "FeatureCollection",
      "features": []
    };
    geojson.features = geojson.features.concat(geojsonpolygons.features);
    geojson.features = geojson.features.concat(geojsonlines.features);
    geojson.features = geojson.features.concat(geojsonnodes.features);
    // optionally, flatten properties
    if (options.flatProperties) {
      geojson.features.forEach(function(f) {
        f.properties = _.merge(
          f.properties.meta,
          f.properties.tags,
          {id: f.properties.type+"/"+f.properties.id}
        );
      });
    }
    // fix polygon winding
    geojson = rewind(geojson, true /*remove for geojson-rewind >0.1.0*/);
    return geojson;
  }
  function _isPolygonFeature( tags ) {
    var polygonFeatures = options.polygonFeatures;
    if (typeof polygonFeatures === "function")
      return polygonFeatures(tags);
    // explicitely tagged non-areas
    if ( tags['area'] === 'no' )
      return false;
    // assuming that a typical OSM way has in average less tags than
    // the polygonFeatures list, this way around should be faster
    for ( var key in tags ) {
      var val = tags[key];
      var pfk = polygonFeatures[key];
      // continue with next if tag is unknown or not "categorizing"
      if ( typeof pfk === 'undefined' )
        continue;
      // continue with next if tag is explicitely un-set ("building=no")
      if ( val === 'no' )
        continue;
      // check polygon features for: general acceptance, included or excluded values
      if ( pfk === true )
        return true;
      if ( pfk.included_values && pfk.included_values[val] === true )
        return true;
      if ( pfk.excluded_values && pfk.excluded_values[val] !== true )
        return true;
    }
    // if no tags matched, this ain't no area. 
    return false;
  }
};

// for backwards compatibility
osmtogeojson.toGeojson = osmtogeojson;

module.exports = osmtogeojson;

},{"./lodash.custom.js":58,"./polygon_features.json":62,"geojson-rewind":59}],58:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash exports="node" include="clone,merge,isEmpty,isArray,compact,each" -d`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used to pool arrays and objects used internally */
  var arrayPool = [];

  /** Used internally to indicate various things */
  var indicatorObject = {};

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to fix the JScript [[DontEnum]] bug */
  var shadowedProps = [
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'toLocaleString', 'toString', 'valueOf'
  ];

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      errorClass = '[object Error]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used as the data object for `iteratorTemplate` */
  var iteratorData = {
    'args': '',
    'array': null,
    'bottom': '',
    'firstArg': '',
    'init': '',
    'keys': null,
    'loop': '',
    'shadowedProps': null,
    'support': null,
    'top': '',
    'useHas': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Checks if `value` is a DOM node in IE < 9.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is a DOM node, else `false`.
   */
  function isNode(value) {
    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
    // methods that are `typeof` "string" and still can coerce nodes to strings
    return typeof value.toString != 'function' && typeof (value + '') == 'string';
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Used for `Array` method references.
   *
   * Normally `Array.prototype` would suffice, however, using an array literal
   * avoids issues in Narwhal.
   */
  var arrayRef = [];

  /** Used for native method references */
  var errorProto = Error.prototype,
      objectProto = Object.prototype,
      stringProto = String.prototype;

  /** Used to resolve the internal [[Class]] of values */
  var toString = objectProto.toString;

  /** Used to detect if a method is native */
  var reNative = RegExp('^' +
    String(toString)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/toString| for [^\]]+/g, '.*?') + '$'
  );

  /** Native method shortcuts */
  var fnToString = Function.prototype.toString,
      getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
      hasOwnProperty = objectProto.hasOwnProperty,
      push = arrayRef.push,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      unshift = arrayRef.unshift;

  /** Used to set meta data on functions */
  var defineProperty = (function() {
    // IE 8 only accepts DOM elements
    try {
      var o = {},
          func = isNative(func = Object.defineProperty) && func,
          result = func(o, o, o) && func;
    } catch(e) { }
    return result;
  }());

  /* Native method shortcuts for methods with the same name as other `lodash` methods */
  var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
      nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
      nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

  /** Used to lookup a built-in constructor by [[Class]] */
  var ctorByClass = {};
  ctorByClass[arrayClass] = Array;
  ctorByClass[boolClass] = Boolean;
  ctorByClass[dateClass] = Date;
  ctorByClass[funcClass] = Function;
  ctorByClass[objectClass] = Object;
  ctorByClass[numberClass] = Number;
  ctorByClass[regexpClass] = RegExp;
  ctorByClass[stringClass] = String;

  /** Used to avoid iterating non-enumerable properties in IE < 9 */
  var nonEnumProps = {};
  nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };
  nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };
  nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };
  nonEnumProps[objectClass] = { 'constructor': true };

  (function() {
    var length = shadowedProps.length;
    while (length--) {
      var key = shadowedProps[length];
      for (var className in nonEnumProps) {
        if (hasOwnProperty.call(nonEnumProps, className) && !hasOwnProperty.call(nonEnumProps[className], key)) {
          nonEnumProps[className][key] = false;
        }
      }
    }
  }());

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a `lodash` object which wraps the given value to enable intuitive
   * method chaining.
   *
   * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
   * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
   * and `unshift`
   *
   * Chaining is supported in custom builds as long as the `value` method is
   * implicitly or explicitly included in the build.
   *
   * The chainable wrapper functions are:
   * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
   * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
   * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
   * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
   * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
   * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
   * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
   * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
   * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
   * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
   * and `zip`
   *
   * The non-chainable wrapper functions are:
   * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
   * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
   * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
   * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
   * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
   * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
   * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
   * `template`, `unescape`, `uniqueId`, and `value`
   *
   * The wrapper functions `first` and `last` return wrapped values when `n` is
   * provided, otherwise they return unwrapped values.
   *
   * Explicit chaining can be enabled by using the `_.chain` method.
   *
   * @name _
   * @constructor
   * @category Chaining
   * @param {*} value The value to wrap in a `lodash` instance.
   * @returns {Object} Returns a `lodash` instance.
   * @example
   *
   * var wrapped = _([1, 2, 3]);
   *
   * // returns an unwrapped value
   * wrapped.reduce(function(sum, num) {
   *   return sum + num;
   * });
   * // => 6
   *
   * // returns a wrapped value
   * var squares = wrapped.map(function(num) {
   *   return num * num;
   * });
   *
   * _.isArray(squares);
   * // => false
   *
   * _.isArray(squares.value());
   * // => true
   */
  function lodash() {
    // no operation performed
  }

  /**
   * An object used to flag environments features.
   *
   * @static
   * @memberOf _
   * @type Object
   */
  var support = lodash.support = {};

  (function() {
    var ctor = function() { this.x = 1; },
        object = { '0': 1, 'length': 1 },
        props = [];

    ctor.prototype = { 'valueOf': 1, 'y': 1 };
    for (var key in new ctor) { props.push(key); }
    for (key in arguments) { }

    /**
     * Detect if an `arguments` object's [[Class]] is resolvable (all but Firefox < 4, IE < 9).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.argsClass = toString.call(arguments) == argsClass;

    /**
     * Detect if `arguments` objects are `Object` objects (all but Narwhal and Opera < 10.5).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.argsObject = arguments.constructor == Object && !(arguments instanceof Array);

    /**
     * Detect if `name` or `message` properties of `Error.prototype` are
     * enumerable by default. (IE < 9, Safari < 5.1)
     *
     * @memberOf _.support
     * @type boolean
     */
    support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') || propertyIsEnumerable.call(errorProto, 'name');

    /**
     * Detect if `prototype` properties are enumerable by default.
     *
     * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
     * (if the prototype or a property on the prototype has been set)
     * incorrectly sets a function's `prototype` property [[Enumerable]]
     * value to `true`.
     *
     * @memberOf _.support
     * @type boolean
     */
    support.enumPrototypes = propertyIsEnumerable.call(ctor, 'prototype');

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(root.WinRTError) && reThis.test(function() { return this; });

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * Detect if `arguments` object indexes are non-enumerable
     * (Firefox < 4, IE < 9, PhantomJS, Safari < 5.1).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.nonEnumArgs = key != 0;

    /**
     * Detect if properties shadowing those on `Object.prototype` are non-enumerable.
     *
     * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
     * made non-enumerable as well (a.k.a the JScript [[DontEnum]] bug).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.nonEnumShadows = !/valueOf/.test(props);

    /**
     * Detect if own properties are iterated after inherited properties (all but IE < 9).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.ownLast = props[0] != 'x';

    /**
     * Detect if `Array#shift` and `Array#splice` augment array-like objects correctly.
     *
     * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`
     * and `splice()` functions that fail to remove the last element, `value[0]`,
     * of array-like objects even though the `length` property is set to `0`.
     * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
     * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
     *
     * @memberOf _.support
     * @type boolean
     */
    support.spliceObjects = (arrayRef.splice.call(object, 0, 1), !object[0]);

    /**
     * Detect lack of support for accessing string characters by index.
     *
     * IE < 8 can't access characters by index and IE 8 can only access
     * characters by index on string literals.
     *
     * @memberOf _.support
     * @type boolean
     */
    support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';

    /**
     * Detect if a DOM node's [[Class]] is resolvable (all but IE < 9)
     * and that the JS engine errors when attempting to coerce an object to
     * a string without a `toString` function.
     *
     * @memberOf _.support
     * @type boolean
     */
    try {
      support.nodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));
    } catch(e) {
      support.nodeClass = true;
    }
  }(1));

  /*--------------------------------------------------------------------------*/

  /**
   * The template used to create iterator functions.
   *
   * @private
   * @param {Object} data The data object used to populate the text.
   * @returns {string} Returns the interpolated text.
   */
  var iteratorTemplate = function(obj) {

    var __p = 'var index, iterable = ' +
    (obj.firstArg) +
    ', result = ' +
    (obj.init) +
    ';\nif (!iterable) return result;\n' +
    (obj.top) +
    ';';
     if (obj.array) {
    __p += '\nvar length = iterable.length; index = -1;\nif (' +
    (obj.array) +
    ') {  ';
     if (support.unindexedChars) {
    __p += '\n  if (isString(iterable)) {\n    iterable = iterable.split(\'\')\n  }  ';
     }
    __p += '\n  while (++index < length) {\n    ' +
    (obj.loop) +
    ';\n  }\n}\nelse {  ';
     } else if (support.nonEnumArgs) {
    __p += '\n  var length = iterable.length; index = -1;\n  if (length && isArguments(iterable)) {\n    while (++index < length) {\n      index += \'\';\n      ' +
    (obj.loop) +
    ';\n    }\n  } else {  ';
     }

     if (support.enumPrototypes) {
    __p += '\n  var skipProto = typeof iterable == \'function\';\n  ';
     }

     if (support.enumErrorProps) {
    __p += '\n  var skipErrorProps = iterable === errorProto || iterable instanceof Error;\n  ';
     }

        var conditions = [];    if (support.enumPrototypes) { conditions.push('!(skipProto && index == "prototype")'); }    if (support.enumErrorProps)  { conditions.push('!(skipErrorProps && (index == "message" || index == "name"))'); }

     if (obj.useHas && obj.keys) {
    __p += '\n  var ownIndex = -1,\n      ownProps = objectTypes[typeof iterable] && keys(iterable),\n      length = ownProps ? ownProps.length : 0;\n\n  while (++ownIndex < length) {\n    index = ownProps[ownIndex];\n';
        if (conditions.length) {
    __p += '    if (' +
    (conditions.join(' && ')) +
    ') {\n  ';
     }
    __p +=
    (obj.loop) +
    ';    ';
     if (conditions.length) {
    __p += '\n    }';
     }
    __p += '\n  }  ';
     } else {
    __p += '\n  for (index in iterable) {\n';
        if (obj.useHas) { conditions.push("hasOwnProperty.call(iterable, index)"); }    if (conditions.length) {
    __p += '    if (' +
    (conditions.join(' && ')) +
    ') {\n  ';
     }
    __p +=
    (obj.loop) +
    ';    ';
     if (conditions.length) {
    __p += '\n    }';
     }
    __p += '\n  }    ';
     if (support.nonEnumShadows) {
    __p += '\n\n  if (iterable !== objectProto) {\n    var ctor = iterable.constructor,\n        isProto = iterable === (ctor && ctor.prototype),\n        className = iterable === stringProto ? stringClass : iterable === errorProto ? errorClass : toString.call(iterable),\n        nonEnum = nonEnumProps[className];\n      ';
     for (k = 0; k < 7; k++) {
    __p += '\n    index = \'' +
    (obj.shadowedProps[k]) +
    '\';\n    if ((!(isProto && nonEnum[index]) && hasOwnProperty.call(iterable, index))';
            if (!obj.useHas) {
    __p += ' || (!nonEnum[index] && iterable[index] !== objectProto[index])';
     }
    __p += ') {\n      ' +
    (obj.loop) +
    ';\n    }      ';
     }
    __p += '\n  }    ';
     }

     }

     if (obj.array || support.nonEnumArgs) {
    __p += '\n}';
     }
    __p +=
    (obj.bottom) +
    ';\nreturn result';

    return __p
  };

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.bind` that creates the bound function and
   * sets its meta data.
   *
   * @private
   * @param {Array} bindData The bind data array.
   * @returns {Function} Returns the new bound function.
   */
  function baseBind(bindData) {
    var func = bindData[0],
        partialArgs = bindData[2],
        thisArg = bindData[4];

    function bound() {
      // `Function#bind` spec
      // http://es5.github.io/#x15.3.4.5
      if (partialArgs) {
        // avoid `arguments` object deoptimizations by using `slice` instead
        // of `Array.prototype.slice.call` and not assigning `arguments` to a
        // variable as a ternary expression
        var args = slice(partialArgs);
        push.apply(args, arguments);
      }
      // mimic the constructor's `return` behavior
      // http://es5.github.io/#x13.2.2
      if (this instanceof bound) {
        // ensure `new bound` is an instance of `func`
        var thisBinding = baseCreate(func.prototype),
            result = func.apply(thisBinding, args || arguments);
        return isObject(result) ? result : thisBinding;
      }
      return func.apply(thisArg, args || arguments);
    }
    setBindData(bound, bindData);
    return bound;
  }

  /**
   * The base implementation of `_.clone` without argument juggling or support
   * for `thisArg` binding.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} [isDeep=false] Specify a deep clone.
   * @param {Function} [callback] The function to customize cloning values.
   * @param {Array} [stackA=[]] Tracks traversed source objects.
   * @param {Array} [stackB=[]] Associates clones with source counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, isDeep, callback, stackA, stackB) {
    if (callback) {
      var result = callback(value);
      if (typeof result != 'undefined') {
        return result;
      }
    }
    // inspect [[Class]]
    var isObj = isObject(value);
    if (isObj) {
      var className = toString.call(value);
      if (!cloneableClasses[className] || (!support.nodeClass && isNode(value))) {
        return value;
      }
      var ctor = ctorByClass[className];
      switch (className) {
        case boolClass:
        case dateClass:
          return new ctor(+value);

        case numberClass:
        case stringClass:
          return new ctor(value);

        case regexpClass:
          result = ctor(value.source, reFlags.exec(value));
          result.lastIndex = value.lastIndex;
          return result;
      }
    } else {
      return value;
    }
    var isArr = isArray(value);
    if (isDeep) {
      // check for circular references and return corresponding clone
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      result = isArr ? ctor(value.length) : {};
    }
    else {
      result = isArr ? slice(value) : assign({}, value);
    }
    // add array properties assigned by `RegExp#exec`
    if (isArr) {
      if (hasOwnProperty.call(value, 'index')) {
        result.index = value.index;
      }
      if (hasOwnProperty.call(value, 'input')) {
        result.input = value.input;
      }
    }
    // exit for shallow clone
    if (!isDeep) {
      return result;
    }
    // add the source value to the stack of traversed objects
    // and associate it with its clone
    stackA.push(value);
    stackB.push(result);

    // recursively populate clone (susceptible to call stack limits)
    (isArr ? baseEach : forOwn)(value, function(objValue, key) {
      result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
    });

    if (initedStack) {
      releaseArray(stackA);
      releaseArray(stackB);
    }
    return result;
  }

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} prototype The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  function baseCreate(prototype, properties) {
    return isObject(prototype) ? nativeCreate(prototype) : {};
  }
  // fallback for browsers without `Object.create`
  if (!nativeCreate) {
    baseCreate = (function() {
      function Object() {}
      return function(prototype) {
        if (isObject(prototype)) {
          Object.prototype = prototype;
          var result = new Object;
          Object.prototype = null;
        }
        return result || root.Object();
      };
    }());
  }

  /**
   * The base implementation of `_.createCallback` without support for creating
   * "_.pluck" or "_.where" style callbacks.
   *
   * @private
   * @param {*} [func=identity] The value to convert to a callback.
   * @param {*} [thisArg] The `this` binding of the created callback.
   * @param {number} [argCount] The number of arguments the callback accepts.
   * @returns {Function} Returns a callback function.
   */
  function baseCreateCallback(func, thisArg, argCount) {
    if (typeof func != 'function') {
      return identity;
    }
    // exit early for no `thisArg` or already bound by `Function#bind`
    if (typeof thisArg == 'undefined' || !('prototype' in func)) {
      return func;
    }
    var bindData = func.__bindData__;
    if (typeof bindData == 'undefined') {
      if (support.funcNames) {
        bindData = !func.name;
      }
      bindData = bindData || !support.funcDecomp;
      if (!bindData) {
        var source = fnToString.call(func);
        if (!support.funcNames) {
          bindData = !reFuncName.test(source);
        }
        if (!bindData) {
          // checks if `func` references the `this` keyword and stores the result
          bindData = reThis.test(source);
          setBindData(func, bindData);
        }
      }
    }
    // exit early if there are no `this` references or `func` is bound
    if (bindData === false || (bindData !== true && bindData[1] & 1)) {
      return func;
    }
    switch (argCount) {
      case 1: return function(value) {
        return func.call(thisArg, value);
      };
      case 2: return function(a, b) {
        return func.call(thisArg, a, b);
      };
      case 3: return function(value, index, collection) {
        return func.call(thisArg, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(thisArg, accumulator, value, index, collection);
      };
    }
    return bind(func, thisArg);
  }

  /**
   * The base implementation of `createWrapper` that creates the wrapper and
   * sets its meta data.
   *
   * @private
   * @param {Array} bindData The bind data array.
   * @returns {Function} Returns the new function.
   */
  function baseCreateWrapper(bindData) {
    var func = bindData[0],
        bitmask = bindData[1],
        partialArgs = bindData[2],
        partialRightArgs = bindData[3],
        thisArg = bindData[4],
        arity = bindData[5];

    var isBind = bitmask & 1,
        isBindKey = bitmask & 2,
        isCurry = bitmask & 4,
        isCurryBound = bitmask & 8,
        key = func;

    function bound() {
      var thisBinding = isBind ? thisArg : this;
      if (partialArgs) {
        var args = slice(partialArgs);
        push.apply(args, arguments);
      }
      if (partialRightArgs || isCurry) {
        args || (args = slice(arguments));
        if (partialRightArgs) {
          push.apply(args, partialRightArgs);
        }
        if (isCurry && args.length < arity) {
          bitmask |= 16 & ~32;
          return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
        }
      }
      args || (args = arguments);
      if (isBindKey) {
        func = thisBinding[key];
      }
      if (this instanceof bound) {
        thisBinding = baseCreate(func.prototype);
        var result = func.apply(thisBinding, args);
        return isObject(result) ? result : thisBinding;
      }
      return func.apply(thisBinding, args);
    }
    setBindData(bound, bindData);
    return bound;
  }

  /**
   * The base implementation of `_.merge` without argument juggling or support
   * for `thisArg` binding.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @param {Function} [callback] The function to customize merging properties.
   * @param {Array} [stackA=[]] Tracks traversed source objects.
   * @param {Array} [stackB=[]] Associates values with source counterparts.
   */
  function baseMerge(object, source, callback, stackA, stackB) {
    (isArray(source) ? forEach : forOwn)(source, function(source, key) {
      var found,
          isArr,
          result = source,
          value = object[key];

      if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
        // avoid merging previously merged cyclic sources
        var stackLength = stackA.length;
        while (stackLength--) {
          if ((found = stackA[stackLength] == source)) {
            value = stackB[stackLength];
            break;
          }
        }
        if (!found) {
          var isShallow;
          if (callback) {
            result = callback(value, source);
            if ((isShallow = typeof result != 'undefined')) {
              value = result;
            }
          }
          if (!isShallow) {
            value = isArr
              ? (isArray(value) ? value : [])
              : (isPlainObject(value) ? value : {});
          }
          // add `source` and associated `value` to the stack of traversed objects
          stackA.push(source);
          stackB.push(value);

          // recursively merge objects and arrays (susceptible to call stack limits)
          if (!isShallow) {
            baseMerge(value, source, callback, stackA, stackB);
          }
        }
      }
      else {
        if (callback) {
          result = callback(value, source);
          if (typeof result == 'undefined') {
            result = source;
          }
        }
        if (typeof result != 'undefined') {
          value = result;
        }
      }
      object[key] = value;
    });
  }

  /**
   * Creates a function that, when called, either curries or invokes `func`
   * with an optional `this` binding and partially applied arguments.
   *
   * @private
   * @param {Function|string} func The function or method name to reference.
   * @param {number} bitmask The bitmask of method flags to compose.
   *  The bitmask may be composed of the following flags:
   *  1 - `_.bind`
   *  2 - `_.bindKey`
   *  4 - `_.curry`
   *  8 - `_.curry` (bound)
   *  16 - `_.partial`
   *  32 - `_.partialRight`
   * @param {Array} [partialArgs] An array of arguments to prepend to those
   *  provided to the new function.
   * @param {Array} [partialRightArgs] An array of arguments to append to those
   *  provided to the new function.
   * @param {*} [thisArg] The `this` binding of `func`.
   * @param {number} [arity] The arity of `func`.
   * @returns {Function} Returns the new function.
   */
  function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
    var isBind = bitmask & 1,
        isBindKey = bitmask & 2,
        isCurry = bitmask & 4,
        isCurryBound = bitmask & 8,
        isPartial = bitmask & 16,
        isPartialRight = bitmask & 32;

    if (!isBindKey && !isFunction(func)) {
      throw new TypeError;
    }
    if (isPartial && !partialArgs.length) {
      bitmask &= ~16;
      isPartial = partialArgs = false;
    }
    if (isPartialRight && !partialRightArgs.length) {
      bitmask &= ~32;
      isPartialRight = partialRightArgs = false;
    }
    var bindData = func && func.__bindData__;
    if (bindData && bindData !== true) {
      // clone `bindData`
      bindData = slice(bindData);
      if (bindData[2]) {
        bindData[2] = slice(bindData[2]);
      }
      if (bindData[3]) {
        bindData[3] = slice(bindData[3]);
      }
      // set `thisBinding` is not previously bound
      if (isBind && !(bindData[1] & 1)) {
        bindData[4] = thisArg;
      }
      // set if previously bound but not currently (subsequent curried functions)
      if (!isBind && bindData[1] & 1) {
        bitmask |= 8;
      }
      // set curried arity if not yet set
      if (isCurry && !(bindData[1] & 4)) {
        bindData[5] = arity;
      }
      // append partial left arguments
      if (isPartial) {
        push.apply(bindData[2] || (bindData[2] = []), partialArgs);
      }
      // append partial right arguments
      if (isPartialRight) {
        unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
      }
      // merge flags
      bindData[1] |= bitmask;
      return createWrapper.apply(null, bindData);
    }
    // fast path for `_.bind`
    var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
    return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
  }

  /**
   * Creates compiled iteration functions.
   *
   * @private
   * @param {...Object} [options] The compile options object(s).
   * @param {string} [options.array] Code to determine if the iterable is an array or array-like.
   * @param {boolean} [options.useHas] Specify using `hasOwnProperty` checks in the object loop.
   * @param {Function} [options.keys] A reference to `_.keys` for use in own property iteration.
   * @param {string} [options.args] A comma separated string of iteration function arguments.
   * @param {string} [options.top] Code to execute before the iteration branches.
   * @param {string} [options.loop] Code to execute in the object loop.
   * @param {string} [options.bottom] Code to execute after the iteration branches.
   * @returns {Function} Returns the compiled function.
   */
  function createIterator() {
    // data properties
    iteratorData.shadowedProps = shadowedProps;

    // iterator options
    iteratorData.array = iteratorData.bottom = iteratorData.loop = iteratorData.top = '';
    iteratorData.init = 'iterable';
    iteratorData.useHas = true;

    // merge options into a template data object
    for (var object, index = 0; object = arguments[index]; index++) {
      for (var key in object) {
        iteratorData[key] = object[key];
      }
    }
    var args = iteratorData.args;
    iteratorData.firstArg = /^[^,]+/.exec(args)[0];

    // create the function factory
    var factory = Function(
        'baseCreateCallback, errorClass, errorProto, hasOwnProperty, ' +
        'indicatorObject, isArguments, isArray, isString, keys, objectProto, ' +
        'objectTypes, nonEnumProps, stringClass, stringProto, toString',
      'return function(' + args + ') {\n' + iteratorTemplate(iteratorData) + '\n}'
    );

    // return the compiled function
    return factory(
      baseCreateCallback, errorClass, errorProto, hasOwnProperty,
      indicatorObject, isArguments, isArray, isString, iteratorData.keys, objectProto,
      objectTypes, nonEnumProps, stringClass, stringProto, toString
    );
  }

  /**
   * Checks if `value` is a native function.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
   */
  function isNative(value) {
    return typeof value == 'function' && reNative.test(value);
  }

  /**
   * Sets `this` binding data on a given function.
   *
   * @private
   * @param {Function} func The function to set data on.
   * @param {Array} value The data array to set.
   */
  var setBindData = !defineProperty ? noop : function(func, value) {
    descriptor.value = value;
    defineProperty(func, '__bindData__', descriptor);
  };

  /**
   * A fallback implementation of `isPlainObject` which checks if a given value
   * is an object created by the `Object` constructor, assuming objects created
   * by the `Object` constructor have no inherited enumerable properties and that
   * there are no `Object.prototype` extensions.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   */
  function shimIsPlainObject(value) {
    var ctor,
        result;

    // avoid non Object objects, `arguments` objects, and DOM elements
    if (!(value && toString.call(value) == objectClass) ||
        (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor)) ||
        (!support.argsClass && isArguments(value)) ||
        (!support.nodeClass && isNode(value))) {
      return false;
    }
    // IE < 9 iterates inherited properties before own properties. If the first
    // iterated property is an object's own property then there are no inherited
    // enumerable properties.
    if (support.ownLast) {
      forIn(value, function(value, key, object) {
        result = hasOwnProperty.call(object, key);
        return false;
      });
      return result !== false;
    }
    // In most environments an object's own properties are iterated before
    // its inherited properties. If the last iterated property is an object's
    // own property then there are no inherited enumerable properties.
    forIn(value, function(value, key) {
      result = key;
    });
    return typeof result == 'undefined' || hasOwnProperty.call(value, result);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Checks if `value` is an `arguments` object.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
   * @example
   *
   * (function() { return _.isArguments(arguments); })(1, 2, 3);
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    return value && typeof value == 'object' && typeof value.length == 'number' &&
      toString.call(value) == argsClass || false;
  }
  // fallback for browsers that can't detect `arguments` objects by [[Class]]
  if (!support.argsClass) {
    isArguments = function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee') || false;
    };
  }

  /**
   * Checks if `value` is an array.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
   * @example
   *
   * (function() { return _.isArray(arguments); })();
   * // => false
   *
   * _.isArray([1, 2, 3]);
   * // => true
   */
  var isArray = nativeIsArray || function(value) {
    return value && typeof value == 'object' && typeof value.length == 'number' &&
      toString.call(value) == arrayClass || false;
  };

  /**
   * A fallback implementation of `Object.keys` which produces an array of the
   * given object's own enumerable property names.
   *
   * @private
   * @type Function
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns an array of property names.
   */
  var shimKeys = createIterator({
    'args': 'object',
    'init': '[]',
    'top': 'if (!(objectTypes[typeof object])) return result',
    'loop': 'result.push(index)'
  });

  /**
   * Creates an array composed of the own enumerable property names of an object.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns an array of property names.
   * @example
   *
   * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
   * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
   */
  var keys = !nativeKeys ? shimKeys : function(object) {
    if (!isObject(object)) {
      return [];
    }
    if ((support.enumPrototypes && typeof object == 'function') ||
        (support.nonEnumArgs && object.length && isArguments(object))) {
      return shimKeys(object);
    }
    return nativeKeys(object);
  };

  /** Reusable iterator options shared by `each`, `forIn`, and `forOwn` */
  var eachIteratorOptions = {
    'args': 'collection, callback, thisArg',
    'top': "callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3)",
    'array': "typeof length == 'number'",
    'keys': keys,
    'loop': 'if (callback(iterable[index], index, collection) === false) return result'
  };

  /** Reusable iterator options for `assign` and `defaults` */
  var defaultsIteratorOptions = {
    'args': 'object, source, guard',
    'top':
      'var args = arguments,\n' +
      '    argsIndex = 0,\n' +
      "    argsLength = typeof guard == 'number' ? 2 : args.length;\n" +
      'while (++argsIndex < argsLength) {\n' +
      '  iterable = args[argsIndex];\n' +
      '  if (iterable && objectTypes[typeof iterable]) {',
    'keys': keys,
    'loop': "if (typeof result[index] == 'undefined') result[index] = iterable[index]",
    'bottom': '  }\n}'
  };

  /** Reusable iterator options for `forIn` and `forOwn` */
  var forOwnIteratorOptions = {
    'top': 'if (!objectTypes[typeof iterable]) return result;\n' + eachIteratorOptions.top,
    'array': false
  };

  /**
   * A function compiled to iterate `arguments` objects, arrays, objects, and
   * strings consistenly across environments, executing the callback for each
   * element in the collection. The callback is bound to `thisArg` and invoked
   * with three arguments; (value, index|key, collection). Callbacks may exit
   * iteration early by explicitly returning `false`.
   *
   * @private
   * @type Function
   * @param {Array|Object|string} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Array|Object|string} Returns `collection`.
   */
  var baseEach = createIterator(eachIteratorOptions);

  /*--------------------------------------------------------------------------*/

  /**
   * Assigns own enumerable properties of source object(s) to the destination
   * object. Subsequent sources will overwrite property assignments of previous
   * sources. If a callback is provided it will be executed to produce the
   * assigned values. The callback is bound to `thisArg` and invoked with two
   * arguments; (objectValue, sourceValue).
   *
   * @static
   * @memberOf _
   * @type Function
   * @alias extend
   * @category Objects
   * @param {Object} object The destination object.
   * @param {...Object} [source] The source objects.
   * @param {Function} [callback] The function to customize assigning values.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
   * // => { 'name': 'fred', 'employer': 'slate' }
   *
   * var defaults = _.partialRight(_.assign, function(a, b) {
   *   return typeof a == 'undefined' ? b : a;
   * });
   *
   * var object = { 'name': 'barney' };
   * defaults(object, { 'name': 'fred', 'employer': 'slate' });
   * // => { 'name': 'barney', 'employer': 'slate' }
   */
  var assign = createIterator(defaultsIteratorOptions, {
    'top':
      defaultsIteratorOptions.top.replace(';',
        ';\n' +
        "if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\n" +
        '  var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);\n' +
        "} else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\n" +
        '  callback = args[--argsLength];\n' +
        '}'
      ),
    'loop': 'result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]'
  });

  /**
   * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
   * be cloned, otherwise they will be assigned by reference. If a callback
   * is provided it will be executed to produce the cloned values. If the
   * callback returns `undefined` cloning will be handled by the method instead.
   * The callback is bound to `thisArg` and invoked with one argument; (value).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to clone.
   * @param {boolean} [isDeep=false] Specify a deep clone.
   * @param {Function} [callback] The function to customize cloning values.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {*} Returns the cloned value.
   * @example
   *
   * var characters = [
   *   { 'name': 'barney', 'age': 36 },
   *   { 'name': 'fred',   'age': 40 }
   * ];
   *
   * var shallow = _.clone(characters);
   * shallow[0] === characters[0];
   * // => true
   *
   * var deep = _.clone(characters, true);
   * deep[0] === characters[0];
   * // => false
   *
   * _.mixin({
   *   'clone': _.partialRight(_.clone, function(value) {
   *     return _.isElement(value) ? value.cloneNode(false) : undefined;
   *   })
   * });
   *
   * var clone = _.clone(document.body);
   * clone.childNodes.length;
   * // => 0
   */
  function clone(value, isDeep, callback, thisArg) {
    // allows working with "Collections" methods without using their `index`
    // and `collection` arguments for `isDeep` and `callback`
    if (typeof isDeep != 'boolean' && isDeep != null) {
      thisArg = callback;
      callback = isDeep;
      isDeep = false;
    }
    return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
  }

  /**
   * Iterates over own and inherited enumerable properties of an object,
   * executing the callback for each property. The callback is bound to `thisArg`
   * and invoked with three arguments; (value, key, object). Callbacks may exit
   * iteration early by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * function Shape() {
   *   this.x = 0;
   *   this.y = 0;
   * }
   *
   * Shape.prototype.move = function(x, y) {
   *   this.x += x;
   *   this.y += y;
   * };
   *
   * _.forIn(new Shape, function(value, key) {
   *   console.log(key);
   * });
   * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
   */
  var forIn = createIterator(eachIteratorOptions, forOwnIteratorOptions, {
    'useHas': false
  });

  /**
   * Iterates over own enumerable properties of an object, executing the callback
   * for each property. The callback is bound to `thisArg` and invoked with three
   * arguments; (value, key, object). Callbacks may exit iteration early by
   * explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
   *   console.log(key);
   * });
   * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
   */
  var forOwn = createIterator(eachIteratorOptions, forOwnIteratorOptions);

  /**
   * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
   * length of `0` and objects with no own enumerable properties are considered
   * "empty".
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Array|Object|string} value The value to inspect.
   * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
   * @example
   *
   * _.isEmpty([1, 2, 3]);
   * // => false
   *
   * _.isEmpty({});
   * // => true
   *
   * _.isEmpty('');
   * // => true
   */
  function isEmpty(value) {
    var result = true;
    if (!value) {
      return result;
    }
    var className = toString.call(value),
        length = value.length;

    if ((className == arrayClass || className == stringClass ||
        (support.argsClass ? className == argsClass : isArguments(value))) ||
        (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
      return !length;
    }
    forOwn(value, function() {
      return (result = false);
    });
    return result;
  }

  /**
   * Checks if `value` is a function.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   */
  function isFunction(value) {
    return typeof value == 'function';
  }
  // fallback for older versions of Chrome and Safari
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value == 'function' && toString.call(value) == funcClass;
    };
  }

  /**
   * Checks if `value` is the language type of Object.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // check if the value is the ECMAScript language type of Object
    // http://es5.github.io/#x8
    // and avoid a V8 bug
    // http://code.google.com/p/v8/issues/detail?id=2291
    return !!(value && objectTypes[typeof value]);
  }

  /**
   * Checks if `value` is an object created by the `Object` constructor.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Shape() {
   *   this.x = 0;
   *   this.y = 0;
   * }
   *
   * _.isPlainObject(new Shape);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   */
  var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
    if (!(value && toString.call(value) == objectClass) || (!support.argsClass && isArguments(value))) {
      return false;
    }
    var valueOf = value.valueOf,
        objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

    return objProto
      ? (value == objProto || getPrototypeOf(value) == objProto)
      : shimIsPlainObject(value);
  };

  /**
   * Checks if `value` is a string.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
   * @example
   *
   * _.isString('fred');
   * // => true
   */
  function isString(value) {
    return typeof value == 'string' ||
      value && typeof value == 'object' && toString.call(value) == stringClass || false;
  }

  /**
   * Recursively merges own enumerable properties of the source object(s), that
   * don't resolve to `undefined` into the destination object. Subsequent sources
   * will overwrite property assignments of previous sources. If a callback is
   * provided it will be executed to produce the merged values of the destination
   * and source properties. If the callback returns `undefined` merging will
   * be handled by the method instead. The callback is bound to `thisArg` and
   * invoked with two arguments; (objectValue, sourceValue).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The destination object.
   * @param {...Object} [source] The source objects.
   * @param {Function} [callback] The function to customize merging properties.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * var names = {
   *   'characters': [
   *     { 'name': 'barney' },
   *     { 'name': 'fred' }
   *   ]
   * };
   *
   * var ages = {
   *   'characters': [
   *     { 'age': 36 },
   *     { 'age': 40 }
   *   ]
   * };
   *
   * _.merge(names, ages);
   * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
   *
   * var food = {
   *   'fruits': ['apple'],
   *   'vegetables': ['beet']
   * };
   *
   * var otherFood = {
   *   'fruits': ['banana'],
   *   'vegetables': ['carrot']
   * };
   *
   * _.merge(food, otherFood, function(a, b) {
   *   return _.isArray(a) ? a.concat(b) : undefined;
   * });
   * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
   */
  function merge(object) {
    var args = arguments,
        length = 2;

    if (!isObject(object)) {
      return object;
    }
    // allows working with `_.reduce` and `_.reduceRight` without using
    // their `index` and `collection` arguments
    if (typeof args[2] != 'number') {
      length = args.length;
    }
    if (length > 3 && typeof args[length - 2] == 'function') {
      var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
    } else if (length > 2 && typeof args[length - 1] == 'function') {
      callback = args[--length];
    }
    var sources = slice(arguments, 1, length),
        index = -1,
        stackA = getArray(),
        stackB = getArray();

    while (++index < length) {
      baseMerge(object, sources[index], callback, stackA, stackB);
    }
    releaseArray(stackA);
    releaseArray(stackB);
    return object;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Iterates over elements of a collection, executing the callback for each
   * element. The callback is bound to `thisArg` and invoked with three arguments;
   * (value, index|key, collection). Callbacks may exit iteration early by
   * explicitly returning `false`.
   *
   * Note: As with other "Collections" methods, objects with a `length` property
   * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
   * may be used for object iteration.
   *
   * @static
   * @memberOf _
   * @alias each
   * @category Collections
   * @param {Array|Object|string} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {*} [thisArg] The `this` binding of `callback`.
   * @returns {Array|Object|string} Returns `collection`.
   * @example
   *
   * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
   * // => logs each number and returns '1,2,3'
   *
   * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
   * // => logs each number and returns the object (property order is not guaranteed across environments)
   */
  function forEach(collection, callback, thisArg) {
    if (callback && typeof thisArg == 'undefined' && isArray(collection)) {
      var index = -1,
          length = collection.length;

      while (++index < length) {
        if (callback(collection[index], index, collection) === false) {
          break;
        }
      }
    } else {
      baseEach(collection, callback, thisArg);
    }
    return collection;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates an array with all falsey values removed. The values `false`, `null`,
   * `0`, `""`, `undefined`, and `NaN` are all falsey.
   *
   * @static
   * @memberOf _
   * @category Arrays
   * @param {Array} array The array to compact.
   * @returns {Array} Returns a new array of filtered values.
   * @example
   *
   * _.compact([0, 1, false, 2, '', 3]);
   * // => [1, 2, 3]
   */
  function compact(array) {
    var index = -1,
        length = array ? array.length : 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result.push(value);
      }
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a function that, when called, invokes `func` with the `this`
   * binding of `thisArg` and prepends any additional `bind` arguments to those
   * provided to the bound function.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to bind.
   * @param {*} [thisArg] The `this` binding of `func`.
   * @param {...*} [arg] Arguments to be partially applied.
   * @returns {Function} Returns the new bound function.
   * @example
   *
   * var func = function(greeting) {
   *   return greeting + ' ' + this.name;
   * };
   *
   * func = _.bind(func, { 'name': 'fred' }, 'hi');
   * func();
   * // => 'hi fred'
   */
  function bind(func, thisArg) {
    return arguments.length > 2
      ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
      : createWrapper(func, 1, null, null, thisArg);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * This method returns the first argument provided to it.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'name': 'fred' };
   * _.identity(object) === object;
   * // => true
   */
  function identity(value) {
    return value;
  }

  /**
   * A no-operation function.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @example
   *
   * var object = { 'name': 'fred' };
   * _.noop(object) === undefined;
   * // => true
   */
  function noop() {
    // no operation performed
  }

  /*--------------------------------------------------------------------------*/

  lodash.assign = assign;
  lodash.bind = bind;
  lodash.compact = compact;
  lodash.forEach = forEach;
  lodash.forIn = forIn;
  lodash.forOwn = forOwn;
  lodash.keys = keys;
  lodash.merge = merge;

  lodash.each = forEach;
  lodash.extend = assign;

  /*--------------------------------------------------------------------------*/

  // add functions that return unwrapped values when chaining
  lodash.clone = clone;
  lodash.identity = identity;
  lodash.isArguments = isArguments;
  lodash.isArray = isArray;
  lodash.isEmpty = isEmpty;
  lodash.isFunction = isFunction;
  lodash.isObject = isObject;
  lodash.isPlainObject = isPlainObject;
  lodash.isString = isString;
  lodash.noop = noop;

  /*--------------------------------------------------------------------------*/

  /**
   * The semantic version number.
   *
   * @static
   * @memberOf _
   * @type string
   */
  lodash.VERSION = '2.4.1';

  /*--------------------------------------------------------------------------*/

  if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = lodash)._ = lodash;
    }

  }

}.call(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],59:[function(require,module,exports){
var geojsonArea = require('geojson-area');

module.exports = rewind;

function rewind(gj, outer) {
    switch ((gj && gj.type) || null) {
        case 'FeatureCollection':
            gj.features = gj.features.map(curryOuter(rewind, outer));
            return gj;
        case 'Feature':
            gj.geometry = rewind(gj.geometry, outer);
            return gj;
        case 'Polygon':
        case 'MultiPolygon':
            return correct(gj, outer);
        default:
            return gj;
    }
}

function curryOuter(a, b) {
    return function(_) { return a(_, b); };
}

function correct(_, outer) {
    if (_.type === 'Polygon') {
        _.coordinates = correctRings(_.coordinates, outer);
    } else if (_.type === 'MultiPolygon') {
        _.coordinates = _.coordinates.map(curryOuter(correctRings, outer));
    }
    return _;
}

function correctRings(_, outer) {
    outer = !!outer;
    _[0] = wind(_[0], !outer);
    for (var i = 1; i < _.length; i++) {
        _[i] = wind(_[i], outer);
    }
    return _;
}

function wind(_, dir) {
    return cw(_) === dir ? _ : _.reverse();
}

function cw(_) {
    return geojsonArea.ring(_) >= 0;
}

},{"geojson-area":60}],60:[function(require,module,exports){
var wgs84 = require('wgs84');

module.exports.geometry = geometry;
module.exports.ring = ringArea;

function geometry(_) {
    if (_.type === 'Polygon') return polygonArea(_.coordinates);
    else if (_.type === 'MultiPolygon') {
        var area = 0;
        for (var i = 0; i < _.coordinates.length; i++) {
            area += polygonArea(_.coordinates[i]);
        }
        return area;
    } else {
        return null;
    }
}

function polygonArea(coords) {
    var area = 0;
    if (coords && coords.length > 0) {
        area += Math.abs(ringArea(coords[0]));
        for (var i = 1; i < coords.length; i++) {
            area -= Math.abs(ringArea(coords[i]));
        }
    }
    return area;
}

/**
 * Calculate the approximate area of the polygon were it projected onto
 *     the earth.  Note that this area will be positive if ring is oriented
 *     clockwise, otherwise it will be negative.
 *
 * Reference:
 * Robert. G. Chamberlain and William H. Duquette, "Some Algorithms for
 *     Polygons on a Sphere", JPL Publication 07-03, Jet Propulsion
 *     Laboratory, Pasadena, CA, June 2007 http://trs-new.jpl.nasa.gov/dspace/handle/2014/40409
 *
 * Returns:
 * {float} The approximate signed geodesic area of the polygon in square
 *     meters.
 */

function ringArea(coords) {
    var area = 0;

    if (coords.length > 2) {
        var p1, p2;
        for (var i = 0; i < coords.length - 1; i++) {
            p1 = coords[i];
            p2 = coords[i + 1];
            area += rad(p2[0] - p1[0]) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
        }

        area = area * wgs84.RADIUS * wgs84.RADIUS / 2;
    }

    return area;
}

function rad(_) {
    return _ * Math.PI / 180;
}

},{"wgs84":61}],61:[function(require,module,exports){
module.exports.RADIUS = 6378137;
module.exports.FLATTENING = 1/298.257223563;
module.exports.POLAR_RADIUS = 6356752.3142;

},{}],62:[function(require,module,exports){
module.exports={
    "building": true,
    "highway": {
        "included_values": {
            "services": true,
            "rest_area": true,
            "escape": true
        }
    },
    "natural": {
        "excluded_values": {
            "coastline": true,
            "ridge": true,
            "arete": true,
            "tree_row": true
        }
    },
    "landuse": true,
    "waterway": {
        "included_values": {
            "riverbank": true,
            "dock": true,
            "boatyard": true,
            "dam": true
        }
    },
    "amenity": true,
    "leisure": true,
    "barrier": {
        "included_values": {
            "city_wall": true,
            "ditch": true,
            "hedge": true,
            "retaining_wall": true,
            "wall": true,
            "spikes": true
        }
    },
    "railway": {
        "included_values": {
            "station": true,
            "turntable": true,
            "roundhouse": true,
            "platform": true
        }
    },
    "area": true,
    "boundary": true,
    "man_made": {
        "excluded_values": {
            "cutline": true,
            "embankment": true,
            "pipeline": true
        }
    },
    "power": {
        "included_values": {
            "generator": true,
            "station": true,
            "sub_station": true,
            "transformer": true
        }
    },
    "place": true,
    "shop": true,
    "aeroway": {
        "excluded_values": {
            "taxiway": true
        }
    },
    "tourism": true,
    "historic": true,
    "public_transport": true,
    "office": true,
    "building:part": true,
    "military": true,
    "ruins": true,
    "area:highway": true,
    "craft": true
}
},{}],63:[function(require,module,exports){
(function (process){
toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) { if (x) {norm(x);} return x && x.firstChild && x.firstChild.nodeValue; }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) {
        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
            ele = get1(x, 'ele');
        if (ele) ll.push(parseFloat(nodeVal(ele)));
        return ll;
    }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    // only require xmldom in a node environment
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new (require('xmldom').XMLSerializer)();
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc, o) {
            o = o || {};

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    timeSpan = get1(root, 'TimeSpan'),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (timeSpan) {
                    var begin = nodeVal(get1(timeSpan, 'begin'));
                    var end = nodeVal(get1(timeSpan, 'end'));
                    properties.timespan = { begin: begin, end: end };
                }
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc();
            for (i = 0; i < tracks.length; i++) {
                gj.features.push(getLinestring(tracks[i], 'trkpt'));
            }
            for (i = 0; i < routes.length; i++) {
                gj.features.push(getLinestring(routes[i], 'rtept'));
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getLinestring(node, pointname) {
                var j, pts = get(node, pointname), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push(coordPair(pts[j]));
                }
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

}).call(this,require("/home/miguelpeixe/devel/infoamazonia-rios/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/home/miguelpeixe/devel/infoamazonia-rios/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":51,"xmldom":50}],"BOmyIj":[function(require,module,exports){
var fs = require("fs");

var topojson = module.exports = new Function("topojson", "return " + "topojson = (function() {\n\n  function merge(topology, arcs) {\n    var fragmentByStart = {},\n        fragmentByEnd = {};\n\n    arcs.forEach(function(i) {\n      var e = ends(i),\n          start = e[0],\n          end = e[1],\n          f, g;\n\n      if (f = fragmentByEnd[start]) {\n        delete fragmentByEnd[f.end];\n        f.push(i);\n        f.end = end;\n        if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByEnd[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[end]) {\n        delete fragmentByStart[f.start];\n        f.unshift(i);\n        f.start = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByStart[start]) {\n        delete fragmentByStart[f.start];\n        f.unshift(~i);\n        f.start = end;\n        if (g = fragmentByEnd[end]) {\n          delete fragmentByEnd[g.end];\n          var gf = g === f ? f : g.concat(f);\n          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;\n        } else if (g = fragmentByStart[end]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);\n          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else if (f = fragmentByEnd[end]) {\n        delete fragmentByEnd[f.end];\n        f.push(~i);\n        f.end = start;\n        if (g = fragmentByEnd[start]) {\n          delete fragmentByStart[g.start];\n          var fg = g === f ? f : f.concat(g);\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;\n        } else if (g = fragmentByStart[start]) {\n          delete fragmentByStart[g.start];\n          delete fragmentByEnd[g.end];\n          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());\n          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;\n        } else {\n          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;\n        }\n      } else {\n        f = [i];\n        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;\n      }\n    });\n\n    function ends(i) {\n      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];\n      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });\n      return [p0, p1];\n    }\n\n    var fragments = [];\n    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);\n    return fragments;\n  }\n\n  function mesh(topology, o, filter) {\n    var arcs = [];\n\n    if (arguments.length > 1) {\n      var geomsByArc = [],\n          geom;\n\n      function arc(i) {\n        if (i < 0) i = ~i;\n        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);\n      }\n\n      function line(arcs) {\n        arcs.forEach(arc);\n      }\n\n      function polygon(arcs) {\n        arcs.forEach(line);\n      }\n\n      function geometry(o) {\n        if (o.type === \"GeometryCollection\") o.geometries.forEach(geometry);\n        else if (o.type in geometryType) {\n          geom = o;\n          geometryType[o.type](o.arcs);\n        }\n      }\n\n      var geometryType = {\n        LineString: line,\n        MultiLineString: polygon,\n        Polygon: polygon,\n        MultiPolygon: function(arcs) { arcs.forEach(polygon); }\n      };\n\n      geometry(o);\n\n      geomsByArc.forEach(arguments.length < 3\n          ? function(geoms, i) { arcs.push(i); }\n          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push(i); });\n    } else {\n      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);\n    }\n\n    return object(topology, {type: \"MultiLineString\", arcs: merge(topology, arcs)});\n  }\n\n  function featureOrCollection(topology, o) {\n    return o.type === \"GeometryCollection\" ? {\n      type: \"FeatureCollection\",\n      features: o.geometries.map(function(o) { return feature(topology, o); })\n    } : feature(topology, o);\n  }\n\n  function feature(topology, o) {\n    var f = {\n      type: \"Feature\",\n      id: o.id,\n      properties: o.properties || {},\n      geometry: object(topology, o)\n    };\n    if (o.id == null) delete f.id;\n    return f;\n  }\n\n  function object(topology, o) {\n    var absolute = transformAbsolute(topology.transform),\n        arcs = topology.arcs;\n\n    function arc(i, points) {\n      if (points.length) points.pop();\n      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {\n        points.push(p = a[k].slice());\n        absolute(p, k);\n      }\n      if (i < 0) reverse(points, n);\n    }\n\n    function point(p) {\n      p = p.slice();\n      absolute(p, 0);\n      return p;\n    }\n\n    function line(arcs) {\n      var points = [];\n      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);\n      if (points.length < 2) points.push(points[0].slice());\n      return points;\n    }\n\n    function ring(arcs) {\n      var points = line(arcs);\n      while (points.length < 4) points.push(points[0].slice());\n      return points;\n    }\n\n    function polygon(arcs) {\n      return arcs.map(ring);\n    }\n\n    function geometry(o) {\n      var t = o.type;\n      return t === \"GeometryCollection\" ? {type: t, geometries: o.geometries.map(geometry)}\n          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}\n          : null;\n    }\n\n    var geometryType = {\n      Point: function(o) { return point(o.coordinates); },\n      MultiPoint: function(o) { return o.coordinates.map(point); },\n      LineString: function(o) { return line(o.arcs); },\n      MultiLineString: function(o) { return o.arcs.map(line); },\n      Polygon: function(o) { return polygon(o.arcs); },\n      MultiPolygon: function(o) { return o.arcs.map(polygon); }\n    };\n\n    return geometry(o);\n  }\n\n  function reverse(array, n) {\n    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;\n  }\n\n  function bisect(a, x) {\n    var lo = 0, hi = a.length;\n    while (lo < hi) {\n      var mid = lo + hi >>> 1;\n      if (a[mid] < x) lo = mid + 1;\n      else hi = mid;\n    }\n    return lo;\n  }\n\n  function neighbors(objects) {\n    var indexesByArc = {}, // arc index -> array of object indexes\n        neighbors = objects.map(function() { return []; });\n\n    function line(arcs, i) {\n      arcs.forEach(function(a) {\n        if (a < 0) a = ~a;\n        var o = indexesByArc[a];\n        if (o) o.push(i);\n        else indexesByArc[a] = [i];\n      });\n    }\n\n    function polygon(arcs, i) {\n      arcs.forEach(function(arc) { line(arc, i); });\n    }\n\n    function geometry(o, i) {\n      if (o.type === \"GeometryCollection\") o.geometries.forEach(function(o) { geometry(o, i); });\n      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);\n    }\n\n    var geometryType = {\n      LineString: line,\n      MultiLineString: polygon,\n      Polygon: polygon,\n      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }\n    };\n\n    objects.forEach(geometry);\n\n    for (var i in indexesByArc) {\n      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {\n        for (var k = j + 1; k < m; ++k) {\n          var ij = indexes[j], ik = indexes[k], n;\n          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);\n          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);\n        }\n      }\n    }\n\n    return neighbors;\n  }\n\n  function presimplify(topology, triangleArea) {\n    var absolute = transformAbsolute(topology.transform),\n        relative = transformRelative(topology.transform),\n        heap = minHeap(compareArea),\n        maxArea = 0,\n        triangle;\n\n    if (!triangleArea) triangleArea = cartesianArea;\n\n    topology.arcs.forEach(function(arc) {\n      var triangles = [];\n\n      arc.forEach(absolute);\n\n      for (var i = 1, n = arc.length - 1; i < n; ++i) {\n        triangle = arc.slice(i - 1, i + 2);\n        triangle[1][2] = triangleArea(triangle);\n        triangles.push(triangle);\n        heap.push(triangle);\n      }\n\n      // Always keep the arc endpoints!\n      arc[0][2] = arc[n][2] = Infinity;\n\n      for (var i = 0, n = triangles.length; i < n; ++i) {\n        triangle = triangles[i];\n        triangle.previous = triangles[i - 1];\n        triangle.next = triangles[i + 1];\n      }\n    });\n\n    while (triangle = heap.pop()) {\n      var previous = triangle.previous,\n          next = triangle.next;\n\n      // If the area of the current point is less than that of the previous point\n      // to be eliminated, use the latter's area instead. This ensures that the\n      // current point cannot be eliminated without eliminating previously-\n      // eliminated points.\n      if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;\n      else maxArea = triangle[1][2];\n\n      if (previous) {\n        previous.next = next;\n        previous[2] = triangle[2];\n        update(previous);\n      }\n\n      if (next) {\n        next.previous = previous;\n        next[0] = triangle[0];\n        update(next);\n      }\n    }\n\n    topology.arcs.forEach(function(arc) {\n      arc.forEach(relative);\n    });\n\n    function update(triangle) {\n      heap.remove(triangle);\n      triangle[1][2] = triangleArea(triangle);\n      heap.push(triangle);\n    }\n\n    return topology;\n  };\n\n  function cartesianArea(triangle) {\n    return Math.abs(\n      (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])\n      - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])\n    );\n  }\n\n  function compareArea(a, b) {\n    return a[1][2] - b[1][2];\n  }\n\n  function minHeap(compare) {\n    var heap = {},\n        array = [];\n\n    heap.push = function() {\n      for (var i = 0, n = arguments.length; i < n; ++i) {\n        var object = arguments[i];\n        up(object.index = array.push(object) - 1);\n      }\n      return array.length;\n    };\n\n    heap.pop = function() {\n      var removed = array[0],\n          object = array.pop();\n      if (array.length) {\n        array[object.index = 0] = object;\n        down(0);\n      }\n      return removed;\n    };\n\n    heap.remove = function(removed) {\n      var i = removed.index,\n          object = array.pop();\n      if (i !== array.length) {\n        array[object.index = i] = object;\n        (compare(object, removed) < 0 ? up : down)(i);\n      }\n      return i;\n    };\n\n    function up(i) {\n      var object = array[i];\n      while (i > 0) {\n        var up = ((i + 1) >> 1) - 1,\n            parent = array[up];\n        if (compare(object, parent) >= 0) break;\n        array[parent.index = i] = parent;\n        array[object.index = i = up] = object;\n      }\n    }\n\n    function down(i) {\n      var object = array[i];\n      while (true) {\n        var right = (i + 1) << 1,\n            left = right - 1,\n            down = i,\n            child = array[down];\n        if (left < array.length && compare(array[left], child) < 0) child = array[down = left];\n        if (right < array.length && compare(array[right], child) < 0) child = array[down = right];\n        if (down === i) break;\n        array[child.index = i] = child;\n        array[object.index = i = down] = object;\n      }\n    }\n\n    return heap;\n  }\n\n  function transformAbsolute(transform) {\n    if (!transform) return noop;\n    var x0,\n        y0,\n        kx = transform.scale[0],\n        ky = transform.scale[1],\n        dx = transform.translate[0],\n        dy = transform.translate[1];\n    return function(point, i) {\n      if (!i) x0 = y0 = 0;\n      point[0] = (x0 += point[0]) * kx + dx;\n      point[1] = (y0 += point[1]) * ky + dy;\n    };\n  }\n\n  function transformRelative(transform) {\n    if (!transform) return noop;\n    var x0,\n        y0,\n        kx = transform.scale[0],\n        ky = transform.scale[1],\n        dx = transform.translate[0],\n        dy = transform.translate[1];\n    return function(point, i) {\n      if (!i) x0 = y0 = 0;\n      var x1 = (point[0] - dx) / kx | 0,\n          y1 = (point[1] - dy) / ky | 0;\n      point[0] = x1 - x0;\n      point[1] = y1 - y0;\n      x0 = x1;\n      y0 = y1;\n    };\n  }\n\n  function noop() {}\n\n  return {\n    version: \"1.4.5\",\n    mesh: mesh,\n    feature: featureOrCollection,\n    neighbors: neighbors,\n    presimplify: presimplify\n  };\n})();\n")();
topojson.topology = require("./lib/topojson/topology");
topojson.simplify = require("./lib/topojson/simplify");
topojson.clockwise = require("./lib/topojson/clockwise");
topojson.filter = require("./lib/topojson/filter");
topojson.prune = require("./lib/topojson/prune");
topojson.bind = require("./lib/topojson/bind");

},{"./lib/topojson/bind":66,"./lib/topojson/clockwise":69,"./lib/topojson/filter":73,"./lib/topojson/prune":76,"./lib/topojson/simplify":78,"./lib/topojson/topology":81,"fs":49}],"topojson":[function(require,module,exports){
module.exports=require('BOmyIj');
},{}],66:[function(require,module,exports){
var type = require("./type"),
    topojson = require("../../");

module.exports = function(topology, propertiesById) {
  var bind = type({
    geometry: function(geometry) {
      var properties0 = geometry.properties,
          properties1 = propertiesById[geometry.id];
      if (properties1) {
        if (properties0) for (var k in properties1) properties0[k] = properties1[k];
        else for (var k in properties1) { geometry.properties = properties1; break; }
      }
      this.defaults.geometry.call(this, geometry);
    },
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: noop,
    MultiPolygon: noop
  });

  for (var key in topology.objects) {
    bind.object(topology.objects[key]);
  }
};

function noop() {}

},{"../../":"BOmyIj","./type":91}],67:[function(require,module,exports){

// Computes the bounding box of the specified hash of GeoJSON objects.
module.exports = function(objects) {
  var x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  function boundGeometry(geometry) {
    if (geometry && boundGeometryType.hasOwnProperty(geometry.type)) boundGeometryType[geometry.type](geometry);
  }

  var boundGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(boundGeometry); },
    Point: function(o) { boundPoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates.forEach(boundPoint); },
    LineString: function(o) { boundLine(o.coordinates); },
    MultiLineString: function(o) { o.coordinates.forEach(boundLine); },
    Polygon: function(o) { o.coordinates.forEach(boundLine); },
    MultiPolygon: function(o) { o.coordinates.forEach(boundMultiLine); }
  };

  function boundPoint(coordinates) {
    var x = coordinates[0],
        y = coordinates[1];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  function boundLine(coordinates) {
    coordinates.forEach(boundPoint);
  }

  function boundMultiLine(coordinates) {
    coordinates.forEach(boundLine);
  }

  for (var key in objects) {
    boundGeometry(objects[key]);
  }

  return [x0, y0, x1, y1];
};

},{}],68:[function(require,module,exports){
exports.name = "cartesian";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = Math.abs;
exports.triangleArea = triangleArea;
exports.distance = distance;

function formatDistance(d) {
  return d.toString();
}

function ringArea(ring) {
  var i = 0,
      n = ring.length,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) {
    area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  }
  return -area * .5; // ensure clockwise pixel areas are positive
}

function triangleArea(triangle) {
  return Math.abs(
    (triangle[0][0] - triangle[2][0]) * (triangle[1][1] - triangle[0][1])
    - (triangle[0][0] - triangle[1][0]) * (triangle[2][1] - triangle[0][1])
  );
}

function distance(x0, y0, x1, y1) {
  var dx = x0 - x1, dy = y0 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

},{}],69:[function(require,module,exports){
var type = require("./type"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(object, options) {
  if (object.type === "Topology") clockwiseTopology(object, options);
  else clockwiseGeometry(object, options);
};

function clockwiseGeometry(object, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  var clockwisePolygon = clockwisePolygonSystem(system.ringArea, reverse);

  type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.coordinates); },
    MultiPolygon: function(multiPolygon) { multiPolygon.coordinates.forEach(clockwisePolygon); }
  }).object(object);

  function reverse(array) { array.reverse(); }
}

function clockwiseTopology(topology, options) {
  var system = null;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]);

  var clockwisePolygon = clockwisePolygonSystem(ringArea, reverse);

  var clockwise = type({
    LineString: noop,
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) { clockwisePolygon(polygon.arcs); },
    MultiPolygon: function(multiPolygon) { multiPolygon.arcs.forEach(clockwisePolygon); }
  });

  for (var key in topology.objects) {
    clockwise.object(topology.objects[key]);
  }

  function ringArea(ring) {
    return system.ringArea(topojson.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0]);
  }

  // TODO It might be slightly more compact to reverse the arc.
  function reverse(ring) {
    var i = -1, n = ring.length;
    ring.reverse();
    while (++i < n) ring[i] = ~ring[i];
  }
};

function clockwisePolygonSystem(ringArea, reverse) {
  return function(rings) {
    if (!(n = rings.length)) return;
    var n,
        areas = new Array(n),
        max = -Infinity,
        best,
        area,
        t;
    // Find the largest absolute ring area; this should be the exterior ring.
    for (var i = 0; i < n; ++i) {
      var area = Math.abs(areas[i] = ringArea(rings[i]));
      if (area > max) max = area, best = i;
    }
    // Ensure the largest ring appears first.
    if (best) {
      t = rings[best], rings[best] = rings[0], rings[0] = t;
      t = areas[best], areas[best] = areas[0], areas[0] = t;
    }
    if (areas[0] < 0) reverse(rings[0]);
    for (var i = 1; i < n; ++i) {
      if (areas[i] > 0) reverse(rings[i]);
    }
  };
}

function noop() {}

},{"../../":"BOmyIj","./coordinate-systems":71,"./type":91}],70:[function(require,module,exports){
// Given a hash of GeoJSON objects and an id function, invokes the id function
// to compute a new id for each object that is a feature. The function is passed
// the feature and is expected to return the new feature id, or null if the
// feature should not have an id.
module.exports = function(objects, id) {
  if (arguments.length < 2) id = function(d) { return d.id; };

  function idObject(object) {
    if (object && idObjectType.hasOwnProperty(object.type)) idObjectType[object.type](object);
  }

  function idFeature(feature) {
    var i = id(feature);
    if (i == null) delete feature.id;
    else feature.id = i;
  }

  var idObjectType = {
    Feature: idFeature,
    FeatureCollection: function(collection) { collection.features.forEach(idFeature); }
  };

  for (var key in objects) {
    idObject(objects[key]);
  }

  return objects;
};

},{}],71:[function(require,module,exports){
module.exports = {
  cartesian: require("./cartesian"),
  spherical: require("./spherical")
};

},{"./cartesian":68,"./spherical":79}],72:[function(require,module,exports){
// Given a TopoJSON topology in absolute (quantized) coordinates,
// converts to fixed-point delta encoding.
// This is a destructive operation that modifies the given topology!
module.exports = function(topology) {
  var arcs = topology.arcs,
      i = -1,
      n = arcs.length;

  while (++i < n) {
    var arc = arcs[i],
        j = 0,
        m = arc.length,
        point = arc[0],
        x0 = point[0],
        y0 = point[1],
        x1,
        y1;
    while (++j < m) {
      point = arc[j];
      x1 = point[0];
      y1 = point[1];
      arc[j] = [x1 - x0, y1 - y0];
      x0 = x1;
      y0 = y1;
    }
  }

  return topology;
};

},{}],73:[function(require,module,exports){
var type = require("./type"),
    prune = require("./prune"),
    clockwise = require("./clockwise"),
    systems = require("./coordinate-systems"),
    topojson = require("../../");

module.exports = function(topology, options) {
  var system = null,
      forceClockwise = true, // force exterior rings to be clockwise?
      minimumArea;

  if (options)
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "force-clockwise" in options && (forceClockwise = !!options["force-clockwise"]);

  if (forceClockwise) clockwise(topology, options); // deprecated; for backwards-compatibility

  if (!(minimumArea > 0)) minimumArea = Number.MIN_VALUE;

  var filter = type({
    LineString: noop, // TODO remove empty lines
    MultiLineString: noop,
    Point: noop,
    MultiPoint: noop,
    Polygon: function(polygon) {
      polygon.arcs = polygon.arcs.filter(ringArea);
      if (!polygon.arcs.length) {
        polygon.type = null;
        delete polygon.arcs;
      }
    },
    MultiPolygon: function(multiPolygon) {
      multiPolygon.arcs = multiPolygon.arcs.map(function(polygon) {
        return polygon.filter(ringArea);
      }).filter(function(polygon) {
        return polygon.length;
      });
      if (!multiPolygon.arcs.length) {
        multiPolygon.type = null;
        delete multiPolygon.arcs;
      }
    },
    GeometryCollection: function(collection) {
      this.defaults.GeometryCollection.call(this, collection);
      collection.geometries = collection.geometries.filter(function(geometry) { return geometry.type != null; });
      if (!collection.geometries.length) {
        collection.type = null;
        delete collection.geometries;
      }
    }
  });

  for (var key in topology.objects) {
    filter.object(topology.objects[key]);
  }

  prune(topology, options);

  function ringArea(ring) {
    var topopolygon = {type: "Polygon", arcs: [ring]},
        geopolygon = topojson.feature(topology, topopolygon),
        exterior = geopolygon.geometry.coordinates[0],
        exteriorArea = system.absoluteArea(system.ringArea(exterior));
    return exteriorArea >= minimumArea;
  }
};

function noop() {}

},{"../../":"BOmyIj","./clockwise":69,"./coordinate-systems":71,"./prune":76,"./type":91}],74:[function(require,module,exports){
// Given a hash of GeoJSON objects, replaces Features with geometry objects.
// This is a destructive operation that modifies the input objects!
module.exports = function(objects) {

  function geomifyObject(object) {
    return (object && geomifyObjectType.hasOwnProperty(object.type)
        ? geomifyObjectType[object.type]
        : geomifyGeometry)(object);
  }

  function geomifyFeature(feature) {
    var geometry = feature.geometry;
    if (geometry == null) {
      feature.type = null;
    } else {
      geomifyGeometry(geometry);
      feature.type = geometry.type;
      if (geometry.geometries) feature.geometries = geometry.geometries;
      else if (geometry.coordinates) feature.coordinates = geometry.coordinates;
    }
    delete feature.geometry;
    return feature;
  }

  function geomifyGeometry(geometry) {
    if (!geometry) return {type: null};
    if (geomifyGeometryType.hasOwnProperty(geometry.type)) geomifyGeometryType[geometry.type](geometry);
    return geometry;
  }

  var geomifyObjectType = {
    Feature: geomifyFeature,
    FeatureCollection: function(collection) {
      collection.type = "GeometryCollection";
      collection.geometries = collection.features;
      collection.features.forEach(geomifyFeature);
      delete collection.features;
      return collection;
    }
  };

  var geomifyGeometryType = {
    GeometryCollection: function(o) {
      var geometries = o.geometries, i = -1, n = geometries.length;
      while (++i < n) geometries[i] = geomifyGeometry(geometries[i]);
    },
    MultiPoint: function(o) {
      if (!o.coordinates.length) {
        o.type = null;
        delete o.coordinates;
      } else if (o.coordinates.length < 2) {
        o.type = "Point";
        o.coordinates = o.coordinates[0];
      }
    },
    LineString: function(o) {
      if (!o.coordinates.length) {
        o.type = null;
        delete o.coordinates;
      }
    },
    MultiLineString: function(o) {
      for (var lines = o.coordinates, i = 0, N = 0, n = lines.length; i < n; ++i) {
        var line = lines[i];
        if (line.length) lines[N++] = line;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else if (N < 2) {
        o.type = "LineString";
        o.coordinates = lines[0];
      } else {
        o.coordinates.length = N;
      }
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, N = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        if (ring.length) rings[N++] = ring;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else {
        o.coordinates.length = N;
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, j = 0, M = 0, m = polygons.length; j < m; ++j) {
        for (var rings = polygons[j], i = 0, N = 0, n = rings.length; i < n; ++i) {
          var ring = rings[i];
          if (ring.length) rings[N++] = ring;
        }
        if (N) {
          rings.length = N;
          polygons[M++] = rings;
        }
      }
      if (!M) {
        o.type = null;
        delete o.coordinates;
      } else if (M < 2) {
        o.type = "Polygon";
        o.coordinates = polygons[0];
      } else {
        polygons.length = M;
      }
    }
  };

  for (var key in objects) {
    objects[key] = geomifyObject(objects[key]);
  }

  return objects;
};

},{}],75:[function(require,module,exports){
module.exports = function(objects, filter) {

  function prefilterGeometry(geometry) {
    if (!geometry) return {type: null};
    if (prefilterGeometryType.hasOwnProperty(geometry.type)) prefilterGeometryType[geometry.type](geometry);
    return geometry;
  }

  var prefilterGeometryType = {
    GeometryCollection: function(o) {
      var geometries = o.geometries, i = -1, n = geometries.length;
      while (++i < n) geometries[i] = prefilterGeometry(geometries[i]);
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, N = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        if (filter(ring)) rings[N++] = ring;
      }
      if (!N) {
        o.type = null;
        delete o.coordinates;
      } else {
        o.coordinates.length = N;
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, j = 0, M = 0, m = polygons.length; j < m; ++j) {
        for (var rings = polygons[j], i = 0, N = 0, n = rings.length; i < n; ++i) {
          var ring = rings[i];
          if (filter(ring)) rings[N++] = ring;
        }
        if (N) {
          rings.length = N;
          polygons[M++] = rings;
        }
      }
      if (!M) {
        o.type = null;
        delete o.coordinates;
      } else if (M < 2) {
        o.type = "Polygon";
        o.coordinates = polygons[0];
      } else {
        polygons.length = M;
      }
    }
  };

  for (var key in objects) {
    objects[key] = prefilterGeometry(objects[key]);
  }

  return objects;
};

},{}],76:[function(require,module,exports){
module.exports = function(topology, options) {
  var verbose = false,
      objects = topology.objects,
      oldArcs = topology.arcs,
      oldArcCount = oldArcs.length,
      newArcs = topology.arcs = [],
      newArcCount = 0,
      newIndexByOldIndex = new Array(oldArcs.length);

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]);

  function pruneGeometry(geometry) {
    if (geometry && pruneGeometryType.hasOwnProperty(geometry.type)) pruneGeometryType[geometry.type](geometry);
  }

  var pruneGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(pruneGeometry); },
    LineString: function(o) { pruneArcs(o.arcs); },
    MultiLineString: function(o) { o.arcs.forEach(pruneArcs); },
    Polygon: function(o) { o.arcs.forEach(pruneArcs); },
    MultiPolygon: function(o) { o.arcs.forEach(pruneMultiArcs); }
  };

  function pruneArcs(arcs) {
    for (var i = 0, m = 0, n = arcs.length; i < n; ++i) {
      var oldIndex = arcs[i],
          oldReverse = oldIndex < 0 && (oldIndex = ~oldIndex, true),
          oldArc = oldArcs[oldIndex],
          newIndex;

      // Skip collapsed arc segments.
      if (oldArc.length < 3 && !oldArc[1][0] && !oldArc[1][1]) continue;

      // If this is the first instance of this arc,
      // record it under its new index.
      if ((newIndex = newIndexByOldIndex[oldIndex]) == null) {
        newIndexByOldIndex[oldIndex] = newIndex = newArcCount++;
        newArcs[newIndex] = oldArcs[oldIndex];
      }

      arcs[m++] = oldReverse ? ~newIndex : newIndex;
    }

    // If all were collapsed, restore the last arc to avoid collapsing the line.
    if (!(arcs.length = m) && n) {

      // If this is the first instance of this arc,
      // record it under its new index.
      if ((newIndex = newIndexByOldIndex[oldIndex]) == null) {
        newIndexByOldIndex[oldIndex] = newIndex = newArcCount++;
        newArcs[newIndex] = oldArcs[oldIndex];
      }

      arcs[0] = oldReverse ? ~newIndex : newIndex;
    }
  }

  function pruneMultiArcs(arcs) {
    arcs.forEach(pruneArcs);
  }

  for (var key in objects) {
    pruneGeometry(objects[key]);
  }

  if (verbose) console.warn("prune: retained " + newArcCount + " / " + oldArcCount + " arcs (" + Math.round(newArcCount / oldArcCount * 100) + "%)");

  return topology;
};

function noop() {}

},{}],77:[function(require,module,exports){
module.exports = function(objects, bbox, Q) {
  var x0 = isFinite(bbox[0]) ? bbox[0] : 0,
      y0 = isFinite(bbox[1]) ? bbox[1] : 0,
      x1 = isFinite(bbox[2]) ? bbox[2] : 0,
      y1 = isFinite(bbox[3]) ? bbox[3] : 0,
      kx = x1 - x0 ? (Q - 1) / (x1 - x0) : 1,
      ky = y1 - y0 ? (Q - 1) / (y1 - y0) : 1;

  function quantizeGeometry(geometry) {
    if (geometry && quantizeGeometryType.hasOwnProperty(geometry.type)) quantizeGeometryType[geometry.type](geometry);
  }

  var quantizeGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(quantizeGeometry); },
    Point: function(o) { quantizePoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates.forEach(quantizePoint); },
    LineString: function(o) {
      var line = o.coordinates;
      quantizeLine(line);
      if (line.length < 2) line[1] = line[0]; // must have 2+
    },
    MultiLineString: function(o) {
      for (var lines = o.coordinates, i = 0, n = lines.length; i < n; ++i) {
        var line = lines[i];
        quantizeLine(line);
        if (line.length < 2) line[1] = line[0]; // must have 2+
      }
    },
    Polygon: function(o) {
      for (var rings = o.coordinates, i = 0, n = rings.length; i < n; ++i) {
        var ring = rings[i];
        quantizeLine(ring);
        while (ring.length < 4) ring.push(ring[0]); // must have 4+
      }
    },
    MultiPolygon: function(o) {
      for (var polygons = o.coordinates, i = 0, n = polygons.length; i < n; ++i) {
        for (var rings = polygons[i], j = 0, m = rings.length; j < m; ++j) {
          var ring = rings[j];
          quantizeLine(ring);
          while (ring.length < 4) ring.push(ring[0]); // must have 4+
        }
      }
    }
  };

  function quantizePoint(coordinates) {
    coordinates[0] = Math.round((coordinates[0] - x0) * kx);
    coordinates[1] = Math.round((coordinates[1] - y0) * ky);
  }

  function quantizeLine(coordinates) {
    var i = 0,
        j = 1,
        n = coordinates.length,
        pi = coordinates[0],
        pj,
        px = pi[0] = Math.round((pi[0] - x0) * kx),
        py = pi[1] = Math.round((pi[1] - y0) * ky),
        x,
        y;

    while (++i < n) {
      pi = coordinates[i];
      x = Math.round((pi[0] - x0) * kx);
      y = Math.round((pi[1] - y0) * ky);
      if (x !== px || y !== py) { // skip coincident points
        pj = coordinates[j++];
        pj[0] = px = x;
        pj[1] = py = y;
      }
    }

    coordinates.length = j;
  }

  for (var key in objects) {
    quantizeGeometry(objects[key]);
  }

  return {
    scale: [1 / kx, 1 / ky],
    translate: [x0, y0]
  };
};

},{}],78:[function(require,module,exports){
var topojson = require("../../"),
    systems = require("./coordinate-systems");

module.exports = function(topology, options) {
  var minimumArea = 0,
      retainProportion,
      verbose = false,
      system = null,
      N = topology.arcs.reduce(function(p, v) { return p + v.length; }, 0),
      M = 0;

  if (options)
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "retain-proportion" in options && (retainProportion = +options["retain-proportion"]),
    "verbose" in options && (verbose = !!options["verbose"]);

  topojson.presimplify(topology, system.triangleArea);

  if (retainProportion) {
    var areas = [];
    topology.arcs.forEach(function(arc) {
      arc.forEach(function(point) {
        areas.push(point[2]);
      });
    });
    options["minimum-area"] = minimumArea = N ? areas.sort(function(a, b) { return b - a; })[Math.ceil((N - 1) * retainProportion)] : 0;
    if (verbose) console.warn("simplification: effective minimum area " + minimumArea.toPrecision(3));
  }

  topology.arcs.forEach(topology.transform ? function(arc) {
    var dx = 0,
        dy = 0, // accumulate removed points
        i = -1,
        j = -1,
        n = arc.length,
        source,
        target;

    while (++i < n) {
      source = arc[i];
      if (source[2] >= minimumArea) {
        target = arc[++j];
        target[0] = source[0] + dx;
        target[1] = source[1] + dy;
        dx = dy = 0;
      } else {
        dx += source[0];
        dy += source[1];
      }
    }

    arc.length = ++j;
  } : function(arc) {
    var i = -1,
        j = -1,
        n = arc.length,
        point;

    while (++i < n) {
      point = arc[i];
      if (point[2] >= minimumArea) {
        arc[++j] = point;
      }
    }

    arc.length = ++j;
  });

  // Remove computed area (z) for each point.
  // This is done as a separate pass because some coordinates may be shared
  // between arcs (such as the last point and first point of a cut line).
  topology.arcs.forEach(function(arc) {
    var i = -1, n = arc.length;
    while (++i < n) arc[i].length = 2;
    M += arc.length;
  });

  if (verbose) console.warn("simplification: retained " + M + " / " + N + " points (" + Math.round((M / N) * 100) + "%)");

  return topology;
};

},{"../../":"BOmyIj","./coordinate-systems":71}],79:[function(require,module,exports){
var π = Math.PI,
    π_4 = π / 4,
    radians = π / 180;

exports.name = "spherical";
exports.formatDistance = formatDistance;
exports.ringArea = ringArea;
exports.absoluteArea = absoluteArea;
exports.triangleArea = triangleArea;
exports.distance = haversinDistance; // XXX why two implementations?

function formatDistance(radians) {
  var km = radians * 6371;
  return (km > 1 ? km.toFixed(3) + "km" : (km * 1000).toPrecision(3) + "m")
      + " (" + (radians * 180 / Math.PI).toPrecision(3) + "°)";
}

function ringArea(ring) {
  if (!ring.length) return 0;
  var area = 0,
      p = ring[0],
      λ = p[0] * radians,
      φ = p[1] * radians / 2 + π_4,
      λ0 = λ,
      cosφ0 = Math.cos(φ),
      sinφ0 = Math.sin(φ);

  for (var i = 1, n = ring.length; i < n; ++i) {
    p = ring[i], λ = p[0] * radians, φ = p[1] * radians / 2 + π_4;

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u = cosφ0 * cosφ + k * Math.cos(dλ),
        v = k * Math.sin(dλ);
    area += Math.atan2(v, u);

    // Advance the previous point.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  return 2 * (area > π ? area - 2 * π : area < -π ? area + 2 * π : area);
}

function absoluteArea(a) {
  return a < 0 ? a + 4 * π : a;
}

function triangleArea(t) {
  var a = distance(t[0], t[1]),
      b = distance(t[1], t[2]),
      c = distance(t[2], t[0]),
      s = (a + b + c) / 2;
  return 4 * Math.atan(Math.sqrt(Math.max(0, Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2))));
}

function distance(a, b) {
  var Δλ = (b[0] - a[0]) * radians,
      sinΔλ = Math.sin(Δλ),
      cosΔλ = Math.cos(Δλ),
      sinφ0 = Math.sin(a[1] * radians),
      cosφ0 = Math.cos(a[1] * radians),
      sinφ1 = Math.sin(b[1] * radians),
      cosφ1 = Math.cos(b[1] * radians),
      _;
  return Math.atan2(Math.sqrt((_ = cosφ1 * sinΔλ) * _ + (_ = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * _), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
}

function haversinDistance(x0, y0, x1, y1) {
  x0 *= radians, y0 *= radians, x1 *= radians, y1 *= radians;
  return 2 * Math.asin(Math.sqrt(haversin(y1 - y0) + Math.cos(y0) * Math.cos(y1) * haversin(x1 - x0)));
}

function haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

},{}],80:[function(require,module,exports){
var type = require("./type");

module.exports = function(objects, transform) {
  var ε = 1e-2,
      x0 = -180, x0e = x0 + ε,
      x1 = 180, x1e = x1 - ε,
      y0 = -90, y0e = y0 + ε,
      y1 = 90, y1e = y1 - ε,
      fragments = [];

  if (transform) {
    var kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];

    x0 = Math.round((x0 - dx) / kx);
    x1 = Math.round((x1 - dx) / kx);
    y0 = Math.round((y0 - dy) / ky);
    y1 = Math.round((y1 - dy) / ky);
    x0e = Math.round((x0e - dx) / kx);
    x1e = Math.round((x1e - dx) / kx);
    y0e = Math.round((y0e - dy) / ky);
    y1e = Math.round((y1e - dy) / ky);
  }

  function normalizePoint(y) {
    return y <= y0e ? [0, y0] // south pole
        : y >= y1e ? [0, y1] // north pole
        : [x0, y]; // antimeridian
  }

  var stitch = type({
    polygon: function(polygon) {
      var rings = [];

      // For each ring, detect where it crosses the antimeridian or pole.
      for (var j = 0, m = polygon.length; j < m; ++j) {
        var ring = polygon[j],
            fragments = [];

        // By default, assume that this ring doesn’t need any stitching.
        fragments.push(ring);

        for (var i = 0, n = ring.length; i < n; ++i) {
          var point = ring[i],
              x = point[0],
              y = point[1];

          // If this is an antimeridian or polar point…
          if (x <= x0e || x >= x1e || y <= y0e || y >= y1e) {

            // Advance through any antimeridian or polar points…
            for (var k = i + 1; k < n; ++k) {
              var pointk = ring[k],
                  xk = pointk[0],
                  yk = pointk[1];
              if (xk > x0e && xk < x1e && yk > y0e && yk < y1e) break;
            }

            // If this was just a single antimeridian or polar point,
            // we don’t need to cut this ring into a fragment;
            // we can just leave it as-is.
            if (k === i + 1) continue;

            // Otherwise, if this is not the first point in the ring,
            // cut the current fragment so that it ends at the current point.
            // The current point is also normalized for later joining.
            if (i) {
              var fragmentBefore = ring.slice(0, i + 1);
              fragmentBefore[fragmentBefore.length - 1] = normalizePoint(y);
              fragments[fragments.length - 1] = fragmentBefore;
            }

            // If the ring started with an antimeridian fragment,
            // we can ignore that fragment entirely.
            else {
              fragments.pop();
            }

            // If the remainder of the ring is an antimeridian fragment,
            // move on to the next ring.
            if (k >= n) break;

            // Otherwise, add the remaining ring fragment and continue.
            fragments.push(ring = ring.slice(k - 1));
            ring[0] = normalizePoint(ring[0][1]);
            i = -1;
            n = ring.length;
          }
        }

        // Now stitch the fragments back together into rings.
        // To connect the fragments start-to-end, create a simple index by end.
        var fragmentByStart = {},
            fragmentByEnd = {};

        // For each fragment…
        for (var i = 0, n = fragments.length; i < n; ++i) {
          var fragment = fragments[i],
              start = fragment[0],
              end = fragment[fragment.length - 1];

          // If this fragment is closed, add it as a standalone ring.
          if (start[0] === end[0] && start[1] === end[1]) {
            rings.push(fragment);
            fragments[i] = null;
            continue;
          }

          fragment.index = i;
          fragmentByStart[start] = fragmentByEnd[end] = fragment;
        }

        // For each open fragment…
        for (var i = 0; i < n; ++i) {
          var fragment = fragments[i];
          if (fragment) {

            var start = fragment[0],
                end = fragment[fragment.length - 1],
                startFragment = fragmentByEnd[start],
                endFragment = fragmentByStart[end];

            delete fragmentByStart[start];
            delete fragmentByEnd[end];

            // If this fragment is closed, add it as a standalone ring.
            if (start[0] === end[0] && start[1] === end[1]) {
              rings.push(fragment);
              continue;
            }

            if (startFragment) {
              delete fragmentByEnd[start];
              delete fragmentByStart[startFragment[0]];
              startFragment.pop(); // drop the shared coordinate
              fragments[startFragment.index] = null;
              fragment = startFragment.concat(fragment);

              if (startFragment === endFragment) {
                // Connect both ends to this single fragment to create a ring.
                rings.push(fragment);
              } else {
                fragment.index = n++;
                fragments.push(fragmentByStart[fragment[0]] = fragmentByEnd[fragment[fragment.length - 1]] = fragment);
              }
            } else if (endFragment) {
              delete fragmentByStart[end];
              delete fragmentByEnd[endFragment[endFragment.length - 1]];
              fragment.pop(); // drop the shared coordinate
              fragment = fragment.concat(endFragment);
              fragment.index = n++;
              fragments[endFragment.index] = null;
              fragments.push(fragmentByStart[fragment[0]] = fragmentByEnd[fragment[fragment.length - 1]] = fragment);
            } else {
              fragment.push(fragment[0]); // close ring
              rings.push(fragment);
            }
          }
        }
      }

      // Copy the rings into the target polygon.
      for (var i = 0, n = polygon.length = rings.length; i < n; ++i) {
        polygon[i] = rings[i];
      }
    }
  });

  for (var key in objects) {
    stitch.object(objects[key]);
  }
};

},{"./type":91}],81:[function(require,module,exports){
var type = require("./type"),
    stitch = require("./stitch"),
    systems = require("./coordinate-systems"),
    topologize = require("./topology/index"),
    delta = require("./delta"),
    geomify = require("./geomify"),
    prefilter = require("./prefilter"),
    quantize = require("./quantize"),
    bounds = require("./bounds"),
    computeId = require("./compute-id"),
    transformProperties = require("./transform-properties");

var ε = 1e-6;

module.exports = function(objects, options) {
  var Q = 1e4, // precision of quantization
      id = function(d) { return d.id; }, // function to compute object id
      propertyTransform = function() {}, // function to transform properties
      transform,
      minimumArea = 0,
      stitchPoles = true,
      verbose = false,
      system = null;

  if (options)
    "verbose" in options && (verbose = !!options["verbose"]),
    "stitch-poles" in options && (stitchPoles = !!options["stitch-poles"]),
    "coordinate-system" in options && (system = systems[options["coordinate-system"]]),
    "minimum-area" in options && (minimumArea = +options["minimum-area"]),
    "quantization" in options && (Q = +options["quantization"]),
    "id" in options && (id = options["id"]),
    "property-transform" in options && (propertyTransform = options["property-transform"]);

  // Compute the new feature id and transform properties.
  computeId(objects, id);
  transformProperties(objects, propertyTransform);

  // Convert to geometry objects.
  geomify(objects);

  // Compute initial bounding box.
  var bbox = bounds(objects);

  // For automatic coordinate system determination, consider the bounding box.
  var oversize = bbox[0] < -180 - ε
      || bbox[1] < -90 - ε
      || bbox[2] > 180 + ε
      || bbox[3] > 90 + ε;
  if (!system) {
    system = systems[oversize ? "cartesian" : "spherical"];
    if (options) options["coordinate-system"] = system.name;
  }

  if (system === systems.spherical) {
    if (oversize) throw new Error("spherical coordinates outside of [±180°, ±90°]");

    // When near the spherical coordinate limits, clamp to nice round values.
    // This avoids quantized coordinates that are slightly outside the limits.
    if (bbox[0] < -180 + ε) bbox[0] = -180;
    if (bbox[1] < -90 + ε) bbox[1] = -90;
    if (bbox[2] > 180 - ε) bbox[2] = 180;
    if (bbox[3] > 90 - ε) bbox[3] = 90;
  }

  if (verbose) {
    console.warn("bounds: " + bbox.join(" ") + " (" + system.name + ")");
  }

  // Filter rings smaller than the minimum area.
  // This can produce a simpler topology.
  if (minimumArea) prefilter(objects, function(ring) {
    return system.absoluteArea(system.ringArea(ring)) >= minimumArea;
  });

  // Compute the quantization transform.
  if (Q) {
    transform = quantize(objects, bbox, Q);
    if (verbose) {
      console.warn("quantization: " + transform.scale.map(function(degrees) { return system.formatDistance(degrees / 180 * Math.PI); }).join(" "));
    }
  }

  // Remove any antimeridian cuts and restitch.
  if (system === systems.spherical && stitchPoles) {
    stitch(objects, transform);
  }

  // Compute the topology.
  var topology = topologize(objects);
  topology.bbox = bbox;

  if (verbose) {
    console.warn("topology: " + topology.arcs.length + " arcs, " + topology.arcs.reduce(function(p, v) { return p + v.length; }, 0) + " points");
  }

  // Convert to delta-encoding.
  if (Q) topology.transform = transform, delta(topology);

  return topology;
};

},{"./bounds":67,"./compute-id":70,"./coordinate-systems":71,"./delta":72,"./geomify":74,"./prefilter":75,"./quantize":77,"./stitch":80,"./topology/index":86,"./transform-properties":90,"./type":91}],82:[function(require,module,exports){
var join = require("./join");

// Given an extracted (pre-)topology, cuts (or rotates) arcs so that all shared
// point sequences are identified. The topology can then be subsequently deduped
// to remove exact duplicate arcs.
module.exports = function(topology) {
  var junctionByPoint = join(topology),
      coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings;

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineMid = line[0],
        lineEnd = line[1];
    while (++lineMid < lineEnd) {
      if (junctionByPoint.get(coordinates[lineMid])) {
        var next = {0: lineMid, 1: line[1]};
        line[1] = lineMid;
        line = line.next = next;
      }
    }
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0],
        ringMid = ringStart,
        ringEnd = ring[1],
        ringFixed = junctionByPoint.get(coordinates[ringStart]);
    while (++ringMid < ringEnd) {
      if (junctionByPoint.get(coordinates[ringMid])) {
        if (ringFixed) {
          var next = {0: ringMid, 1: ring[1]};
          ring[1] = ringMid;
          ring = ring.next = next;
        } else { // For the first junction, we can rotate rather than cut.
          rotateArray(coordinates, ringStart, ringEnd, ringEnd - ringMid);
          coordinates[ringEnd] = coordinates[ringStart];
          ringFixed = true;
          ringMid = ringStart; // restart; we may have skipped junctions
        }
      }
    }
  }

  return topology;
};

function rotateArray(array, start, end, offset) {
  reverse(array, start, end);
  reverse(array, start, start + offset);
  reverse(array, start + offset, end);
}

function reverse(array, start, end) {
  for (var mid = start + ((end-- - start) >> 1), t; start < mid; ++start, --end) {
    t = array[start], array[start] = array[end], array[end] = t;
  }
}

},{"./join":87}],83:[function(require,module,exports){
var join = require("./join"),
    hashtable = require("./hashtable"),
    hashPoint = require("./point-hash"),
    equalPoint = require("./point-equal");

// Given a cut topology, combines duplicate arcs.
module.exports = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      arcCount = lines.length + rings.length;

  delete topology.lines;
  delete topology.rings;

  // Count the number of (non-unique) arcs to initialize the hashtable safely.
  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i]; while (line = line.next) ++arcCount;
  }
  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i]; while (ring = ring.next) ++arcCount;
  }

  var arcsByEnd = hashtable(arcCount * 2, hashPoint, equalPoint),
      arcs = topology.arcs = [];

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i];
    do {
      dedupLine(line);
    } while (line = line.next);
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i];
    if (ring.next) { // arc is no longer closed
      do {
        dedupLine(ring);
      } while (ring = ring.next);
    } else {
      dedupRing(ring);
    }
  }

  function dedupLine(arc) {
    var startPoint,
        endPoint,
        startArcs,
        endArcs;

    // Does this arc match an existing arc in order?
    if (startArcs = arcsByEnd.get(startPoint = coordinates[arc[0]])) {
      for (var i = 0, n = startArcs.length; i < n; ++i) {
        var startArc = startArcs[i];
        if (equalLine(startArc, arc)) {
          arc[0] = startArc[0];
          arc[1] = startArc[1];
          return;
        }
      }
    }

    // Does this arc match an existing arc in reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[1]])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (reverseEqualLine(endArc, arc)) {
          arc[1] = endArc[0];
          arc[0] = endArc[1];
          return;
        }
      }
    }

    if (startArcs) startArcs.push(arc); else arcsByEnd.set(startPoint, [arc]);
    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function dedupRing(arc) {
    var endPoint,
        endArcs;

    // Does this arc match an existing line in order, or reverse order?
    // Rings are closed, so their start point and end point is the same.
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0]])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    // Otherwise, does this arc match an existing ring in order, or reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0] + findMinimumOffset(arc)])) {
      for (var i = 0, n = endArcs.length; i < n; ++i) {
        var endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function equalLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, ++ib) if (!equalPoint(coordinates[ia], coordinates[ib])) return false;
    return true;
  }

  function reverseEqualLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, --jb) if (!equalPoint(coordinates[ia], coordinates[jb])) return false;
    return true;
  }

  function equalRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[ib + (i + kb) % n])) return false;
    }
    return true;
  }

  function reverseEqualRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = n - findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[jb - (i + kb) % n])) return false;
    }
    return true;
  }

  // Rings are rotated to a consistent, but arbitrary, start point.
  // This is necessary to detect when a ring and a rotated copy are dupes.
  function findMinimumOffset(arc) {
    var start = arc[0],
        end = arc[1],
        mid = start,
        minimum = mid,
        minimumPoint = coordinates[mid];
    while (++mid < end) {
      var point = coordinates[mid];
      if (point[0] < minimumPoint[0] || point[0] === minimumPoint[0] && point[1] < minimumPoint[1]) {
        minimum = mid;
        minimumPoint = point;
      }
    }
    return minimum - start;
  }

  return topology;
};

},{"./hashtable":85,"./join":87,"./point-equal":88,"./point-hash":89}],84:[function(require,module,exports){
// Extracts the lines and rings from the specified hash of geometry objects.
//
// Returns an object with three properties:
//
// * coordinates - shared buffer of [x, y] coordinates
// * lines - lines extracted from the hash, of the form [start, end]
// * rings - rings extracted from the hash, of the form [start, end]
//
// For each ring or line, start and end represent inclusive indexes into the
// coordinates buffer. For rings (and closed lines), coordinates[start] equals
// coordinates[end].
//
// For each line or polygon geometry in the input hash, including nested
// geometries as in geometry collections, the `coordinates` array is replaced
// with an equivalent `arcs` array that, for each line (for line string
// geometries) or ring (for polygon geometries), points to one of the above
// lines or rings.
module.exports = function(objects) {
  var index = -1,
      lines = [],
      rings = [],
      coordinates = [];

  function extractGeometry(geometry) {
    if (geometry && extractGeometryType.hasOwnProperty(geometry.type)) extractGeometryType[geometry.type](geometry);
  }

  var extractGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(extractGeometry); },
    LineString: function(o) { o.arcs = extractLine(o.coordinates); delete o.coordinates; },
    MultiLineString: function(o) { o.arcs = o.coordinates.map(extractLine); delete o.coordinates; },
    Polygon: function(o) { o.arcs = o.coordinates.map(extractRing); delete o.coordinates; },
    MultiPolygon: function(o) { o.arcs = o.coordinates.map(extractMultiRing); delete o.coordinates; }
  };

  function extractLine(line) {
    for (var i = 0, n = line.length; i < n; ++i) coordinates[++index] = line[i];
    var arc = {0: index - n + 1, 1: index};
    lines.push(arc);
    return arc;
  }

  function extractRing(ring) {
    for (var i = 0, n = ring.length; i < n; ++i) coordinates[++index] = ring[i];
    var arc = {0: index - n + 1, 1: index};
    rings.push(arc);
    return arc;
  }

  function extractMultiRing(rings) {
    return rings.map(extractRing);
  }

  for (var key in objects) {
    extractGeometry(objects[key]);
  }

  return {
    type: "Topology",
    coordinates: coordinates,
    lines: lines,
    rings: rings,
    objects: objects
  };
};

},{}],85:[function(require,module,exports){
module.exports = function(size, hash, equal) {
  var hashtable = new Array(size = 1 << Math.ceil(Math.log(size) / Math.LN2)),
      mask = size - 1,
      free = size;

  function set(key, value) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) return match.value = value;
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) throw new Error("full hashtable");
    }
    hashtable[index] = {key: key, value: value};
    --free;
    return value;
  }

  function get(key, missingValue) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) return match.value;
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) break;
    }
    return missingValue;
  }

  function remove(key) {
    var index = hash(key) & mask,
        match = hashtable[index],
        cycle = !index;
    while (match != null) {
      if (equal(match.key, key)) {
        hashtable[index] = null;
        match = hashtable[index = (index + 1) & mask];
        if (match != null) { // delete and re-add
          ++free;
          hashtable[index] = null;
          set(match.key, match.value);
        }
        ++free;
        return true;
      }
      match = hashtable[index = (index + 1) & mask];
      if (!index && cycle++) break;
    }
    return false;
  }

  function keys() {
    var keys = [];
    for (var i = 0, n = hashtable.length; i < n; ++i) {
      var match = hashtable[i];
      if (match != null) keys.push(match.key);
    }
    return keys;
  }

  return {
    set: set,
    get: get,
    remove: remove,
    keys: keys
  };
};

},{}],86:[function(require,module,exports){
var hashtable = require("./hashtable"),
    extract = require("./extract"),
    cut = require("./cut"),
    dedup = require("./dedup");

// Constructs the TopoJSON Topology for the specified hash of geometries.
// Each object in the specified hash must be a GeoJSON object,
// meaning FeatureCollection, a Feature or a geometry object.
module.exports = function(objects) {
  var topology = dedup(cut(extract(objects))),
      coordinates = topology.coordinates,
      indexByArc = hashtable(topology.arcs.length, hashArc, equalArc);

  objects = topology.objects; // for garbage collection

  topology.arcs = topology.arcs.map(function(arc, i) {
    indexByArc.set(arc, i);
    return coordinates.slice(arc[0], arc[1] + 1);
  });

  delete topology.coordinates;
  coordinates = null;

  function indexGeometry(geometry) {
    if (geometry && indexGeometryType.hasOwnProperty(geometry.type)) indexGeometryType[geometry.type](geometry);
  }

  var indexGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(indexGeometry); },
    LineString: function(o) { o.arcs = indexArcs(o.arcs); },
    MultiLineString: function(o) { o.arcs = o.arcs.map(indexArcs); },
    Polygon: function(o) { o.arcs = o.arcs.map(indexArcs); },
    MultiPolygon: function(o) { o.arcs = o.arcs.map(indexMultiArcs); }
  };

  function indexArcs(arc) {
    var indexes = [];
    do {
      var index = indexByArc.get(arc);
      indexes.push(arc[0] < arc[1] ? index : ~index);
    } while (arc = arc.next);
    return indexes;
  }

  function indexMultiArcs(arcs) {
    return arcs.map(indexArcs);
  }

  for (var key in objects) {
    indexGeometry(objects[key]);
  }

  return topology;
};

function hashArc(arc) {
  var i = arc[0], j = arc[1], t;
  if (j < i) t = i, i = j, j = t;
  return i + 31 * j;
}

function equalArc(arcA, arcB) {
  var ia = arcA[0], ja = arcA[1],
      ib = arcB[0], jb = arcB[1], t;
  if (ja < ia) t = ia, ia = ja, ja = t;
  if (jb < ib) t = ib, ib = jb, jb = t;
  return ia === ib && ja === jb;
}

},{"./cut":82,"./dedup":83,"./extract":84,"./hashtable":85}],87:[function(require,module,exports){
var hashtable = require("./hashtable"),
    hashPoint = require("./point-hash"),
    equalPoint = require("./point-equal");

// Given an extracted (pre-)topology, identifies all of the junctions. These are
// the points at which arcs (lines or rings) will need to be cut so that each
// arc is represented uniquely.
//
// A junction is a point where at least one arc deviates from another arc going
// through the same point. For example, consider the point B. If there is a arc
// through ABC and another arc through CBA, then B is not a junction because in
// both cases the adjacent point pairs are {A,C}. However, if there is an
// additional arc ABD, then {A,D} != {A,C}, and thus B becomes a junction.
//
// For a closed ring ABCA, the first point A’s adjacent points are the second
// and last point {B,C}. For a line, the first and last point are always
// considered junctions, even if the line is closed; this ensures that a closed
// line is never rotated.
module.exports = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      visitedByPoint,
      neighborsByPoint = hashtable(coordinates.length, hashPoint, equalPoint),
      junctionByPoint = hashtable(coordinates.length, hashPoint, equalPoint);

  for (var i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineStart = line[0],
        lineEnd = line[1],
        previousPoint = null,
        currentPoint = coordinates[lineStart],
        nextPoint = coordinates[++lineStart];
    visitedByPoint = hashtable(lineEnd - lineStart, hashPoint, equalPoint);
    junctionByPoint.set(currentPoint, true); // start
    while (++lineStart <= lineEnd) {
      sequence(previousPoint = currentPoint, currentPoint = nextPoint, nextPoint = coordinates[lineStart]);
    }
    junctionByPoint.set(nextPoint, true); // end
  }

  for (var i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0] + 1,
        ringEnd = ring[1],
        previousPoint = coordinates[ringEnd - 1],
        currentPoint = coordinates[ringStart - 1],
        nextPoint = coordinates[ringStart];
    visitedByPoint = hashtable(ringEnd - ringStart + 1, hashPoint, equalPoint);
    sequence(previousPoint, currentPoint, nextPoint);
    while (++ringStart <= ringEnd) {
      sequence(previousPoint = currentPoint, currentPoint = nextPoint, nextPoint = coordinates[ringStart]);
    }
  }

  function sequence(previousPoint, currentPoint, nextPoint) {
    if (visitedByPoint.get(currentPoint)) return; // ignore self-intersection
    visitedByPoint.set(currentPoint, true);
    var neighbors = neighborsByPoint.get(currentPoint);
    if (neighbors) {
      if (!(equalPoint(neighbors[0], previousPoint)
        && equalPoint(neighbors[1], nextPoint))
        && !(equalPoint(neighbors[0], nextPoint)
        && equalPoint(neighbors[1], previousPoint))) {
        junctionByPoint.set(currentPoint, true);
      }
    } else {
      neighborsByPoint.set(currentPoint, [previousPoint, nextPoint]);
    }
  }

  return junctionByPoint;
};

},{"./hashtable":85,"./point-equal":88,"./point-hash":89}],88:[function(require,module,exports){
module.exports = function(pointA, pointB) {
  return pointA[0] === pointB[0] && pointA[1] === pointB[1];
};

},{}],89:[function(require,module,exports){
// TODO if quantized, use simpler Int32 hashing?

var hashBuffer = new ArrayBuffer(8),
    hashFloats = new Float64Array(hashBuffer),
    hashInts = new Int32Array(hashBuffer);

function hashFloat(x) {
  hashFloats[0] = x;
  x = hashInts[1] ^ hashInts[0];
  x ^= (x >>> 20) ^ (x >>> 12);
  x ^= (x >>> 7) ^ (x >>> 4);
  return x;
}

module.exports = function(point) {
  var h = (hashFloat(point[0]) + 31 * hashFloat(point[1])) | 0;
  return h < 0 ? ~h : h;
};

},{}],90:[function(require,module,exports){
// Given a hash of GeoJSON objects, transforms any properties on features using
// the specified transform function. The function is invoked for each existing
// property on the current feature, being passed the new properties hash, the
// property name, and the property value. The function is then expected to
// assign a new value to the given property hash if the feature is to be
// retained and return true. Or, to skip the property, do nothing and return
// false. If no properties are propagated to the new properties hash, the
// properties hash will be deleted from the current feature.
module.exports = function(objects, propertyTransform) {
  if (arguments.length < 2) propertyTransform = function() {};

  function transformObject(object) {
    if (object && transformObjectType.hasOwnProperty(object.type)) transformObjectType[object.type](object);
  }

  function transformFeature(feature) {
    if (feature.properties) {
      var properties0 = feature.properties,
          properties1 = {},
          empty = true;

      for (var key0 in properties0) {
        if (propertyTransform(properties1, key0, properties0[key0])) {
          empty = false;
        }
      }

      if (empty) delete feature.properties;
      else feature.properties = properties1;
    }
  }

  var transformObjectType = {
    Feature: transformFeature,
    FeatureCollection: function(collection) { collection.features.forEach(transformFeature); }
  };

  for (var key in objects) {
    transformObject(objects[key]);
  }

  return objects;
};

},{}],91:[function(require,module,exports){
module.exports = function(types) {
  for (var type in typeDefaults) {
    if (!(type in types)) {
      types[type] = typeDefaults[type];
    }
  }
  types.defaults = typeDefaults;
  return types;
};

var typeDefaults = {

  Feature: function(feature) {
    if (feature.geometry) this.geometry(feature.geometry);
  },

  FeatureCollection: function(collection) {
    var features = collection.features, i = -1, n = features.length;
    while (++i < n) this.Feature(features[i]);
  },

  GeometryCollection: function(collection) {
    var geometries = collection.geometries, i = -1, n = geometries.length;
    while (++i < n) this.geometry(geometries[i]);
  },

  LineString: function(lineString) {
    this.line(lineString.coordinates);
  },

  MultiLineString: function(multiLineString) {
    var coordinates = multiLineString.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  },

  MultiPoint: function(multiPoint) {
    var coordinates = multiPoint.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  MultiPolygon: function(multiPolygon) {
    var coordinates = multiPolygon.coordinates, i = -1, n = coordinates.length;
    while (++i < n) this.polygon(coordinates[i]);
  },

  Point: function(point) {
    this.point(point.coordinates);
  },

  Polygon: function(polygon) {
    this.polygon(polygon.coordinates);
  },

  object: function(object) {
    return object == null ? null
        : typeObjects.hasOwnProperty(object.type) ? this[object.type](object)
        : this.geometry(object);
  },

  geometry: function(geometry) {
    return geometry == null ? null
        : typeGeometries.hasOwnProperty(geometry.type) ? this[geometry.type](geometry)
        : null;
  },

  point: function() {},

  line: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.point(coordinates[i]);
  },

  polygon: function(coordinates) {
    var i = -1, n = coordinates.length;
    while (++i < n) this.line(coordinates[i]);
  }
};

var typeGeometries = {
  LineString: 1,
  MultiLineString: 1,
  MultiPoint: 1,
  MultiPolygon: 1,
  Point: 1,
  Polygon: 1,
  GeometryCollection: 1
};

var typeObjects = {
  Feature: 1,
  FeatureCollection: 1
};

},{}]},{},[1])