define(
    function(require) {
        var Action = require('er/Action');

        function AffairForm() {
            Action.apply(this, arguments);
        }

        function submitAffair(e) {
            this.model.save(e.affair);
        }

        AffairForm.prototype.modelType = require('./FormModel');

        AffairForm.prototype.viewType = require('./FormView');

        AffairForm.prototype.initBehavior = function() {
            this.view.on('submit', require('er/util').bind(submitAffair, this));
        };

        require('er/util').inherits(AffairForm, Action);

        return AffairForm;
    }
);