anyspawn
=======

Command line scripting in node made easier

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

anyspawn.spawnSeries([
	'ls',
	'ls -a',
	function(next) {
		console.log('another task');
		next();
	},
	'ls -al',
	'ls -alh'
], {cwd: dir, stdio: 'inherit'}, function(err) {
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

License
-------
The MIT License (MIT)

Copyright (c) 2014-2015 Stéphane MBAPE (http://smbape.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
