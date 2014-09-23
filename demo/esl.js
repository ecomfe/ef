/**
 * ESL (Enterprise Standard Loader)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @file Browser端标准加载器，符合AMD规范
 * @author errorrik(errorrik@gmail.com)
 *         Firede(firede@firede.us)
 */

// HACK: 特别放开限制 - 有的正则比较长；开头有两个预声明的全局变量
/* jshint maxlen: 100, unused: false */

var define;
var require;

(function ( global ) {
    // "mod"开头的变量或函数为内部模块管理函数
    // 为提高压缩率，不使用function或object包装

    /**
     * 模块容器
     *
     * @inner
     * @type {Object}
     */
    var modModules = {};

    /**
     * 模块容器副本，不包含resource
     * 在modAnalyse时，从list里遍历比forin更高效
     *
     * @inner
     * @type {Array}
     */
    var modModuleList = [];

    /**
     * 自动定义的模块表
     *
     * 模块define factory是用到时才执行，但是以下几种情况需要自动马上执行：
     * 1. require( [moduleId], callback )
     * 2. plugin module: require( 'plugin!resource' )
     *
     * @inner
     * @type {Object}
     */
    var autoDefineModules = {};


    // 模块状态枚举量
    var MODULE_PRE_DEFINED = 1;
    var MODULE_ANALYZED = 2;
    var MODULE_PREPARED = 3;
    var MODULE_DEFINED = 4;

    /**
     * 全局require函数
     *
     * @inner
     * @type {Function}
     */
    var actualGlobalRequire = createLocalRequire();

    // #begin-ignore
    /**
     * 超时提醒定时器
     *
     * @inner
     * @type {number}
     */
    var waitTimeout;
    // #end-ignore

    /**
     * 加载模块
     *
     * @param {string|Array} requireId 模块id或模块id数组，
     * @param {Function=} callback 加载完成的回调函数
     * @return {*}
     */
    function require( requireId, callback ) {
        // #begin-ignore
        // #begin assertNotContainRelativeId
        // 确定require的模块id不包含相对id。用于global require，提前预防难以跟踪的错误出现
        var invalidIds = [];

        /**
         * 监测模块id是否relative id
         *
         * @inner
         * @param {string} id 模块id
         */
        function monitor( id ) {
            if ( id.indexOf( '.' ) === 0 ) {
                invalidIds.push( id );
            }
        }

        if ( typeof requireId === 'string' ) {
            monitor( requireId );
        }
        else {
            each(
                requireId,
                function ( id ) {
                    monitor( id );
                }
            );
        }

        // 包含相对id时，直接抛出错误
        if ( invalidIds.length > 0 ) {
            throw new Error(
                '[REQUIRE_FATAL]Relative ID is not allowed in global require: '
                + invalidIds.join( ', ' )
            );
        }
        // #end assertNotContainRelativeId

        // 超时提醒
        var timeout = requireConf.waitSeconds;
        if ( timeout && (requireId instanceof Array) ) {
            if ( waitTimeout ) {
                clearTimeout( waitTimeout );
            }
            waitTimeout = setTimeout( waitTimeoutNotice, timeout * 1000 );
        }
        // #end-ignore

        return actualGlobalRequire( requireId, callback );
    }

    /**
     * 将模块标识转换成相对的url
     *
     * @param {string} id 模块标识
     * @return {string}
     */
    require.toUrl = actualGlobalRequire.toUrl;

    // #begin-ignore
    /**
     * 超时提醒函数
     *
     * @inner
     */
    function waitTimeoutNotice() {
        var hangModules = [];
        var missModules = [];
        var hangModulesMap = {};
        var missModulesMap = {};
        var visited = {};

        /**
         * 检查模块的加载错误
         *
         * @inner
         * @param {string} id 模块id
         */
        function checkError( id, hard ) {
            if ( visited[ id ] || modIs( id, MODULE_DEFINED ) ) {
                return;
            }

            visited[ id ] = 1;

            if ( !modIs( id, MODULE_PREPARED ) ) {
                // HACK: 为gzip后体积优化，不做抽取
                if ( !hangModulesMap[ id ] ) {
                    hangModulesMap[ id ] = 1;
                    hangModules.push( id );
                }
            }

            var module = modModules[ id ];
            if ( !module ) {
                if ( !missModulesMap[ id ] ) {
                    missModulesMap[ id ] = 1;
                    missModules.push( id );
                }
            }
            else if ( hard ) {
                if ( !hangModulesMap[ id ] ) {
                    hangModulesMap[ id ] = 1;
                    hangModules.push( id );
                }

                each(
                    module.depMs,
                    function ( dep ) {
                        checkError( dep.absId, dep.hard );
                    }
                );
            }
        }

        for ( var id in autoDefineModules ) {
            checkError( id, 1 );
        }

        if ( hangModules.length || missModules.length ) {
            throw new Error( '[MODULE_TIMEOUT]Hang( '
                + ( hangModules.join( ', ' ) || 'none' )
                + ' ) Miss( '
                + ( missModules.join( ', ' ) || 'none' )
                + ' )'
            );
        }
    }
    // #end-ignore

    /**
     * 尝试完成模块定义的定时器
     *
     * @inner
     * @type {number}
     */
    var tryDefineTimeout;

    /**
     * 定义模块
     *
     * @param {string=} id 模块标识
     * @param {Array=} dependencies 依赖模块列表
     * @param {Function=} factory 创建模块的工厂方法
     */
    function define() {
        var argsLen = arguments.length;
        if ( !argsLen ) {
            return;
        }

        var id;
        var dependencies;
        var factory = arguments[ --argsLen ];

        while ( argsLen-- ) {
            var arg = arguments[ argsLen ];

            if ( typeof arg === 'string' ) {
                id = arg;
            }
            else if ( arg instanceof Array ) {
                dependencies = arg;
            }
        }

        // 出现window不是疏忽
        // esl设计是做为browser端的loader
        // 闭包的global更多意义在于：
        //     define和require方法可以被挂到用户自定义对象中
        var opera = window.opera;

        // IE下通过current script的data-require-id获取当前id
        if (
            !id
            && document.attachEvent
            && (!(opera && opera.toString() === '[object Opera]'))
        ) {
            var currentScript = getCurrentScript();
            id = currentScript && currentScript.getAttribute('data-require-id');
        }

        if ( id ) {
            modPreDefine( id, dependencies, factory );

            // 在不远的未来尝试完成define
            // define可能是在页面中某个地方调用，不一定是在独立的文件被require装载
            if ( tryDefineTimeout ) {
                clearTimeout( tryDefineTimeout );
            }
            tryDefineTimeout = setTimeout( modAnalyse, 1 );
        }
        else {
            // 纪录到共享变量中，在load或readystatechange中处理
            // 标准浏览器下，使用匿名define时，将进入这个分支
            wait4PreDefine[ 0 ] = {
                deps    : dependencies,
                factory : factory
            };
        }
    }

    define.amd = {};

    /**
     * 模块配置获取函数
     *
     * @inner
     * @return {Object} 模块配置对象
     */
    function moduleConfigGetter() {
        var conf = requireConf.config[ this.id ];
        if ( conf && typeof conf === 'object' ) {
            return conf;
        }

        return {};
    }

    /**
     * 预定义模块
     *
     * @inner
     * @param {string} id 模块标识
     * @param {Array.<string>} dependencies 显式声明的依赖模块列表
     * @param {*} factory 模块定义函数或模块对象
     */
    function modPreDefine( id, dependencies, factory ) {
        // 模块内部信息包括
        // -----------------------------------
        // id: module id
        // depsDec: 模块定义时声明的依赖
        // deps: 模块依赖，默认为['require', 'exports', 'module']
        // factory: 初始化函数或对象
        // factoryDeps: 初始化函数的参数依赖
        // exports: 模块的实际暴露对象（AMD定义）
        // config: 用于获取模块配置信息的函数（AMD定义）
        // state: 模块当前状态
        // require: local require函数
        // depMs: 实际依赖的模块集合，数组形式
        // depMkv: 实际依赖的模块集合，表形式，便于查找
        // depRs: 实际依赖的资源集合
        // depPMs: 用于加载资源的模块集合，key是模块名，value是1，仅用于快捷查找
        // ------------------------------------
        if ( !modModules[ id ] ) {
            var module = {
                id          : id,
                depsDec     : dependencies,
                deps        : dependencies || ['require', 'exports', 'module'],
                factoryDeps : [],
                factory     : factory,
                exports     : {},
                config      : moduleConfigGetter,
                state       : MODULE_PRE_DEFINED,
                require     : createLocalRequire( id ),
                depMs       : [],
                depMkv      : {},
                depRs       : [],
                depPMs      : []
            };

            // 将模块存入容器
            modModules[ id ] = module;
            modModuleList.push( module );
        }
    }

    /**
     * 预分析模块
     *
     * 首先，完成对factory中声明依赖的分析提取
     * 然后，尝试加载"资源加载所需模块"
     *
     * 需要先加载模块的原因是：如果模块不存在，无法进行resourceId normalize化
     * modAnalyse完成后续的依赖分析处理，并进行依赖模块的加载
     *
     * @inner
     * @param {Object} modules 模块对象
     */
    function modAnalyse() {
        var requireModules = [];
        var requireModulesIndex = {};

        /**
         * 添加需要请求的模块
         *
         * @inner
         * @param {string} id 模块id
         */
        function addRequireModule( id ) {
            if ( modModules[ id ] || requireModulesIndex[ id ] ) {
                return;
            }

            requireModules.push( id );
            requireModulesIndex[ id ] = 1;
        }

        each( modModuleList, function ( module ) {
            if ( module.state > MODULE_PRE_DEFINED ) {
                return;
            }

            var deps = module.deps;
            var hardDependsCount = 0;
            var factory = module.factory;

            // 分析function body中的require
            // 如果包含显式依赖声明，根据AMD规定和性能考虑，可以不分析factoryBody
            if ( typeof factory === 'function' ) {
                hardDependsCount = Math.min( factory.length, deps.length );

                // If the dependencies argument is present, the module loader
                // SHOULD NOT scan for dependencies within the factory function.
                !module.depsDec && factory.toString()
                    .replace( /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, '' )
                    .replace( /require\(\s*(['"'])([^'"]+)\1\s*\)/g,
                        function ( $0, $1, depId ) {
                            deps.push( depId );
                        }
                    );
            }

            each( deps, function ( depId, index ) {
                var idInfo = parseId( depId );
                var absId = normalize( idInfo.module, module.id );
                var moduleInfo, resInfo;

                if ( absId && !BUILDIN_MODULE[ absId ] ) {
                    // 如果依赖是一个资源，将其信息添加到module.depRs
                    //
                    // module.depRs中的项有可能是重复的。
                    // 在这个阶段，加载resource的module可能还未defined，
                    // 导致此时resource id无法被normalize。
                    //
                    // 比如对a/b/c而言，下面几个resource可能指的是同一个资源：
                    // - js!../name.js
                    // - js!a/name.js
                    // - ../../js!../name.js
                    //
                    // 所以加载资源的module ready时，需要遍历module.depRs进行处理
                    if ( idInfo.resource ) {
                        resInfo = {
                            id       : depId,
                            module   : absId,
                            resource : idInfo.resource
                        };
                        autoDefineModules[ absId ] = 1;
                        module.depPMs.push( absId );
                        module.depRs.push( resInfo );
                    }

                    // 对依赖模块的id normalize能保证正确性，在此处进行去重
                    moduleInfo = module.depMkv[ absId ];
                    if ( !moduleInfo ) {
                        moduleInfo = {
                            id      : idInfo.module,
                            absId   : absId,
                            hard    : index < hardDependsCount
                        };
                        module.depMs.push( moduleInfo );
                        module.depMkv[ absId ] = moduleInfo;
                        addRequireModule( absId );
                    }
                }
                else {
                    moduleInfo = { absId: absId };
                }

                // 如果当前正在分析的依赖项是define中声明的，
                // 则记录到module.factoryDeps中
                // 在factory invoke前将用于生成invoke arguments
                if ( index < hardDependsCount ) {
                    module.factoryDeps.push( resInfo || moduleInfo );
                }
            } );

            module.state = MODULE_ANALYZED;
            modInitFactoryInvoker( module.id );
        });

        modAutoInvoke();
        nativeRequire( requireModules );
    }

    /**
     * 对一些需要自动定义的模块进行自动定义
     *
     * @inner
     */
    function modAutoInvoke() {
        for ( var id in autoDefineModules ) {
            modUpdatePreparedState( id );
            modTryInvokeFactory( id );
        }
    }

    /**
     * 更新模块的准备状态
     *
     * @inner
     * @param {string} id 模块id
     */
    function modUpdatePreparedState( id ) {
        var visited = {};
        update( id );

        function update( id ) {
            if ( !modIs( id, MODULE_ANALYZED ) ) {
                return false;
            }
            if ( modIs( id, MODULE_PREPARED ) || visited[ id ] ) {
                return true;
            }

            visited[ id ] = 1;
            var module = modModules[ id ];
            var prepared = true;

            each(
                module.depMs,
                function ( dep ) {
                    return ( prepared = update( dep.absId ) );
                }
            );

            // 判断resource是否加载完成。如果resource未加载完成，则认为未准备好
            prepared && each(
                module.depRs,
                function ( dep ) {
                    prepared = !!(dep.absId && modIs( dep.absId, MODULE_DEFINED ));
                    return prepared;
                }
            );

            if ( prepared ) {
                module.state = MODULE_PREPARED;
            }

            return prepared;
        }
    }

    /**
     * 初始化模块定义时所需的factory执行器
     *
     * @inner
     * @param {string} id 模块id
     */
    function modInitFactoryInvoker( id ) {
        var module = modModules[ id ];
        var invoking;

        module.invokeFactory = invokeFactory;
        each( module.depPMs, function ( pluginModuleId ) {
            modAddDefinedListener( pluginModuleId, function () {
                each( module.depRs, function ( res ) {
                    if ( !res.absId && res.module === pluginModuleId ) {
                        res.absId = normalize( res.id, id );
                        nativeRequire( [ res.absId ], modAutoInvoke );
                    }
                } );
            } );
        } );

        /**
         * 初始化模块
         *
         * @inner
         */
        function invokeFactory() {
            if ( invoking || module.state !== MODULE_PREPARED ) {
                return;
            }

            invoking = 1;

            // 拼接factory invoke所需的arguments
            var factoryReady = 1;
            var factoryDeps = [];
            each(
                module.factoryDeps,
                function ( dep ) {
                    var depId = dep.absId;

                    if ( !BUILDIN_MODULE[ depId ] ) {
                        modTryInvokeFactory( depId );
                        if ( !modIs( depId, MODULE_DEFINED ) ) {
                            factoryReady = 0;
                            return false;
                        }
                    }

                    factoryDeps.push( depId );
                }
            );

            if ( factoryReady ) {
                try {
                    var args = modGetModulesExports(
                        factoryDeps,
                        {
                            require : module.require,
                            exports : module.exports,
                            module  : module
                        }
                    );

                    // 调用factory函数初始化module
                    var factory = module.factory;
                    var exports = typeof factory === 'function'
                        ? factory.apply( global, args )
                        : factory;

                    if ( exports != null ) {
                        module.exports = exports;
                    }

                    module.invokeFactory = null;
                }
                catch ( ex ) {
                    invoking = 0;
                    if ( /^\[MODULE_MISS\]"([^"]+)/.test( ex.message ) ) {
                        // 出错，则说明在factory的运行中，该require的模块是需要的
                        // 所以把它加入强依赖中
                        var hardCirclurDep = module.depMkv[ RegExp.$1 ];
                        hardCirclurDep && (hardCirclurDep.hard = 1);
                        return;
                    }

                    throw ex;
                }

                // 完成define
                // 不放在try里，避免后续的运行错误被这里吞掉
                modDefined( id );
            }
        }
    }

    /**
     * 判断模块是否完成相应的状态
     *
     * @inner
     * @param {string} id 模块标识
     * @param {number} state 状态码，使用时传入相应的枚举变量，比如`MODULE_DEFINED`
     * @return {boolean}
     */
    function modIs( id, state ) {
        return modModules[ id ] && modModules[ id ].state >= state;
    }

    /**
     * 尝试执行模块factory函数，进行模块初始化
     *
     * @inner
     * @param {string} id 模块id
     */
    function modTryInvokeFactory( id ) {
        var module = modModules[ id ];

        if ( module && module.invokeFactory ) {
            module.invokeFactory();
        }
    }

    /**
     * 根据模块id数组，获取其的exports数组
     * 用于模块初始化的factory参数或require的callback参数生成
     *
     * @inner
     * @param {Array} modules 模块id数组
     * @param {Object} buildinModules 内建模块对象
     * @return {Array}
     */
    function modGetModulesExports( modules, buildinModules ) {
        var args = [];
        each(
            modules,
            function ( id, index ) {
                args[ index ] =
                    buildinModules[ id ]
                    || modGetModuleExports( id );
            }
        );

        return args;
    }

    /**
     * 模块定义完成事件监听器容器
     *
     * @inner
     * @type {Object}
     */
    var modDefinedListeners = {};

    /**
     * 添加模块定义完成时间的监听器
     *
     * @inner
     * @param {string} id 模块标识
     * @param {Function} listener 监听函数
     */
    function modAddDefinedListener( id, listener ) {
        if ( modIs( id, MODULE_DEFINED ) ) {
            listener();
            return;
        }

        var listeners = modDefinedListeners[ id ];
        if ( !listeners ) {
            listeners = modDefinedListeners[ id ] = [];
        }

        listeners.push( listener );
    }

    /**
     * 模块状态切换为定义完成
     * 因为需要触发事件，MODULE_DEFINED状态切换通过该函数
     *
     * @inner
     * @param {string} id 模块标识
     * @param {number} state 目标状态
     */
    function modDefined( id ) {
        var listeners = modDefinedListeners[ id ] || [];
        var module = modModules[ id ];
        module.state = MODULE_DEFINED;

        var len = listeners.length;
        while ( len-- ) {
            // 这里不做function类型的检测
            // 因为listener都是通过modOn传入的，modOn为内部调用
            listeners[ len ]();
        }

        // 清理listeners
        listeners.length = 0;
        delete modDefinedListeners[ id ];
    }

    /**
     * 获取模块的exports
     *
     * @inner
     * @param {string} id 模块标识
     * @return {*}
     */
    function modGetModuleExports( id ) {
        if ( modIs( id, MODULE_DEFINED ) ) {
            return modModules[ id ].exports;
        }

        return null;
    }

    /**
     * 内建module名称集合
     *
     * @inner
     * @type {Object}
     */
    var BUILDIN_MODULE = {
        require : require,
        exports : 1,
        module  : 1
    };

    /**
     * 未预定义的模块集合
     * 主要存储匿名方式define的模块
     *
     * @inner
     * @type {Array}
     */
    var wait4PreDefine = [];

    /**
     * 完成模块预定义，此时处理的模块是匿名define的模块
     *
     * @inner
     */
    function completePreDefine( currentId ) {
        // HACK: 这里在IE下有个性能陷阱，不能使用任何变量。
        //       否则貌似会形成变量引用和修改的读写锁，导致wait4PreDefine释放困难
        each( wait4PreDefine, function ( module ) {
            //needAnalyse = 1;
            modPreDefine(
                currentId,
                module.deps,
                module.factory
            );
        } );

        wait4PreDefine.length = 0;
        modAnalyse();
    }

    /**
     * 获取模块
     *
     * @param {string|Array} ids 模块名称或模块名称列表
     * @param {Function=} callback 获取模块完成时的回调函数
     * @return {Object}
     */
    function nativeRequire( ids, callback, baseId, noRequests ) {
        // 根据 https://github.com/amdjs/amdjs-api/wiki/require
        // It MUST throw an error if the module has not
        // already been loaded and evaluated.
        if ( typeof ids === 'string' ) {
            modTryInvokeFactory( ids );
            if ( !modIs( ids, MODULE_DEFINED ) ) {
                throw new Error( '[MODULE_MISS]"' + ids + '" is not exists!' );
            }

            return modGetModuleExports( ids );
        }

        noRequests = noRequests || {};
        var isCallbackCalled = 0;
        if ( ids instanceof Array ) {
            modAutoInvoke();
            tryFinishRequire();

            if ( !isCallbackCalled ) {
                each( ids, function ( id ) {

                    if ( !(BUILDIN_MODULE[ id ] || modIs( id, MODULE_DEFINED )) ) {
                        modAddDefinedListener( id, tryFinishRequire );

                        if ( !noRequests[ id ] ) {
                            ( id.indexOf( '!' ) > 0
                                ? loadResource
                                : loadModule
                            )( id, baseId );
                        }
                    }

                } );
            }
        }

        /**
         * 尝试完成require，调用callback
         * 在模块与其依赖模块都加载完时调用
         *
         * @inner
         */
        function tryFinishRequire() {
            if ( !isCallbackCalled ) {
                var isAllCompleted = 1;
                each( ids, function ( id ) {
                    if ( !BUILDIN_MODULE[ id ] ) {
                        return ( isAllCompleted = !!modIs( id, MODULE_DEFINED ) );
                    }
                });

                // 检测并调用callback
                if ( isAllCompleted ) {
                    isCallbackCalled = 1;

                    (typeof callback === 'function') && callback.apply(
                        global,
                        modGetModulesExports( ids, BUILDIN_MODULE )
                    );
                }
            }
        }
    }

    /**
     * 正在加载的模块列表
     *
     * @inner
     * @type {Object}
     */
    var loadingModules = {};

    /**
     * 加载模块
     *
     * @inner
     * @param {string} moduleId 模块标识
     */
    function loadModule( moduleId ) {
        if ( loadingModules[ moduleId ] || modModules[ moduleId ] ) {
            return;
        }

        loadingModules[ moduleId ] = 1;

        // 创建script标签
        //
        // 这里不挂接onerror的错误处理
        // 因为高级浏览器在devtool的console面板会报错
        // 再throw一个Error多此一举了
        var script = document.createElement( 'script' );
        script.setAttribute( 'data-require-id', moduleId );
        script.src = toUrl( moduleId + '.js' ) ;
        script.async = true;
        if ( script.readyState ) {
            script.onreadystatechange = loadedListener;
        }
        else {
            script.onload = loadedListener;
        }
        appendScript( script );

        /**
         * script标签加载完成的事件处理函数
         *
         * @inner
         */
        function loadedListener() {
            var readyState = script.readyState;
            if (
                typeof readyState === 'undefined'
                || /^(loaded|complete)$/.test( readyState )
            ) {
                script.onload = script.onreadystatechange = null;
                script = null;

                completePreDefine( moduleId );
            }
        }
    }

    /**
     * 加载资源
     *
     * @inner
     * @param {string} pluginAndResource 插件与资源标识
     * @param {string} baseId 当前环境的模块标识
     */
    function loadResource( pluginAndResource, baseId ) {
        if ( modModules[ pluginAndResource ] ) {
            return;
        }

        var idInfo = parseId( pluginAndResource );
        var resource = {
            id: pluginAndResource,
            state: MODULE_ANALYZED
        };
        modModules[ pluginAndResource ] = resource;

        /**
         * plugin加载完成的回调函数
         *
         * @inner
         * @param {*} value resource的值
         */
        function pluginOnload( value ) {
            resource.exports = value || true;
            modDefined( pluginAndResource );
        }

        /**
         * 该方法允许plugin使用加载的资源声明模块
         *
         * @param {string} name 模块id
         * @param {string} body 模块声明字符串
         */
        pluginOnload.fromText = function ( id, text ) {
            autoDefineModules[ id ] = 1;
            new Function( text )();
            completePreDefine( id );
        };

        /**
         * 加载资源
         *
         * @inner
         * @param {Object} plugin 用于加载资源的插件模块
         */
        function load( plugin ) {
            var pluginRequire = baseId
                ? modModules[ baseId ].require
                : actualGlobalRequire;

            plugin.load(
                idInfo.resource,
                pluginRequire,
                pluginOnload,
                moduleConfigGetter.call( { id: pluginAndResource } )
            );
        }

        load( modGetModuleExports( idInfo.module ) );
    }

    /**
     * require配置
     *
     * @inner
     * @type {Object}
     */
    var requireConf = {
        baseUrl     : './',
        paths       : {},
        config      : {},
        map         : {},
        packages    : [],
        // #begin-ignore
        waitSeconds : 0,
        // #end-ignore
        noRequests  : {},
        urlArgs     : {}
    };

    /**
     * 配置require
     *
     * @param {Object} conf 配置对象
     */
    require.config = function ( conf ) {
        function mergeArrayItem( item ) {
            oldValue.push( item );
        }

        for ( var key in requireConf ) {
            var newValue = conf[ key ];
            var oldValue = requireConf[ key ];

            if ( newValue ) {
                if ( key === 'urlArgs' && typeof newValue === 'string' ) {
                    defaultUrlArgs = newValue;
                }
                else {
                    // 简单的多处配置还是需要支持，所以配置实现为支持二级mix
                    if ( typeof oldValue === 'object' ) {
                        if ( oldValue instanceof Array ) {
                            each( newValue, mergeArrayItem );
                        }
                        else {
                            for ( var key in newValue ) {
                                oldValue[ key ] = newValue[ key ];
                            }
                        }
                    }
                    else {
                        requireConf[ key ] = newValue;
                    }
                }
            }
        }

        createConfIndex();
    };

    // 初始化时需要创建配置索引
    createConfIndex();

    /**
     * paths内部索引
     *
     * @inner
     * @type {Array}
     */
    var pathsIndex;

    /**
     * packages内部索引
     *
     * @inner
     * @type {Array}
     */
    var packagesIndex;

    /**
     * mapping内部索引
     *
     * @inner
     * @type {Array}
     */
    var mappingIdIndex;

    /**
     * 默认的urlArgs
     *
     * @inner
     * @type {string}
     */
    var defaultUrlArgs;

    /**
     * urlArgs内部索引
     *
     * @inner
     * @type {Array}
     */
    var urlArgsIndex;

    /**
     * noRequests内部索引
     *
     * @inner
     * @type {Array}
     */
    var noRequestsIndex;

    /**
     * 将key为module id prefix的Object，生成数组形式的索引，并按照长度和字面排序
     *
     * @inner
     * @param {Object} value 源值
     * @param {boolean} allowAsterisk 是否允许*号表示匹配所有
     * @return {Array}
     */
    function createKVSortedIndex( value, allowAsterisk ) {
        var index = kv2List( value, 1, allowAsterisk );
        index.sort( descSorterByKOrName );
        return index;
    }

    /**
     * 创建配置信息内部索引
     *
     * @inner
     */
    function createConfIndex() {
        requireConf.baseUrl = requireConf.baseUrl.replace( /\/$/, '' ) + '/';

        // create paths index
        pathsIndex = createKVSortedIndex( requireConf.paths );

        // create mappingId index
        mappingIdIndex = createKVSortedIndex( requireConf.map, 1 );
        each(
            mappingIdIndex,
            function ( item ) {
                item.v = createKVSortedIndex( item.v );
            }
        );

        // create packages index
        packagesIndex = [];
        each(
            requireConf.packages,
            function ( packageConf ) {
                var pkg = packageConf;
                if ( typeof packageConf === 'string' ) {
                    pkg = {
                        name: packageConf.split('/')[ 0 ],
                        location: packageConf,
                        main: 'main'
                    };
                }

                pkg.location = pkg.location || pkg.name;
                pkg.main = (pkg.main || 'main').replace(/\.js$/i, '');
                pkg.reg = createPrefixRegexp( pkg.name );
                packagesIndex.push( pkg );
            }
        );
        packagesIndex.sort( descSorterByKOrName );

        // create urlArgs index
        urlArgsIndex = createKVSortedIndex( requireConf.urlArgs );

        // create noRequests index
        noRequestsIndex = createKVSortedIndex( requireConf.noRequests );
        each( noRequestsIndex, function ( item ) {
            var value = item.v;
            var mapIndex = {};
            item.v = mapIndex;

            if ( !( value instanceof Array ) ) {
                value = [ value ];
            }

            each( value, function ( meetId ) {
                mapIndex[ meetId ] = 1;
            } );
        } );
    }

    /**
     * 对配置信息的索引进行检索
     *
     * @inner
     * @param {string} value 要检索的值
     * @param {Array} index 索引对象
     * @param {Function} hitBehavior 索引命中的行为函数
     */
    function indexRetrieve( value, index, hitBehavior ) {
        each( index, function ( item ) {
            if ( item.reg.test( value ) ) {
                hitBehavior( item.v, item.k, item );
                return false;
            }
        } );
    }

    /**
     * 将`模块标识+'.extension'`形式的字符串转换成相对的url
     *
     * @inner
     * @param {string} source 源字符串
     * @return {string}
     */
    function toUrl( source ) {
        // 分离 模块标识 和 .extension
        var extReg = /(\.[a-z0-9]+)$/i;
        var queryReg = /(\?[^#]*)$/;
        var extname = '';
        var id = source;
        var query = '';

        if ( queryReg.test( source ) ) {
            query = RegExp.$1;
            source = source.replace( queryReg, '' );
        }

        if ( extReg.test( source ) ) {
            extname = RegExp.$1;
            id = source.replace( extReg, '' );
        }

        var url = id;

        // paths处理和匹配
        var isPathMap;
        indexRetrieve( id, pathsIndex, function ( value, key ) {
            url = url.replace( key, value );
            isPathMap = 1;
        } );

        // packages处理和匹配
        if ( !isPathMap ) {
            indexRetrieve(
                id,
                packagesIndex,
                function ( value, key, item ) {
                    url = url.replace( item.name, item.location );
                }
            );
        }

        // 相对路径时，附加baseUrl
        if ( !/^([a-z]{2,10}:\/)?\//i.test( url ) ) {
            url = requireConf.baseUrl + url;
        }

        // 附加 .extension 和 query
        url += extname + query;

        // urlArgs处理和匹配
        var isUrlArgsAppended;
        indexRetrieve( id, urlArgsIndex, function ( value ) {
            appendUrlArgs( value );
        } );
        defaultUrlArgs && appendUrlArgs( defaultUrlArgs );

        /**
         * 为url附加urlArgs
         *
         * @inner
         * @param {string} args urlArgs串
         */
        function appendUrlArgs( args ) {
            if ( !isUrlArgsAppended ) {
                url += ( url.indexOf( '?' ) > 0 ? '&' : '?' ) + args;
                isUrlArgsAppended = 1;
            }
        }

        return url;
    }

    /**
     * 创建local require函数
     *
     * @inner
     * @param {number} baseId 当前module id
     * @return {Function}
     */
    function createLocalRequire( baseId ) {
        var requiredCache = {};
        function req( requireId, callback ) {
            if ( typeof requireId === 'string' ) {
                if ( !requiredCache[ requireId ] ) {
                    requiredCache[ requireId ] =
                        nativeRequire( normalize( requireId, baseId ) );
                }

                return requiredCache[ requireId ];
            }
            else if ( requireId instanceof Array ) {
                // 分析是否有resource，取出pluginModule先
                var pluginModules = [];
                var pureModules = [];
                var normalizedIds = [];

                each(
                    requireId,
                    function ( id, i ) {
                        var idInfo = parseId( id );
                        var absId = normalize( idInfo.module, baseId );
                        pureModules.push( absId );
                        autoDefineModules[ absId ] = 1;
                        if ( idInfo.resource ) {
                            pluginModules.push( absId );
                            normalizedIds[ i ] = null;
                        }
                        else {
                            normalizedIds[ i ] = absId;
                        }
                    }
                );

                var noRequestModules = {};
                each(
                    pureModules,
                    function ( id ) {
                        var meet;
                        indexRetrieve(
                            id,
                            noRequestsIndex,
                            function ( value ) {
                                meet = value;
                            }
                        );

                        if ( meet ) {
                            if ( meet[ '*' ] ) {
                                noRequestModules[ id ] = 1;
                            }
                            else {
                                each( pureModules, function ( meetId ) {
                                    if ( meet[ meetId ] ) {
                                        noRequestModules[ id ] = 1;
                                        return false;
                                    }
                                } );
                            }
                        }
                    }
                );

                // 加载模块
                nativeRequire(
                    pureModules,
                    function () {
                        each( normalizedIds, function ( id, i ) {
                            if ( id == null ) {
                                normalizedIds[ i ] = normalize( requireId[ i ], baseId );
                            }
                        } );

                        nativeRequire( normalizedIds, callback, baseId );
                    },
                    baseId,
                    noRequestModules
                );
            }
        }

        /**
         * 将[module ID] + '.extension'格式的字符串转换成url
         *
         * @inner
         * @param {string} source 符合描述格式的源字符串
         * @return {string}
         */
        req.toUrl = function ( id ) {
            return toUrl( normalize( id, baseId ) );
        };

        return req;
    }

    /**
     * id normalize化
     *
     * @inner
     * @param {string} id 需要normalize的模块标识
     * @param {string} baseId 当前环境的模块标识
     * @return {string}
     */
    function normalize( id, baseId ) {
        if ( !id ) {
            return '';
        }

        baseId = baseId || '';
        var idInfo = parseId( id );
        if ( !idInfo ) {
            return id;
        }

        var resourceId = idInfo.resource;
        var moduleId = relative2absolute( idInfo.module, baseId );

        each(
            packagesIndex,
            function ( packageConf ) {
                var name = packageConf.name;
                if ( name === moduleId ) {
                    moduleId = name + '/' + packageConf.main;
                    return false;
                }
            }
        );

        // 根据config中的map配置进行module id mapping
        indexRetrieve(
            baseId,
            mappingIdIndex,
            function ( value ) {

                indexRetrieve(
                    moduleId,
                    value,
                    function ( mdValue, mdKey ) {
                        moduleId = moduleId.replace( mdKey, mdValue );
                    }
                );

            }
        );

        if ( resourceId ) {
            var module = modGetModuleExports( moduleId );
            resourceId = module.normalize
                ? module.normalize(
                    resourceId,
                    function ( resId ) {
                        return normalize( resId, baseId );
                    }
                  )
                : normalize( resourceId, baseId );

            moduleId += '!' + resourceId;
        }

        return moduleId;
    }

    /**
     * 相对id转换成绝对id
     *
     * @inner
     * @param {string} id 要转换的id
     * @param {string} baseId 当前所在环境id
     * @return {string}
     */
    function relative2absolute( id, baseId ) {
        if ( id.indexOf( '.' ) === 0 ) {
            var basePath = baseId.split( '/' );
            var namePath = id.split( '/' );
            var baseLen = basePath.length - 1;
            var nameLen = namePath.length;
            var cutBaseTerms = 0;
            var cutNameTerms = 0;

            pathLoop: for ( var i = 0; i < nameLen; i++ ) {
                var term = namePath[ i ];
                switch ( term ) {
                    case '..':
                        if ( cutBaseTerms < baseLen ) {
                            cutBaseTerms++;
                            cutNameTerms++;
                        }
                        else {
                            break pathLoop;
                        }
                        break;
                    case '.':
                        cutNameTerms++;
                        break;
                    default:
                        break pathLoop;
                }
            }

            basePath.length = baseLen - cutBaseTerms;
            namePath = namePath.slice( cutNameTerms );

            return basePath.concat( namePath ).join( '/' );
        }

        return id;
    }

    /**
     * 解析id，返回带有module和resource属性的Object
     *
     * @inner
     * @param {string} id 标识
     * @return {Object}
     */
    function parseId( id ) {
        var segs = id.split( '!' );

        if ( /^[-_a-z0-9\.]+(\/[-_a-z0-9\.]+)*$/i.test( segs[ 0 ] ) ) {
            return {
                module   : segs[ 0 ],
                resource : segs[ 1 ]
            };
        }

        return null;
    }

    /**
     * 将对象数据转换成数组，数组每项是带有k和v的Object
     *
     * @inner
     * @param {Object} source 对象数据
     * @return {Array.<Object>}
     */
    function kv2List( source, keyMatchable, allowAsterisk ) {
        var list = [];
        for ( var key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                var item = {
                    k: key,
                    v: source[ key ]
                };
                list.push( item );

                if ( keyMatchable ) {
                    item.reg = key === '*' && allowAsterisk
                        ? /^/
                        : createPrefixRegexp( key );
                }
            }
        }

        return list;
    }

    // 感谢requirejs，通过currentlyAddingScript兼容老旧ie
    //
    // For some cache cases in IE 6-8, the script executes before the end
    // of the appendChild execution, so to tie an anonymous define
    // call to the module name (which is stored on the node), hold on
    // to a reference to this node, but clear after the DOM insertion.
    var currentlyAddingScript;
    var interactiveScript;

    /**
     * 获取当前script标签
     * 用于ie下define未指定module id时获取id
     *
     * @inner
     * @return {HTMLDocument}
     */
    function getCurrentScript() {
        if ( currentlyAddingScript ) {
            return currentlyAddingScript;
        }
        else if (
            interactiveScript
            && interactiveScript.readyState === 'interactive'
        ) {
            return interactiveScript;
        }
        else {
            var scripts = document.getElementsByTagName( 'script' );
            var scriptLen = scripts.length;
            while ( scriptLen-- ) {
                var script = scripts[ scriptLen ];
                if ( script.readyState === 'interactive' ) {
                    interactiveScript = script;
                    return script;
                }
            }
        }
    }

    var headElement = document.getElementsByTagName( 'head' )[ 0 ];
    var baseElement = document.getElementsByTagName( 'base' )[ 0 ];
    if ( baseElement ) {
        headElement = baseElement.parentNode;
    }

    /**
     * 向页面中插入script标签
     *
     * @inner
     * @param {HTMLScriptElement} script script标签
     */
    function appendScript( script ) {
        currentlyAddingScript = script;

        // If BASE tag is in play, using appendChild is a problem for IE6.
        // See: http://dev.jquery.com/ticket/2709
        baseElement
            ? headElement.insertBefore( script, baseElement )
            : headElement.appendChild( script );

        currentlyAddingScript = null;
    }

    /**
     * 创建id前缀匹配的正则对象
     *
     * @inner
     * @param {string} prefix id前缀
     * @return {RegExp}
     */
    function createPrefixRegexp( prefix ) {
        return new RegExp( '^' + prefix + '(/|$)' );
    }

    /**
     * 循环遍历数组集合
     *
     * @inner
     * @param {Array} source 数组源
     * @param {function(Array,Number):boolean} iterator 遍历函数
     */
    function each( source, iterator ) {
        if ( source instanceof Array ) {
            for ( var i = 0, len = source.length; i < len; i++ ) {
                if ( iterator( source[ i ], i ) === false ) {
                    break;
                }
            }
        }
    }

    /**
     * 根据元素的k或name项进行数组字符数逆序的排序函数
     *
     * @inner
     */
    function descSorterByKOrName( a, b ) {
        var aValue = a.k || a.name;
        var bValue = b.k || b.name;

        if ( bValue === '*' ) {
            return -1;
        }

        if ( aValue === '*' ) {
            return 1;
        }

        return bValue.length - aValue.length;
    }

    // 暴露全局对象
    global.define = define;
    global.require = require;
})( this );