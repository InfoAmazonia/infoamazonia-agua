'use strict';

angular.module('mapasColetivos.pageTitle', [])

.factory('Page', [
	function() {
		var baseTitle = 'InfoAmazonia Água';
		var title = baseTitle;
		return {
			title: function() {
				return title;
			},
			setTitle: function(val) {
				if(val)
					title = val + ' - ' + baseTitle;
				else
					title = baseTitle;
			}
		}
	}
]);