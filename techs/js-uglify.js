var fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    uglifyJs = require("uglify-js");

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'js-uglify';
    },

    configure: function() {
        this._source = this.node.unmaskTargetName(this.getRequiredOption('sourceTarget'));
        this._target = this.node.unmaskTargetName(this.getRequiredOption('destTarget'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var target = this._target,
            targetPath = this.node.resolvePath(target),
            source = this._source,
            sourcePath = this.node.resolvePath(source),
            _this = this,
            cache = this.node.getNodeCache(target);
        return this.node.requireSources([source]).then(function() {
            if (cache.needRebuildFile('source-file', sourcePath)
                    || cache.needRebuildFile('target-file', targetPath)) {
                var uglifyJsProcessor = UglifyJsProcessor.fork();
                return Vow.when(uglifyJsProcessor.process(sourcePath, targetPath)).then(function() {
                    cache.cacheFileInfo('source-file', sourcePath);
                    cache.cacheFileInfo('target-file', targetPath);
                    _this.node.resolveTarget(target);
                    uglifyJsProcessor.dispose();
                });
            } else {
                _this.node.getLogger().isValid(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});

var UglifyJsProcessor = require('sibling').declare({
    process: function(sourcePath, targetPath) {
        return vowFs.read(sourcePath, 'utf8').then(function(data) {
            return vowFs.write(targetPath, uglifyJs(data), 'utf8');
        });
    }
});