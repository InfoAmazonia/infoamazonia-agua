'use strict';

module.exports = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'MapActionsCtrl',
			controllerAs: 'embed',
			templateUrl: '/views/map/embed.html'
		});
	}
];