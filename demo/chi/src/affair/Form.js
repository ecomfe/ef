define(
    function(require) {
        var Action = require('er/Action');

        function AffairRead() {
            Action.apply(this, arguments);
        }

        function submit() {
        }

        AffairRead.prototype.modelType = require('./FormModel');

        AffairRead.prototype.viewType = require('./FormView');

        AffairRead.prototype.initBehavior = function() {
            //this.view.on('buy', require('er/util').bind(buyBook, this))
        };

        require('er/util').inherits(AffairRead, Action);

        return AffairRead;
    }
);