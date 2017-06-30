const _ = require( 'underscore' )
const csv = require( 'node-csv' ).createParser()
const flow = require( 'flow' )
const read = require( 'readline-sync' )
const request = require( 'request' )

// Ask for the path to the csv
var csvFile = read.question( 'What is the path to the CSV file with the URLs? ' )

// Ask for the label of the URL
var urlColumn = read.question( 'What is the label for the column with the URL? ' )

// Ask for our threshold for the lines in a minified file
var maxLines = read.questionInt( 'How many lines should a minified file have at maximum? (default: 3) ', {
    defaultInput: 3
} )

csv.mapFile( csvFile, function ( err, sites ) {
    _.each( sites, ( site, i ) => {
        // Testing line. Remove pre-production
        if ( 2 < i ) return

        // abort if no URL to test
        if ( !site[ urlColumn ] || false ) return

        let url = site[ urlColumn ]

        flow.exec(
            function () {
                fetchHTML( url, this )
            },

            function ( err, results ) {
                checkAssets( results, 'css', url, this.MULTI( 'css' ) )
                checkAssets( results, 'js', url, this.MULTI( 'js' ) )
            },

            function ( err, results ) {
                updateCSV( results )
            }
        )

    } )
} );

function fetchHTML( url, next ) {
    request( url, ( err, res, body ) => {
        if ( err ) console.error( err )

        let html = !err ? body : '';

        next( err, html )
    } )
}

function checkAssets( results, type, baseURL next ) {
    let urls = []
    let errs = []
    let count = 0
    let domain = baseURL.match( /https?:\/\/([/w\.]+\.[\w]{2,15}).*/i )
    let reType = new RegExp( "href=['\"]((?:https?:)?\/\/" + domain[ 0 ] + ".+\." + type + ")['\"]" )

    while ( match = reType.exec( results.html[ 0 ] ) ) {
        urls.push( match[ 1 ] )
    }

    _.each( urls, ( url ) => {
        request( url, ( err, res, body ) => {
            if ( err ) {
                console.error( err )
                errs.push( err )
                return
            }

            let lines = body.split( /\r\n|\r|\n/ ).length

            if ( lines > maxLines ) count++
        } )
    } )

    next( errs, count )
}

function updateCSV( results ) {
    console.log( results )
}
