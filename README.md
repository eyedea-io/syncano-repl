![](assets/banner.png)

<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/syncano-repl">
    <img alt="" src="https://badgen.net/npm/v/syncano-repl">
  </a>
  <a aria-label="License" href="https://github.com/eyedea/syncano-repl/blob/master/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/syncano-repl">
  </a>
</p>

## Usage

To install the latest version of Syncano REPL run this command:

```sh
npm i -g syncano-repl
```

Or you can quickly use it with:

```sh
npx syncano-repl
```

To start Syncano REPL, go to your project root directory and run:

```sh
sr
# or
syncano-repl
```

This will give you access to interactive editor with initialized [@syncano/core](https://github.com/Syncano/syncano-node/tree/master/packages/lib-js-core) available under `s` variable:

```sh
# Get list of classes in current instance
s._class.list()

# Get list of users
s.users.list()

# User any method listed in Syncano Core docs
s.data.posts.where('status', 'draft').list()
```

## Good to know

- Syncano response will be piped into [fx](https://github.com/antonmedv/fx) command which makes response interactive. [Read docs](https://github.com/antonmedv/fx) to learn how to use it.
- Last response is saved to `.syncano-repl-response.json` file in directory where Syncano REPL was run.
- All called commands are saved to `.syncano-repl-history` file in directory wher Syncano REPL was run.
- It's recommended to add `.syncano-repl-response.json` and `.syncano-repl-history` to `.gitignore`
