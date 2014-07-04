# Larry #

[![Build Status][drone-badge]](https://drone.io/bitbucket.org/fusioncharts/larry/latest)

Larry is a generic packaging tool for applications that need to bundle their source code in packages, ready to be shipped.

## Usage ##

Usage: `larry [options]`

### Options ###

Parameter             | Description
---------------------:|:-----------
`-h, --help`          | Output usage information
`-V, --version`       | Output the version number
`-c, --config [path]` | Path to JSON configuration file. Default './larry.json' in the current directory.
`-q, --quiet          | Let not Larry chatter while he does his job.

## Configuration ##

Configuration of Larry has three main parts - options, components and packages. These configurations need to be put in a JSON file, which is passed to the `larry` executible with the `--config` option. A sample configuration file can be seen at [`tests/fixtures/config/larry.json`](tests/fixtures/config/larry.json).

### Options ###

These are general options for Larry, the `options` object can contain:

Key              | Description
----------------:|:-------------------------------
`input`          | Base input directory (required).
`output`         | Base output directory (required).
`archive`        | Whether to turn on archiving for all packages. Default `true`.

A sample `options` object will look like:

```json
{
    "options": {
        "input"   : "./src/artefacts",
        "output"  : "./out",
        "archive" : true
    }
}
```

### Components ###

A component definition contains all the component properties that would be needed while packaging. `components` in the configuration will be an array of objects where each item in the array will define a new component. A component can be used by multiple packages.

Each item in the `components` array can contain:

Key                   | Description
---------------------:|:-----------------------------
`name`                | Name of the component.
`description`         | A description of the component.
`include`             | An array of paths to be included, relative to `options.input`.
`destination`         | An array of destination paths corresponding to items in `include`.
`excludePattern`      | A regex string. Files matching this regex string will be excluded.
`enabled`             | If `false`, disables the component. Default `true`.

A sample `components` object will look like:

```json
{
    "components": [
        {
            "name": "component-1",
            "include": [
                "node_modules/",
                "src"
                ],
            "destination": [
                "bin/ok",
                "files/src"
            ],
            "excludePattern": ".*\\.json"
        },
        {
            "name": "component-2",
            "include": [
                "node_modules/",
                "src"
            ],
            "destination": [
                "bin2/ok",
                "files2/src"
            ]
        }
    ]
}
```

### Packages ###

A package definition contains a list of all components that will be part of the package. Similar to `components`, `packages` option will be an array of objects, where each item will define a new package.

Each item in the `packages` array can contain:

Key                 | Description
-------------------:|:--------------------------------
`name`              | Name of the package.
`description`       | Description of the component.
`components`        | An array of component names to include in this package.
`archive`           | Whether to archive the package or not. Overrides `options.archive`.
`archiveRoot`       | If `archive` is `true`, this is the name of the root folder within the archive.

A sample `packages` object will look like:

```json
{
    "packages": [
        {
            "name": "p1",
            "enabled": true,
            "components": [
                "component-1"
            ],
            "archiveRoot": "package1",
            "archive": true
        },
        {
            "name": "p2",
            "enabled": true,
            "components": [
                "component-1",
                "component-2"
            ],
            "archive": false
        }
    ]
}
```

## Roadmap ##

 - Add support for `includePattern` in components.
 - Add support to exclude files or folders by path in components.
 - Add preprocess and postprocess hook support for packages.
 - Add package verification support after they have been created.

[drone-badge]: https://drone.io/github.com/fusioncharts/larry/status.png