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

var _ = require('lodash');
var fs = require('fs');
var md5 = require('./util').md5;
var p = require('path');


//接口配置字典
exports.interfacesConfig = {};

/**
 * 解析接口信息，配置初始化接口路由
 * @param  {[type]} app web APP
 * @param  {Array} interfaces 接口信息
 * @return {void}
 */
var parseConfig = function(app) {
    _.forEach(exports.interfacesConfig, function(val) {
        var domain = val.domain;
        val.route = val.route || val.url; //如果route没有配置则读取url作为路由
        app.yolog.log('info','[%s] %s%s',val.method,domain,val.route);
        app[val.method.toLowerCase()](val.route, function(req, res, next) {
            req.proxyParams = {
                params: _.merge(req.params, req.query),
                body: req.body
            };
            app.yolog.log('info','proxyRoute: [%s]%s proxyParams %j',req.method,req.path,req.proxyParams,{});
            next();
        });
    });
};

/**
 * 加载配置的接口路径
 * @param  {String}   path     接口路径
 * @param {Object} defConfig 接口默认配置
 * @param  {Function} callback 完成回调
 */
var loadConfig = function(path,defConfig, callback) {
    fs.readdir(path, function(err, files) {
        if (err) {
            callback(err);
            return;
        }
        _.forEach(files, function(val) {
            // 判断文件类型是否为js
            var m = /\.js$/.test(path + p.sep + val) ? require((path + p.sep + val).replace('.js', '')) : null;

            // 文件不是js， 则退出
            if (m === null) return;

            if (m.domain && m.res && _.isArray(m.res) && m.res.length > 0) {
                _.forEach(m.res, function(v) {
                    v.domain = m.domain;
                    var key = exports.genKey(v.method, v.route);
                    var configData = _.merge({},defConfig,v);//添加接口默认配置
                    exports.interfacesConfig[key] = configData;
                });
            } else {
                callback(new Error('空的接口依赖'));
            }
        });
        callback();

    });
};

/**
 * 生成key
 * @param  {string} method 方法
 * @param  {string} route  路由
 * @return {string}        返回MD5的key
 */
exports.genKey = function(method, route) {
    return md5(method + route);
};

/**
 * 初始化
 * @param  {Express}   app      web app
 * @param  {String}   path     接口路径
 * @param {Object} defConfig 接口默认配置
 * @param  {Function} callback 初始化完成事件触发
 */
exports.init = function(app, path,defConfig, callback) {
    loadConfig(path, defConfig,function(err) {
        if (err) {
            callback(err);
            return;
        }
        parseConfig(app);

        callback();
    });
};
