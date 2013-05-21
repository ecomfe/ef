define(
    function (require) {
        var Action = require('er/Action');

        function AffairList() {
            Action.apply(this, arguments);
        }

        AffairList.prototype.modelType = require('./ListModel');

        AffairList.prototype.viewType = require('./ListView');

        require('er/util').inherits(AffairList, Action);
        return AffairList;
    }
);