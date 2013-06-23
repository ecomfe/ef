define(
    function (require) {
        var lib = require('esui/lib');
        var TreeStrategy = require('esui/TreeStrategy');

        function RemoteTreeStrategy (options) {
            if (options.requestMethod) {
                options.requestMethod = options.requestMethod.toLowerCase();
            }
            TreeStrategy.apply(this, arguments);
            this.workingRequests = {};
        }

        RemoteTreeStrategy.prototype.urlTemplate = '';

        RemoteTreeStrategy.prototype.requestMethod = 'get';

        RemoteTreeStrategy.prototype.getRequestURL = function (node) {
            return lib.format(this.urlTemplate, node);
        };

        RemoteTreeStrategy.prototype.getRequestData = function (node) {
            return null;
        };

        RemoteTreeStrategy.prototype.requestNodeData = function (node) {
            var url = this.getRequestURL(node);
            var data = this.getRequestData(node);
            var ajax = require('er/ajax');

            return this.requestMethod === 'get'
                ? ajax.getJSON(url, data, this.useCache || false)
                : ajax.post(url, data, 'json');
        };

        function expandNode(tree, strategy, e) {
            var node = e.node;
            if (node.children) {
                tree.expandNode(node.id);
                return;
            }

            // 如果原来就在请求数据，把原来的断掉
            var xhr = workingRequests[node.id];
            if (xhr) {
                xhr.abort();
            }
            xhr = this.requestNodeData(node);
            workingRequests[node.id] = xhr;
            xhr.done(lib.bind(tree.expandNode, tree, node.id));
        }

        RemoteTreeStrategy.prototype.enableToggleStrategy = function (tree) {
            tree.on(
                'expand', 
                lib.curry(expandNode, tree, this)
            );
            tree.on(
                'collapse',
                function (e) {
                    this.collapseNode(e.node.id, false);
                }
            );
        };

        lib.inherits(RemoteTreeStrategy, TreeStrategy);
        return RemoteTreeStrategy;
    }
);