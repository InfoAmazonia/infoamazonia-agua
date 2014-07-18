'use strict';

var saveAs = require('filesaver.js');

/*
 * Agua map actions controller
 */

module.exports = [
	'$scope',
	'MapEmbed',
	function($scope, MapEmbed) {

		$scope.embed = function(embedUrl) {
			MapEmbed.activate({
				width: 750,
				height: 450,
				embedUrl: embedUrl,
				close: function() {
					MapEmbed.deactivate();
				}
			});

			$scope.$on('$destroy', function() {
				MapEmbed.deactivate();
			});
		}

		$scope.download = function(data, filename) {

			var data = angular.copy(data);

			var output = JSON.stringify(data);

			saveAs(new Blob([output], {
				type: 'text/plain;charset=utf-8'
			}), filename);

		}

	}
];