const _ = require( 'underscore' )
const request = require( 'request' )
const config = require( __app + 'config' )

api = {}

module.exports = api

api.fetchHTML = function ( site, next ) {

    request( site.url, ( err, res, body ) => {
        if ( err ) console.error( err )

        next( err, ( !err ? body : '' ) )
    } )

}

api.checkAssets = function ( site, type, html, next ) {

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
