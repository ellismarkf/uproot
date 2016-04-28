# uproot

`uproot <path/to/your/shrinkwrapped/package.json> <'url-to-your-private-registry'>`

A small utility that checks a shrinkwrapped package.json file against a private registry and produces a file listing depedencies that are missing from or out of date with respect to the registry.

The motivation for this tool, and probably its sole use case, is to aid in submitting license reviews for a new package or set of packages that you have introduced into your project.  The alternative would be manually checking the entire registry (in my case, artifactory) one package at time, to see if the package is already there, and if it is, checking the package directory for the specific version of the package you want to import.

_No thanks._

It's time consuming, boring, and more importantly, a perfect candidate for scripting.  And thus, **uproot** was born.

## how to use it

Once you have the project on your machine, run `npm i` to install the utility's dependencies and then `npm link` to create a symlink from `index.js` script to `/usr/local/bin/uproot`, so you can use it from the command line (provided that `/usr/local/bin` is on your PATH).

Then: `uproot <path/to/your/shrinkwrapped/package.json> <'url-to-your-private-registry'>`

ie: `uproot ~/projects/cool-project/npm-shrinkwrap.json 'http://some-host:8000/artifactory/registry'`

Once **uproots** finishes processing, it will output a `.txt` file listing all the dependencies you use in your project that aren't currently in the registry, and noting whether the package needs a version bump or is simply not in the registry.  The list is comprised of entries that are formatted as follows:

```
	package name: <name>
  	version: <specific-version-number>
  	from: <semver pattern>
  	requesting: <new npm module || updated version of existing module>
  	resolved: <url-to-package>
	______________________________________________________________________________
```

Now you can give your architect or whoever handles license reviews a copy of your outputted `.txt` file, and both of you can be happy that this process was so easy.

To recap:

```
git clone git@github.com:ellismarkf/uproot.git
cd uproot
npm i
npm link
uproot <path/to/your/shrinkwrapped/package.json> <'url-to-your-private-registry'>
```
:joy:

## a quick note

**uproot** expects a [shrinkwrapped](https://docs.npmjs.com/cli/shrinkwrap) package.json file; if you don't have one, run `npm shrinkwrap` in the directory where your target package.json files lives.

If you do have one, and you have npm configured to pull from a registry other than the default, I would recommend deleting your node_modules/ directory, running `npm cache clean`, and then `npm install` again, this time making sure that you are pulling from npm's default registry and NOT your private registry.  You can do this by temporarily removing or disabling the configuration that tells npm where to send requests for packages (usually this is in a `.npmrc` file).  After you've pulled your dependencies from npm's registry, run `npm shrinkwrap` again, and feed this file to **uproot**.  See the caveats section below for more information.

## caveats & assumptions

* **uproot currently only checks top level dependencies, and doesn't indicate whether a given package's transitive dependencies are in the specified registry.  I'm working on it, but pull requests are welcome.**
* I don't know if this works on Windows.  Pull requests to enable Windows support are welcome. :neckbeard:
* Make sure your dependencies have been pulled from npm's registry before running `npm shrinkwrap`; this way the file that **uproot** produces will point to each package's location on the internet and not its location on your private registry.
* If you've already pulled your dependencies from your custom registry before running `npm shrinkwrap`, your dependencies' resolution URL will point to your custom registry.  Why is this a problem?  Because whoever will be reading your `.txt` file and importing the new packages into your registry will need to know where on the internet they can find the package, and pointing them to the custom registry wouldn't be very helpful, since the point of using **uproot** in the first place is to find which dependencies aren't already in the registry.
* The second argument you should give to **uproot** is the url to your private registry.  Internally, **uproot** uses that url as a base when searching for matches, and dynamically builds urls using dependency names that look like this: `registryBaseUrl + '/' + dependencyName + '/-/'`.  So if your registry doesn't correspond to that format (ie `http://some-host:8000/artifactory/registry/targetPackage/-/`), then this utility won't work for you out of the box.  You can, however, modify the source on your local machine to match your registry's url format.