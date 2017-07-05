const csv = require( 'csv-parser' )
const flow = require( 'flow' )
const fs = require( 'fs' )
const json2csv = require( 'json2csv' )
const read = require( 'readline-sync' )
const api = require( __app + 'api' )
const config = require( __app + 'config' )

function processSite( site, next ) {

    flow.exec(
        function () {
            // Get the HTML for the page
            api.fetchHTML( site, this )
        },

        function ( err, html ) {
            // Get the count of unminified CSS and JS files
            api.checkAssets( site, 'css', html, this.MULTI( 'css' ) )
            // api.checkAssets( site, 'js', html, this.MULTI( 'js' ) )
        },

        function ( res ) {
            site.unminified_css = res.css
            // site.unminified_js = res.js

            next( null, site )
        }
    )
}

function skipSite( site, next ) {
    next( null, site )
}

var sites = [],
    processed = 0,
    active = false

// Ask for the path to the csv
var csvFile = read.question( 'What is the path to the CSV file with the URLs? ', {
    defaultInput: config.defaultInputFile
} )

// Ask for the path to the csv
var outFile = read.question( 'What file should results be written to? ', {
    defaultInput: config.defaultOutputFile
} )

fs.createReadStream( csvFile )
    .pipe( csv() )

    .on( 'data', function ( site ) {

        if ( !site[ config.urlColumn ] ) return;

        site.url = site[ config.urlColumn ]

        site.url = site.url.replace( '*.', '' )

        site.url = -1 === site.url.indexOf( /https?:\/\// ) ? 'http://' + site.url : site.url;

        sites.push( site );
    } )

    .on( 'end', function () {
        console.log( 'Sites to process: ', sites.length )

        if ( !sites.length ) return

        let file = fs.openSync( outFile, 'a+', ( err, fd ) => {
            if ( err ) throw err;
        } )

        let outputBuffer = fs.readFileSync( file )

        if ( !outputBuffer.length ) {
            let fields = Object.keys( sites[ 0 ] )

            fields.push( 'unminified_css' )
            // fields.push( 'unminified_js' )

            let csvHeaders = json2csv( {
                data: {},
                fields: fields,
                hasCSVColumnTitle: true,
            } );

            fs.appendFile( file, csvHeaders + "\n", ( err ) => {
                if ( err ) throw err;
            } );
        }

        flow.serialForEach( sites, function ( site ) {
            // Run on each site

            if ( !active && outputBuffer.includes( site.url ) ) {
                active = true
            }

            // If our URL is in the output file, abort
            if ( active ) {
                processSite( site, this )

            } else {
                skipSite( site, this )
            }

        }, function ( err, site ) {
            // After each site has finished

            // If our URL is in the output file, abort
            if ( -1 < outputBuffer.includes( site.url ) ) {
                return
            }

            ++processed

            if ( !processed % 250 ) console.log( "Processed sites: ", processed )

            let csvSite = json2csv( {
                data: site,
                hasCSVColumnTitle: false,
            } )

            fs.appendFile( file, csvSite + "\n", ( err ) => {
                if ( err ) console.error( err );
            } );

        }, function () {
            // After all sites have finished
            fs.close( file )

        } );

    } );
