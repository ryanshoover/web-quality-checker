const csv = require( 'csv-parser' )
const flow = require( 'flow' )
const fs = require( 'fs' )
const json2csv = require( 'json2csv' )
const read = require( 'readline-sync' )
const api = require( __app + 'api' )

function processSite( site, next ) {

    flow.exec(
        function () {
            // Get the HTML for the page
            api.fetchHTML( site, this )
        },

        function ( err, html ) {
            // Get the count of unminified CSS and JS files
            api.checkAssets( site, 'css', html, this.MULTI( 'css' ) )
            api.checkAssets( site, 'js', html, this.MULTI( 'js' ) )
        },

        function ( res ) {
            site.unminified_css = res.css
            site.unminified_js = res.js

            next( null, site )
        }
    )
}

function writeToFile( data ) {
    var result = json2csv( {
        data: data,
        fields: Object.keys( data[ 0 ] )
    } );

    fs.writeFileSync( outFile, result );
}

var sites = [],
    processed = 0

// Ask for the path to the csv
var csvFile = read.question( 'What is the path to the CSV file with the URLs? (default: test.csv) ', {
    defaultInput: 'test.csv'
} )

// Ask for the path to the csv
var outFile = read.question( 'What file should results be written to? (default: output.csv) ', {
    defaultInput: 'output.csv'
} )

// Ask for the label of the URL
var urlColumn = read.question( 'What is the label for the column with the URL? (default: URL) ', {
    defaultInput: 'URL'
} )

fs.createReadStream( csvFile )
    .pipe( csv() )

    .on( 'data', function ( site ) {

        if ( !site[ urlColumn ] ) return;

        site.url = site[ urlColumn ]

        site.url = -1 === site.url.indexOf( /https?:\/\// ) ? 'http://' + site.url : site.url;

        site.url = site.url.replace( '*.', '' )

        sites.push( site );
    } )

    .on( 'end', function () {
        flow.serialForEach( sites, function ( site ) {

            processSite( site, this )

        }, function ( err, site ) {

            ++processed
            if ( !processed % 1000 ) console.log( 'Processed sites: ', processed )

        }, function () {

            writeToFile( sites )

        } );

    } );
