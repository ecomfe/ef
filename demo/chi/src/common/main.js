define(
    function (require) {
        function init() { 
            require('er/Deferred').syncModeEnabled = true;
            require('../affair/config');
            require('../member/config');
            require('er').start();
        }

        return {
            init: init
        };
    }
);