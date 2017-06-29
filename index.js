const _ = require( 'underscore' )
const csv = require( 'node-csv' ).createParser()
const request = require( 'request' )
const read = require( 'readline-sync' )

var csvFile = read.question( 'What is the path to the CSV file with the domains? ' );
var lineCount = read.questionInt( 'How many lines should a minified file have at maximum? (default: 3) ', {
    defaultInput: 3
} )
console.log( lineCount )
csv.mapFile( csvFile, function ( err, sites ) {
    _.each( sites, ( site ) => {
        if ( site.domain ) {
            // do
            // - get html
            // do
            // - check css
            // - check js
            // do
            // - update csv
        }
    } )
} );
