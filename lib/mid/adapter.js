/*!
 * yo
 * Copyright(c) 2015 Hbomb
 * MIT Licensed
 */

'use strict';

/**
 * 模块依赖
 * @private
 */

var debug = require('debug')('mid-adapters');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
/**
 * 对于获取接口数据的适配改造
 * @param  {string} dir 适配逻辑目录
 * @return {Function} 返回处理中间件
 */
module.exports = function(dir) {
    var adapters = {},
        methods = ['get', 'post', 'head', 'delete', 'put'],
        files = [];

    //读取适配逻辑目录，载入适配逻辑
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        debug('do not config adapter dir!');
    }

    _.forEach(files, function(val) {
        var m = require((dir + path.sep + val).replace('.js', ''));
        _.forEach(methods, function(v) {
            if (m[v]) {
                adapters[v + val.replace('.js', '')] = m[v];
            }
        });
    });
    //返回中间件
    return function(req, res, next) {
        debug("enter adapters");
        req.app.yolog.log('silly','adapter get data: ',res.proxyData);
        debug(res.proxyData);
        if (res.proxyData && typeof res.proxyData === 'object') {
            var m = req.route.path.replace('/', '');
            if (req.input.config.adapter) {
                m = req.input.config.adapter;
            }

            if (m === '') {
                m = 'index';
            }
            m = m.replace(/\//g, '_');
            m = m.replace(/\:/g, '-');

            var key = req.method.toLowerCase() + m;
            debug("match key:"+key);
            req.app.yolog.log('silly','adapter match key: %s',key);
            if (adapters[key]) {
                res.proxyData = adapters[key](res.proxyData, req, res);
            }
            req.app.yolog.log('silly','adapter after proc data:',res.proxyData);
        }
        //如果在响应上下文里面设置，不再next
        if(!res.adaptersStop) {
            next();
        }  
    };
};