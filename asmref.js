#!/usr/bin/env node

var proc = require('child_process');
var readline = require('readline');
var path = require('path');
var fs = require('fs');

var sqlite = require('sqlite3');
var parseArgs = require('minimist');
var which = require('which');
var temp = require('temp');


var pagers = ['most', 'less', 'more'];


var _opts = {
    arch: 'x86_64',
    opcode: ''
};

function printHelp() 
{
    var cmd = process.argv[1];
    if (cmd.indexOf('/') !== -1) {
        var paths = cmd.split('/');
        cmd = paths[paths.length-1];
    }
    console.log('Usage: ' + cmd + ' [-a arch] mnemonic');
    console.log('  -a arch: Target platform (x86_64, x86, arm, mips, xtensa, any)\n');
    console.log('Default arch is x86_64\n');
}


function getShortDescription(desc)
{
    var lines = desc.split('\n');
    var newdesc =  lines[0];

    if (newdesc === '')
        newdesc = lines[1];

    // Remove trailing :
    if (newdesc.charAt(newdesc.length-1) === ':')
        newdesc = newdesc.substr(0, newdesc.length-1);

    return newdesc.trim().substr(0, 56);
}

function padTo(word, len)
{
    var pad = len - word.length + 1;
    return word + Array(pad).join(' ');
}


function chooseOperand(rows)
{
    console.log('Multiple matches found');
    for (var x = 0; x < rows.length; x++) {
        var desc = getShortDescription(rows[x].description);
        var plat = rows[x].platform;
        var mnem = rows[x].mnem;
        console.log('['+x+'] | ' + mnem  + '\t| ' + padTo(plat, 6) + ' | ' + desc);
    }
    process.stdout.write("Enter number: ");

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', function (cmd) {
        var offset = parseInt(cmd);
        rl.close();

        if ((offset > rows.length-1) || (offset < 0) || isNaN(offset)) {
            console.log('Wrong number.');
            process.exit(1);
        }

        showResults(rows[offset].description);
    });

}


function showResults(text) {
    var pager = process.env.PAGER;

    /* Check pagers */
    if (pager === undefined) {
        for (var x = 0; x < pagers.length; x++) {
            try { 
                pager = which.sync(pagers[x]);
            } catch (e) {}

            if (pager !== undefined) break;
        }
    }

    /* If no pager print to stdout */
    if (pager === undefined) {
        console.error('ERROR: Pager not found.');
        console.log(text);
        return 0;
    }

    /* Otherwise print to tmp file and spawn pager */
    temp.track();
    temp.open('asmref', function(err, info) {
        if (err) {
            console.error('ERROR: could not create temporary file');
            return -1;
        }

        fs.write(info.fd, text);
        fs.close(info.fd, function(err) {
            proc.execSync(pager + ' ' + info.path, { stdio: 'inherit' });
        });
    });
}


/* Parse arguments */
var args = parseArgs(process.argv.slice(2));
if (args.a) {
    switch(args.a.toLowerCase()) {
        case 'x86':
            _opts.arch = 'x86';
            break;
        case 'x86_64':
            _opts.arch = 'x86_64';
            break;
        case 'arm':
            _opts.arch = 'ARM';
            break;
        case 'mips':
            _opts.arch = 'MIPS32';
            break;
        case 'xtensa':
            _opts.arch = 'xtensa';
            break;
        case 'any':
            _opts.arch = 'any';
            break;
        default:
            console.log("Unknown arch");
            process.exit(1);
            break;
    }
}

if (args.h || (args["_"].length !== 1)) {
    printHelp();
    process.exit(1);
}


// Main code
var dbfile = path.join(__dirname, 'resources', 'reference.sqlite');
var db = new sqlite.Database(dbfile, sqlite.OPEN_READONLY);

// I know this is a sqli, but who cares, its your local database
_opts.opcode = args['_'][0].replace(/\*/g, '%');
var query = "SELECT * FROM instructions WHERE mnem LIKE '" + _opts.opcode +"'";
if (_opts.arch !== 'any')
    query += " AND platform='" + _opts.arch + "'";

db.all(query, function(err, res) {
    if (err) {
        console.log('Error querying database');
        process.exit(1);
    }

    if (res.length < 1) {
        console.log('Opcode not found');
        process.exit(1);
    } else if (res.length > 1) {
        chooseOperand(res);
    } else if (res.length === 1) {
        showResults(res[0].description);
    }
});


