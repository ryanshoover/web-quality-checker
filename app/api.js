const _ = require( 'underscore' )
const request = require( 'request' )

api = {}

// What's the maximum number of lines in a minified file
maxLines = 3;

module.exports = api

api.fetchHTML = function ( site, next ) {

    request( site.url, ( err, res, body ) => {
        if ( err ) console.error( err )

        next( err, ( !err ? body : '' ) )
    } )

}

api.checkAssets = function ( site, type, html, next ) {

    let urls = [],
        gutCheck = 20,
        domain = site.url.match( /(?:https?:\/\/)?([\w-\.]+\.[a-zA-Z]{2,15}).*/i )

    let domainre = domain[ 1 ].replace( '.', '\\.' )

    let typeExpression = "(?:href|src)=['\"]((?:https?:)?\\/\\/[\\w\\.]*?" + domainre + "\/[^'\"]+\\." + type + ")[^'\"]*?['\"]"

    let reType = new RegExp( typeExpression, "ig" )

    while ( match = reType.exec( html ) && gutCheck ) {
        --gutCheck
        urls.push( match[ 1 ] )
    }

    let count = 0

    let waiting = urls.length

    if ( !waiting ) next( count )

    _.each( urls, ( url ) => {
        if ( !url ) return;

        url = 0 == url.indexOf( 'http' ) ? url : 'http:' + url;

        request( url, ( err, res, body ) => {
            --waiting

            if ( err ) console.error( err )

            if ( body && maxLines < body.split( /\r\n|\r|\n/ ).length ) ++count

            if ( 0 == waiting ) next( count );
        } )
    } )
}
