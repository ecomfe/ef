define(
    function (require) {
        require('er/tpl!./form.tpl');
        require('esui/Button');
        require('esui/TextBox');
        require('esui/Select');
        require('esui/Calendar');
        // css
        require('css!./form.css');

        var AffairType = require('./config').AffairType;


        var UIView = require('ef/UIView');

        function AffairFormView() {
            UIView.apply(this, arguments);
        }

        AffairFormView.prototype.template = 'affairForm';

        require('er/util').inherits(AffairFormView, UIView);
        return AffairFormView;
    }
);