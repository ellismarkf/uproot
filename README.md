# uproot

A small utility that checks a shrinkwrapped package.json file against a private registry and produces a file listing depedencies that are missing from or out of date with respect to the registry.

The motivation for this tool, and probably its sole use case, is to aid in submitting license reviews for a new package or set of packages that you have introduced to your project.  The alternative would be manually checking the entire registry (in my case, artifactory) one package at time, to see if the package is already there, and if it is, checking the package directory for the specific version of the package you want to import.

No thanks.

It's time consuming, boring, and more importantly, a perfect candidate for scripting.  And thus, **uproot** was born.

## how to use it

Once you have the project on your machine, run `npm i` to install the utility's dependencies and create a symlink from `index.js` script to `/usr/local/bin/uproot`, so you can use it from the command line, provided that `/usr/local/bin` is on your PATH.