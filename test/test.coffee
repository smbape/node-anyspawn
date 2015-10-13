anyspawn = require '../'
sysPath = require 'path'
prompt = anyspawn.defaults.prompt
anyspawn.defaults.prompt = false

assertFilesExist = (actual, expected)->
    for efile in expected
        if efile instanceof RegExp
            missing = true
            for afile in actual
                if efile.test afile
                    missing = false
                    break
            if missing
                assert.ifError "Missing file #{efile} in #{actual}"
        else
            if -1 is actual.indexOf efile
                assert.ifError "Missing file #{efile}"

    return

describe 'any spawn', ->
    FILES =
        'ls': ['_mocha', '_mocha.cmd', 'mocha', 'mocha.cmd', 'username', 'username.cmd']
        'ls -a': ['.', '..', '_mocha', '_mocha.cmd', 'mocha', 'mocha.cmd', 'username', 'username.cmd']
        'ls -al': [/\s\.$/, /\s\.\.$/, /\s_mocha$/, /\s_mocha\.cmd$/, /\smocha$/, /\smocha\.cmd$/, /\susername$/, /\susername\.cmd$/]
        'ls -alh': [/\s\.$/, /\s\.\.$/, /\s_mocha$/, /\s_mocha\.cmd$/, /\smocha$/, /\smocha\.cmd$/, /\susername$/, /\susername\.cmd$/]

    it 'should spawn command line', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = ''
        child = anyspawn.spawn "ls -a #{anyspawn.quoteArg(dir)}", (err)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        child.stdout.on 'data', (chunk)->
            data += chunk.toString()
            return
        return

    it 'should spawn command line with options', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = ''
        child = anyspawn.spawn 'ls -a', {cwd: dir}, (err)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        child.stdout.on 'data', (chunk)->
            data += chunk.toString()
            return
        return

    it 'should spawn command array', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = ''
        child = anyspawn.spawn 'ls', ['-a', dir], (err)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        child.stdout.on 'data', (chunk)->
            data += chunk.toString()
            return
        return

    it 'should spawn command array with options', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = ''
        child = anyspawn.spawn 'ls', ['-a'], {cwd: dir}, (err)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        child.stdout.on 'data', (chunk)->
            data += chunk.toString()
            return
        return

    it 'should exec command line', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        anyspawn.exec "ls -a #{anyspawn.quoteArg(dir)}", (err, data)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        return

    it 'should exec command line with options', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        anyspawn.exec 'ls -a', {cwd: dir}, (err, data)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        return

    it 'should exec command array', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        anyspawn.exec 'ls', ['-a', dir], (err, data)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        return

    it 'should exec command array with options', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        anyspawn.exec 'ls', ['-a'], {cwd: dir}, (err, data)->
            assert.ifError err
            data = data.split /\s+/
            data.pop()
            assertFilesExist data, FILES['ls -a']
            done()
            return
        return

    it 'should series spawn commands line', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = {}
        commands = ['ls', 'ls -a', 'ls -al', 'ls -alh']
        anyspawn.spawnSeries commands, {cwd: dir}, (cmd, child, options, index)->
            data[cmd] = ''
            child.stdout.on 'data', (chunk)->
                data[cmd] += chunk.toString()
                return
            return
        , (err)->
            assert.ifError err
            for cmd in commands
                if cmd in ['ls', 'ls -a']
                    actual = data[cmd].split(/\s+/)
                    actual.pop()
                else
                    actual = data[cmd].split(/\n+/)
                assertFilesExist actual, FILES[cmd]
            done()
            return
        return

    it 'should series spawn commands array', (done) ->
        dir = sysPath.resolve __dirname + '/../node_modules/.bin'
        data = {}
        commands = [
            [
                'ls'
                (code)->
                    cmd = 'ls'
                    actual = data[cmd].split(/\s+/)
                    actual.pop()
                    assertFilesExist actual, FILES[cmd]
                    return
            ]
            [
                'ls -a'
                (code)->
                    cmd = 'ls -a'
                    actual = data[cmd].split(/\s+/)
                    actual.pop()
                    assertFilesExist actual, FILES[cmd]
                    return
            ]
            [
                'ls -al'
                (code)->
                    cmd = 'ls -al'
                    actual = data[cmd].split(/\n+/)
                    assertFilesExist actual, FILES[cmd]
                    return
            ]
            [
                'ls -alh'
                (code)->
                    cmd = 'ls -alh'
                    actual = data[cmd].split(/\n+/)
                    assertFilesExist actual, FILES[cmd]
                    return
            ]
        ]

        anyspawn.spawnSeries commands, {cwd: dir}, (cmd, child, options, index)->
            data[cmd] = ''
            child.stdout.on 'data', (chunk)->
                data[cmd] += chunk.toString()
                return
            return
        , (err)->
            assert.ifError err
            commands = commands.map (element)-> element[0]
            for cmd in commands
                if cmd in ['ls', 'ls -a']
                    actual = data[cmd].split(/\s+/)
                    actual.pop()
                else
                    actual = data[cmd].split(/\n+/)
                assertFilesExist actual, FILES[cmd]
            done()
            return
        return

    it 'should accept 1 argument', ->
        anyspawn.spawn 'ls -l'
        anyspawn.spawn ['ls -l']
        return

    it 'should accept 2 arguments', (done)->
        count = 2
        next = (err)->
            assert.ifError err
            done() if --count is 0
            return
        anyspawn.spawn 'ls -l', {}
        anyspawn.spawn ['ls -l'], {}
        anyspawn.spawn 'ls -l', next
        anyspawn.spawn ['ls -l'], next
        return

    it 'should accept 3 arguments', (done)->
        count = 2
        next = (err)->
            assert.ifError err
            done() if --count is 0
            return
        anyspawn.spawn 'ls -l', {}, next
        anyspawn.spawn ['ls -l'], {}, next
        return

    it 'should spawnSeries accept 1 argument', ->
        anyspawn.spawnSeries ['ls -l']
        return

    it 'should spawnSeries accept 2 arguments', (done)->
        anyspawn.spawnSeries ['ls -l'], {}
        anyspawn.spawnSeries ['ls -l'], done
        return

    it 'should spawnSeries accept 3 arguments', (done)->
        count = 2
        next = (err)->
            assert.ifError err
            done() if --count is 0
            return
        anyspawn.spawnSeries ['ls -l'], {}, next
        anyspawn.spawnSeries ['ls -l'], (->), next
        return

    return
