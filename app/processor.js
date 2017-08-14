const _ = require( 'underscore' )
const request = require( 'request' )
const config = require( __app + 'config' )

function debug( a, b, c, d ) {
    if ( config.debug ) {
        console.error( 'DEBUG', a, b, c, d )
    }
}

processor = {}

module.exports = processor

processor.fetchHTML = function ( site, next ) {
    debug( 'pre request', site.url )

    request( site.url, {}, function ( err, res, body ) {

        debug( 'post request', err, body )

        if ( err ) console.error( err )

        next( err, ( !err ? body : '' ) )
    } )

}

processor.checkAssets = function ( site, type, html, next ) {

    let urls = [],
        count = 0,
        gutCheck = 20,
        domainrgx = site.url.match( /(?:https?:\/\/)?([\w-\.]+\.[a-zA-Z]{2,15}).*/i )

    let domain = domainrgx[ 1 ].replace( '.', '\\.' )

    let typeExpression = "(?:href|src)=['\"]((?:https?:)?\\/\\/[\\w\\.]*?" + domain + "\/[^'\"]+\\." + type + ")[^'\"]*?['\"]"

    let reType = new RegExp( typeExpression, "ig" )

    while ( match = reType.exec( html ) ) {

        urls.push( match[ 1 ] )

        if ( !--gutCheck ) break;
    }

    let waiting = urls.length

    if ( !waiting ) next( count )

    _.each( urls, ( url ) => {
        if ( !url ) return;

        url = 0 == url.indexOf( 'http' ) ? url : 'http:' + url;

        request( url, ( err, res, body ) => {
            --waiting

            if ( err ) console.error( err )

            if ( body && config.maxLines < body.split( /\r\n|\r|\n/ ).length ) ++count

            if ( 1 > waiting ) next( count );
        } )
    } )
}
