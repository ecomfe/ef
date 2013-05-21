define(
    function (require) {
        function init() {
            require('../affair/config');

            require('er').start();
        }

        return {
            init: init
        };
    }
);