// jshint node: true
'use strict';

var child_process = require('child_process'),
    spawnCommand = require('spawn-command'),
    chalk = require('chalk'),
    os = require('os'),
    hostname = os.hostname(),
    username = require('username').sync(),
    slice = Array.prototype.slice,
    defaults = {
        prompt: prompt
    };

exports.spawn = spawn;
exports.exec = exec;
exports.spawnSeries = spawnSeries;
exports.spawnParallel = spawnParallel;
exports.quoteArg = quoteArg;
exports.defaults = defaults;

/**
 * Add quote if needed
 * @param  {String} arg argument to quote
 * @return {String}     quoted argument
 */
function quoteArg(arg) {
    return /\s/.test(arg) ? '"' + arg.replace(/"/g, '\\') + '"' : arg;
}

/**
 * Spawn a command
 * Usage
 *     spawn(String cmd)
 *     spawn(String cmd, Array args)
 *     spawn(String cmd, Object options)
 *     spawn(String cmd, Function done)
 *     spawn(String cmd, Array args, Object options)
 *     spawn(String cmd, Array args, Function done)
 *     spawn(String cmd, Array args, Object options, Function done)
 * @param  {String}   cmd     command to execute
 * @param  {Array}    args    If specified, use child_process.spawn, else use spawn-command
 * @param  {Object}   options child process spawn options.
 * @param  {Function} done    called with arguments (code)
 * @return {ChildProcess}     child process
 */
function spawn() {
    var argv = _spawnArgs(arguments),
        cmd = argv[0],
        args = argv[1],
        options = argv[2],
        done = argv[3],
        child = _spawn(cmd, args, options, done);

    return child;
}

/**
 * Execute a command
 * Usage
 *     exec(String cmd)
 *     exec(String cmd, Array args)
 *     exec(String cmd, Object options)
 *     exec(String cmd, Function done)
 *     exec(String cmd, Array args, Object options)
 *     exec(String cmd, Array args, Function done)
 *     exec(String cmd, Array args, Object options, Function done)
 * @param  {String}   cmd     command to execute
 * @param  {Array}    args    If specified, use child_process.spawn, else use spawn-command
 * @param  {Object}   options child process spawn options.
 * @param  {Function} done    called with arguments (error, output, code)
 * @return {ChildProcess}     child process
 */
function exec() {
    var argv = _spawnArgs(arguments),
        cmd = argv[0],
        args = argv[1],
        options = argv[2],
        done = argv[3],
        out = [],
        err = [],
        count = 0,
        pipeout = emptyFn,
        pipeerr = emptyFn,
        child, stdout, stderr, stdio;

    stdio = options.stdio || 'pipe';
    options.stdio = ['pipe', 'pipe', 'pipe'];

    if (Array.isArray(stdio)) {
        options.stdio[0] = stdio[0];
    } else if ('string' === typeof stdio) {
        options.stdio[0] = stdio;
    }

    if (stdio === 'inherit' || stdio[1] === 'inherit' || stdio[1] === 1 || stdio[1] === process.stdout) {
        pipeout = function(chunk) {
            process.stdout.write(chunk);
        };
    }

    if (stdio === 'inherit' || stdio[2] === 'inherit' || stdio[2] === 2 || stdio[2] === process.stderr) {
        pipeerr = function(chunk) {
            process.stderr.write(chunk);
        };
    }

    child = _spawn(cmd, args, options);

    count++;
    child.on('close', end);

    function end(code, signal) {
        if (code) {
            out.code = code;
        }

        if (--count === 0) {
            var output = out.join('');
            var error = err.join('');

            if (code === 0 && error.length === 0) {
                done(null, output, out.code);
            } else {
                done(error, output, out.code);
            }
        }
    }

    count++;
    child.stdout.on('data', function(chunk) {
        out.push(chunk);
        pipeout(chunk);
    });
    child.stdout.on('end', end);

    count++;
    child.stderr.on('data', function(chunk) {
        err.push(chunk);
        pipeerr(chunk);
    });
    child.stderr.on('end', end);

    return child;
}

/**
 * Spawn commands in series
 * Usage
 *     spawnSeries(Array commands)
 *     spawnSeries(Array commands, Object options)
 *     spawnSeries(Array commands, Function done)
 *     spawnSeries(Array commands, Object options, Function done)
 *     spawnSeries(Array commands, Object options, Function callback, Function done)
 * @param  {Array}    commands commands to execute. If command is an array, it will be considered as arguments of spawn
 * @param  {Object}   options  child process spawn options.
 * @param  {Function} callback called with arguments (cmd, child, options, index)
 * @param  {Function} done     called with arguments (error)
 */
function spawnSeries(commands, options, callback, done) {
    var i = -1,
        _len = commands.length;

    switch (arguments.length) {
        case 1:
            options = {};
            callback = emptyFn;
            done = emptyFn;
            break;
        case 2:
            if (isFunction(options)) {
                done = options;
                options = {};
            } else {
                done = emptyFn;
            }
            callback = emptyFn;
            break;
        case 3:
            if (isFunction(callback)) {
                done = callback;
                callback = emptyFn;
            }
            break;
    }

    iterate(0);

    function iterate(err) {
        var child, cmd, argv, args, opts, next;
        if (!err && ++i < _len) {
            cmd = commands[i];
            if (Array.isArray(cmd)) {
                argv = _spawnArgs(cmd, options);
                cmd = argv[0];
                args = argv[1];
                opts = argv[2];
                next = argv[3];
                child = _spawn(cmd, args, opts, next);
            } else if (isFunction(cmd)) {
                cmd(iterate);
                callback(cmd, child, opts, i);
                return;
            } else {
                opts = getOptions(options);
                child = _spawn(cmd, null, opts, emptyFn);
            }
            child.once('exit', iterate);
            callback(cmd, child, opts, i);
        } else {
            done(err);
        }
    }
}

/**
 * Spawn commands in series
 * Usage
 *     spawnParallel(Array commands)
 *     spawnParallel(Array commands, Object options)
 *     spawnParallel(Array commands, Function done)
 *     spawnParallel(Array commands, Object options, Function done)
 *     spawnParallel(Array commands, Object options, Function callback, Function done)
 * @param  {Array}    commands commands to execute. If command is an array, it will be considered as arguments of spawn
 * @param  {Object}   options  child process spawn options.
 * @param  {Function} callback called with arguments (cmd, child, options, index)
 * @param  {Function} done     called with arguments (error)
 */
function spawnParallel(commands, options, callback, done) {
    var _len = commands.length,
        errors = [],
        hasError = false,
        count = 0;

    switch (arguments.length) {
        case 1:
            options = {};
            callback = emptyFn;
            done = emptyFn;
            break;
        case 2:
            if (isFunction(options)) {
                done = options;
                options = {};
            } else {
                done = emptyFn;
            }
            callback = emptyFn;
            break;
        case 3:
            if (isFunction(callback)) {
                done = callback;
                callback = emptyFn;
            }
            break;
    }

    for (var i = 0; i < _len; i++) {
        iterate(commands[i], checkAndCallDone);
    }

    function iterate(cmd, checkAndCallDone) {
        var child, argv, args, opts, next;

        if (Array.isArray(cmd)) {
            argv = _spawnArgs(cmd, options);
            cmd = argv[0];
            args = argv[1];
            opts = argv[2];
            next = argv[3];
            child = _spawn(cmd, args, opts, next);
        } else if (isFunction(cmd)) {
            callback(cmd, child, opts, i);
            cmd(checkAndCallDone);
            return;
        } else {
            opts = getOptions(options);
            child = _spawn(cmd, null, opts, emptyFn);
        }

        callback(cmd, child, opts, i);
        child.once('exit', checkAndCallDone);
    }

    function checkAndCallDone(err) {
        if (err) {
            hasError = true;
        }
        errors.push(err);

        if (++count === _len) {
            done(hasError ? errors : null);
        }
    }
}

function _spawn(cmd, args, options, done) {
    var child;
    if (Array.isArray(args)) {
        if (options.prompt) {
            options.prompt(cmd + ' ' + args.map(quoteArg).join(' '), options.cwd, username, hostname, options);
        }
        child = child_process.spawn(cmd, args, options);
    } else {
        if (options.prompt) {
            options.prompt(cmd, options.cwd, username, hostname, options);
        }
        child = spawnCommand(cmd, options);
    }

    if ('function' === typeof done) {
        child.once('close', done);
    }

    return child;
}

function _spawnArgs(argv, currentDefaults) {
    argv = slice.call(argv);
    var cmd = argv[0],
        args = argv[1],
        options = argv[2],
        done = argv[3];

    switch (argv.length) {
        case 1:
            // spawn cmd
            options = {};
            done = emptyFn;
            break;
        case 2:
            if (Array.isArray(argv[1])) {
                // spawn cmd, Array
                done = emptyFn;
            } else if ('function' === typeof argv[1]) {
                // spawn cmd, Function
                args = null;
                done = argv[1];
                options = {};
            } else if (argv[1] && 'object' === typeof argv[1]) {
                // spawn cmd, Object
                args = null;
                done = emptyFn;
                options = argv[1];
            } else {
                throw new Error('Invalid argv');
            }
            break;
        case 3:
            if (Array.isArray(argv[1])) {
                args = argv[1];
                if ('function' === typeof argv[2]) {
                    // spawn cmd, Array, Function
                    options = {};
                    done = argv[2];
                } else {
                    // spawn cmd, Array, Object
                    if (argv[2] && 'object' === typeof argv[2]) {
                        options = argv[2];
                    } else {
                        options = {};
                    }
                    done = emptyFn;
                }
            } else if (argv[1] && 'object' === typeof argv[1] && 'function' === typeof argv[2]) {
                // spawn cmd, Object, Function
                args = null;
                options = argv[1];
                done = argv[2];
            } else {
                throw new Error('Invalid arguments');
            }
            break;
        default:
            if (args && !Array.isArray(args)) {
                throw new Error('Invalid argument args');
            }

            if (options && 'object' !== typeof options) {
                throw new Error('Invalid argument options');
            }

            if (done && 'function' !== typeof done) {
                throw new Error('Invalid argument done');
            }

            if ('object' !== typeof options) {
                options = {};
            }

            if ('function' !== typeof done) {
                done = emptyFn;
            }
    }

    options = getOptions(options, currentDefaults);

    return [cmd, args, options, done];
}

function getOptions(options, currentDefaults) {
    var opts = extend({}, defaults, currentDefaults, options);

    if (opts.prompt && 'function' !== typeof opts.prompt) {
        opts.prompt = defaults.prompt;
    }

    return opts;
}

function prompt(cmd, cwd, username, hostname) {
    var text = chalk.green(username + '@' + hostname) + ' ' + chalk.yellow(cwd || process.cwd()) + '\n$ ' + cmd;
    console.log(text);
}

function emptyFn() {}

function clone(obj) {
    var dst = {},
        prop;
    for (prop in obj) {
        dst[prop] = obj[prop];
    }

    return dst;
}

// ==============
// From jQuery
// ==============
function extend() {
    var src, copyIsArray, copy, name, options, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
        deep = target;

        // skip the boolean and the target
        target = arguments[i] || {};
        i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !isFunction(target)) {
        target = {};
    }

    for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) != null) {
            // Extend the base object
            for (name in options) {
                src = target[name];
                copy = options[name];

                // Prevent never-ending loop
                if (target === copy) {
                    continue;
                }

                // Recurse if we're merging plain objects or arrays
                if (deep && copy && (isObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && Array.isArray(src) ? src : [];

                    } else {
                        clone = src && isObject(src) ? src : {};
                    }

                    // Never move original objects, clone them
                    target[name] = extend(deep, clone, copy);

                    // Don't bring in undefined values
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
}

// ==============
// From lodash
// ==============
var objToString = Object.prototype.toString;

function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value;
    return !!value && (type === 'object' || type === 'function');
}

function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in older versions of Chrome and Safari which return 'function' for regexes
    // and Safari 8 which returns 'object' for typed array constructors.
    return isObject(value) && objToString.call(value) === '[object Function]';
}