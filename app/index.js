const _ = require( 'underscore' )
const csv = require( 'csv-parser' )
const flow = require( 'flow' )
const fs = require( 'fs' )
const json2csv = require( 'json2csv' )
const read = require( 'readline-sync' )
const processor = require( __app + 'processor' )
const config = require( __app + 'config' )

function debug( a, b, c, d ) {
    if ( config.debug ) {
        console.error( 'DEBUG', a, b, c, d )
    }
}

function processSite( site, next ) {

    flow.exec(
        function () {
            // Get the HTML for the page
            processor.fetchHTML( site, this )
        },

        function ( err, html ) {
            // Get the count of unminified files
            _.each( config.types, ( type ) => {
                processor.checkAssets( site, type, html, this.MULTI( type ) )
            } )

        },

        function ( res ) {
            // Save the count of unminified files
            _.each( config.types, ( type ) => {
                site[ 'unminified_' + type ] = res[ type ]
            } )

            next( null, site )
        }
    )
}

function skipSite( site, next ) {
    next( null, site )
}

var sites = [],
    processed = 0

// Ask for the path to the csv
var csvFile = read.question( 'What is the path to the CSV file with the URLs?   ', {
    defaultInput: config.defaultInputFile
} )

// Ask for the path to the csv
var outFile = read.question( 'What file should results be written to?           ', {
    defaultInput: config.defaultOutputFile
} )

var file = fs.openSync( outFile, 'a+', ( err, fd ) => {
    if ( err ) throw err;
} )

var outputBuffer = fs.readFileSync( file )

if ( !outputBuffer.length ) {
    let fields = Object.keys( sites[ 0 ] )

    _.each( config.types, ( type ) => {
        fields.push( 'unminified_' + type )
    } )

    let csvHeaders = json2csv( {
        data: {},
        fields: fields,
        hasCSVColumnTitle: true,
    } );

    fs.appendFile( file, csvHeaders + "\n", ( err ) => {
        if ( err ) throw err;
    } );
}

fs.createReadStream( csvFile )

    .pipe( csv() )

    .on( 'data', function ( site ) {

        // If we've hit our cap of sites to process, abort.
        if ( config.maxSites < sites.length ) return;

        // If we don't have a URL, abort.
        if ( !site[ config.urlColumn ] ) return;

        site.url = site[ config.urlColumn ].replace( '*.', '' )

        site.url = -1 === site.url.indexOf( /https?:\/\// ) ? 'http://' + site.url : site.url;

        // If the output file already has this URL, abort.
        if ( outputBuffer.includes( site.url ) ) return;

        sites.push( site );
    } )

    .on( 'end', function () {
        console.log( 'Sites to process: ', sites.length )

        if ( !sites.length ) return

        flow.serialForEach( sites,
            function ( site ) {
                debug( 'processSite', site.url )
                processSite( site, this )
            },
            function ( err, site ) {
                // After each site has finished
                ++processed

                if ( 0 === processed % 100 ) console.log( "Processed sites: ", processed )

                let csvSite = json2csv( {
                    data: site,
                    hasCSVColumnTitle: false,
                } )

                debug( 'writing', site.url )
                fs.appendFile( file, csvSite + "\n", ( err ) => {
                    if ( err ) console.error( err );
                } );

            },
            function () {
                // After all sites have finished

                fs.close( file )

            } );

    } );
