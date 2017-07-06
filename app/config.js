const path = require( 'path' );

if ( 'development' == process.env.NODE_ENV ) {
    const env = require( 'node-env-file' );
    env( path.normalize( __dirname + '/../.env' ) );
}

// Get the types of files to test
let types = _.map( ( process.env.FILE_TYPES || 'css,js' ).split( ',' ), ( type ) => {
    return type.trim()
} )

module.exports = {
    defaultInputFile: process.env.INPUT_FILE || 'test.csv',
    defaultOutputFile: process.env.OUTPUT_FILE || 'output.csv',
    maxLines: process.env.MAX_LINES || 3,
    urlColumn: process.env.URL_COLUMN || 'domain',
    types: types
};
