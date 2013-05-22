define(
    function(require) {
        var Action = require('er/Action');

        function MemberForm() {
            Action.apply(this, arguments);
        }

        function submitHandle(e) {
            this.model.save(e.data);
        }

        MemberForm.prototype.modelType = require('./FormModel');

        MemberForm.prototype.viewType = require('./FormView');

        MemberForm.prototype.initBehavior = function() {
            this.view.on('submitted', submitHandle.bind(this));
        };

        require('er/util').inherits(MemberForm, Action);

        return MemberForm;
    }
);