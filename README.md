# asmref
Check multiple archs assembly reference docs from command line


## Installation
```
$ sudo npm install asmref -g
```

## Usage
```
$ asmref
Usage: asmref [-a arch] mnemonic
  -a arch: Target platform (x86_64, x86, arm, mips, xtensa, any)

Default arch is x86_64
```

```
$ asmref -a any add
Multiple matches found
[0] | ADD       | ARM    | Add (extended register): Rd = Rn + LSL(extend(Rm), amoun
[1] | ADD       | MIPS32 |
[2] | ADD       | x86_64 | ADD-Add
[3] | ADD       | xtensa | Add
[4] | ADD       | x86    | ADD - Add
Enter number:
```

**Note:** This script will try to display the documentation using the pager defined by the enviroment variable `PAGER`, so you can set it to your favorite one (most, less, more)

```
$ export PAGER=most
$ asmref ...
```

## Credits

Opcodes database has been taken from nologic's idaref project:   
https://github.com/nologic/idaref
