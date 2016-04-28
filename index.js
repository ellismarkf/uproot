#! /usr/bin/env node

var _ = require('lodash')
var series = require('async').series
var forEachOf = require('async').forEachOf
var exec = require('child_process').exec
var fs = require('fs')
var path = require('path')
var artifactsRegEx = /"(.+)"/g
var packageRegEx = /"(.+).tgz"/g
var registryBaseUrl = process.argv[3]
var cURL = 'curl -i -L '

function generateDesc(dep, version, versionRange, type, resolvedURL) {
	var requestTypes = {
		'newPkg': 'new npm module',
		'newVer': 'updated version of existing module'
	}
	return (
		'package name: ' + dep + '\n' +
	  	'version: ' + version + '\n' +
	  	'from: ' + versionRange + '\n' +
	  	'requesting: ' + requestTypes[type] + '\n' +
	  	'resolved: ' + resolvedURL + '\n' +
		'______________________________________________________________________________\n\n'
	)
}

var unapprovedPkgs = []
var unapprovedVersions = []

series([
		function(callback) {
			fs.unlink(path.join(__dirname, 'uprootedDeps.txt'), (err) => {
				if (err && err.code !== 'ENOENT') throw err
			 	if (!err || err && err.code === 'ENOENT') callback(null)
			})
		}
	  , function(callback) {
	  		console.info('fetching existing npm modules')
			exec(cURL + registryBaseUrl, function(error, stdout, stderr) {
				var artifacts = stdout
					.match(artifactsRegEx)
					.map( function(a, i, artfx) {
						return a.substr(1, a.length - 3)
					})
					.slice(2, -1)
				callback(null, artifacts)
			})
		}
	  , function(callback) {
	  		console.info('processing shrinkwrapped package.json file', process.argv[2])
			fs.readFile(process.argv[2], 'utf8', function(err, data) {
				callback(null, JSON.parse(data))
			})
		}
	]
  , function(err, results){
		if (err) {
			console.log(err)
			throw err
		} else {
			var artifacts = results[1]
			var deps = results[2].dependencies
			var depLabels = Object.keys(deps)
			var approvedDeps = depLabels.filter(function(dep, index, deps) {
				return _.includes(artifacts, dep)
			})
			var unapprovedDeps = depLabels.filter(function(dep, index, deps) {
				return !_.includes(artifacts, dep)
			})

			series([
				function(callbackS) {
					console.info('writing unapproved module requests...')
					forEachOf(unapprovedDeps, function(dep, index, callbackF) {
						var fullDepSpec = deps[dep]
						var version = fullDepSpec.version
						var versionRange = fullDepSpec.from
						var resolvedURL = fullDepSpec.resolved
						var childDeps = fullDepSpec.dependencies ? fullDepSpec.dependencies : null
						var depDesc = generateDesc(dep, version, versionRange, 'newPkg', resolvedURL)
						unapprovedPkgs.push(dep)
						fs.appendFile( path.join(__dirname, 'uprootedDeps.txt'), depDesc, 'utf8', (err) => {
							if (err) throw err
							callbackF()
						});
					})
					callbackS(null, unapprovedPkgs)
				}
			  , function(callbackS) {
			  		console.info('writing version upgrade requests...')
			  		// async each through approved deps to check if requested dep version already exists in artifactory
			  		forEachOf(approvedDeps, function(dep, index, callbackF) {
			  			var fullDepSpec = deps[dep]
			  			var version = fullDepSpec.version
						var versionRange = fullDepSpec.from
						var resolvedURL = fullDepSpec.resolved
			  			var packageURL = registryBaseUrl + '/' + dep + '/-/'
			  			exec(cURL + packageURL, function(error, stdout, stderr) {
			  				if (error) return callbackF(error)
			  				var versions = stdout
			  					.match(packageRegEx)
			  					.map( (p, i, pkgs) => {
			  						return p.slice(p.lastIndexOf('-') + 1, p.lastIndexOf('.'))
			  					})
			  				if ( !_.includes(versions, version) ) {
			  					var depDesc = generateDesc(dep, version, versionRange, 'newVer', resolvedURL)
			  					fs.appendFile( path.join(__dirname, 'uprootedDeps.txt'), depDesc, 'utf8', (err) => {
			  						unapprovedVersions.push(dep)
			  						if (err) throw err
			  						return callbackF()
			  					});
			  				} else {
			  					callbackF()
			  				}
			  			})
			  		})
			  		callbackS(null, unapprovedVersions)
			  	}]
			  , function(err, results) {
			  		if (err) throw err
					console.info('Finished! Your license review document is at', path.join(__dirname, 'uprootedDeps.txt'))
			})
		}
})
