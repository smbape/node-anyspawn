Look at test for more examples

```javascript
var anyspawn = require('anyspawn');
var dir = '/path/to/a/directory';

var child = anyspawn.spawn('ls -a ' + anyspawn.quoteArg(dir));
child.stdout.on('data', function(chunk) {
    console.log(chunk.toString())
});

var child = anyspawn.spawn('ls -a', {cwd: dir});
child.stdout.on('data', function(chunk) {
    console.log(chunk.toString())
});

anyspawn.exec('ls -a ' + anyspawn.quoteArg(dir), function(err, data) {
    console.log(err, data)
});

anyspawn.exec('ls -a', {cwd: dir}, function(err, data) {
    console.log(err, data)
});

anyspawn.spawnSeries(['ls', 'ls -a', 'ls -al', 'ls -alh'], {cwd: dir, stdio: 'inherit'}, function(err) {
    console.log(err)
});

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
```