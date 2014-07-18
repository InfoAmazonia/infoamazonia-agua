'use strict';

module.exports = [
	'btfModal',
	function(btfModal) {
		return btfModal({
			controller: 'AguaMapCtrl',
			controllerAs: 'embed',
			templateUrl: '/views/map/embed.html'
		});
	}
];