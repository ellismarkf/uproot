# uproot

A small utility that checks a shrinkwrapped package.json file against a private registry and produces a file listing depedencies that are missing from or out of date with respect to the registry.

The motivation for this tool, and probably its sole use case, is to aid in submitting license reviews for a new package or set of packages that you have introduced into your project.  The alternative would be manually checking the entire registry (in my case, artifactory) one package at time, to see if the package is already there, and if it is, checking the package directory for the specific version of the package you want to import.

_No thanks._

It's time consuming, boring, and more importantly, a perfect candidate for scripting.  And thus, **uproot** was born.

## how to use it

Once you have the project on your machine, run `npm i` to install the utility's dependencies and create a symlink from `index.js` script to `/usr/local/bin/uproot`, so you can use it from the command line, provided that `/usr/local/bin` is on your PATH.

Then: `uproot <path/to/your/shrinkwrapped/package.json> <'url-to-your-private-registry'>`

ie: `uproot ~/projects/cool-project/npm-shrinkwrap.json 'http://some-host:8000/artifactory/registry'`

Once **uproots** finishes processing, it will output a `.txt` file listing all the dependencies you use in your project that aren't currently in the registry, and whether the package is simply not in the registry or it needs a version bump.  The list is comprised of entries that are formatted as follows:

```
	package name: <name>
  	version: <specific-version-number>
  	from: <semver pattern>
  	requesting: <new npm module || updated version of existing module>
  	resolved: <url-to-package>
	______________________________________________________________________________
```

**uproot** expects a [shrinkwrapped](https://docs.npmjs.com/cli/shrinkwrap) package.json file; if you don't have one, run `npm shrinkwrap` in the directory where your target package.json files lives.  If you do have one, and you have npm configured to pull from a registry other than the default, I would recommend deleting your node_modules/ directory, run `npm install` again, this time making sure that you are pulling from npm's default registry and NOT your private registry.  You can do this by temporarily removing or disabling the configuration that tells npm where to send requests for packages.  After you've pulled your dependencies from npm's registry, run `npm shrinkwrap` again, and feed this file to **uproot**.  See the caveats section below for more information.


## caveats

* I don't know if this works on Windows.  Pull requests to enable Windows support are welcome. :neckbeard:
* If you've already pulled your dependencies from your custom registry, when you run `npm shrinkwrap`, your dependencies' resolution URL (where the .tgz was pulled from) will point to your custom registry.  This means that for dependencies that only need a version bump (ie, exist in the registry, but not at the version you are requesting), the resolution URL will still be pointing to your custom registry.  Why is this a problem?  Because you want to point the 