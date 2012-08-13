/*
    Author: KevinBoucher.com

    Google Search API key:                    [YOUR GOOGLE API KEY]
    Google Custom Search page (cx code):      [YOUR GOOGLE CUSTOM SEARCH CX CODE]

    Example get request:
    https://www.googleapis.com/customsearch/v1?key=[YOUR GOOGLE API KEY]&cx=[YOUR GOOGLE CUSTOM SEARCH CX CODE]&q=agency&alt=json

*/

/// Constructor for 'query' data transfer object
var Query = function ( index, terms ) {

    var self = this;

    self.apiKey = "[YOUR GOOGLE API KEY]";
    self.cxCode = "[YOUR GOOGLE CUSTOM SEARCH CX CODE]";
    self.dataType = "json";
    self.fields = "kind,queries(nextPage/totalResults, nextPage/startIndex),items(htmlSnippet,htmlTitle,link)";
    self.start = index;
    self.query = terms;

    self.requestUrl = ko.computed( function () {
        return "https://www.googleapis.com/customsearch/v1?key=" + self.apiKey //api key
            + "&cx=" + self.cxCode          // Google Custom Search page code
            + "&alt=" + self.dataType       // data type
            + "&fields=" + self.fields      // fields to return
            + "&start=" + self.start        // results start index
            + "&q=" + self.query            // query terms
    } );

},

/// KnockoutJS View Model
SearchViewModel = function () {

    var self = this;

    self.index = 1;
    self.pageLength = 10;
    self.results = ko.observableArray( [] );
    self.resultsCount = self.results().length;
    self.terms = "";

    // Get results for new search term
    self.getResults = function ( form ) {

        var terms = $( "#search-text", form ).val();

        // Validate form
        if ( terms.replace( " ", "" ).length === 0 ) { return; }

        // New search so reset
        self.index = 1;
        self.results([]);
        self.terms = terms;

        // Get results
        self.queryResults();

    };

    // Get additional results for current search term
    self.getMoreResults = function () {
        self.queryResults();
    };

    // Query Google for results
    self.queryResults = function () {

        var query = new Query( self.index, self.terms ),
            url = query.requestUrl();

        $( "<div class=\"loading\"></div>" ).appendTo( "#results" );

        $.ajax( {
            url: url,
            crossDomain: true,
            error: function ( jqXHR, textStatus, errorThrown ) {

                // Remove loading icon & ajax error/no results messages
                $( "div.loading, #no-results, #ajax-error" ).remove();

                self.showMessage( {
                    id: "ajax-error",
                    type: "error",
                    message: "<p><strong>Unable to Retrieve Results</strong><br />Sorry, we are currently unable to retrieve the results of your search. Please try again later.</p>"
                } );
            },
            success: function ( data, textStatus, jqXHR ) {

                var i = 0,
                    response = typeof data === "object" ? data : JSON.parse( data ),
                    items = response.items;

                // Remove loading icon & ajax error/no results messages
                $( "div.loading, #no-results, #ajax-error" ).remove();

                // Show no results message & return
                if ( !items ) {
                    self.showMessage( { id: "no-results", type: "message", message: "No search results returned." } );
                    return;
                }

                // Add new items to results array
                for ( ; i < items.length; i++ ) {
                    self.results.push( items[i] );
                }

                // Update start index
                self.index = response.queries.nextPage[0].startIndex;
                self.resultsCount = response.queries.nextPage[0].totalResults;

            }
        } );

    };

    // Display UI messages
    self.showMessage = function ( oMessage ) {
        $( "<div id=\"" + oMessage.id + "\" class=\"" + oMessage.type + "\">" + oMessage.message + "</div>" ).prependTo( "#results" );
    }

},

ViewModel = new SearchViewModel();
ko.applyBindings( ViewModel );

/// Autoload results when scrollbar reaches bottom
$( window ).scroll( function () {

    /*
        There is a lot of discussion about the best way to determine when the scrollbar is
        at the bottom of the page. Issues arise with inaccurate calculations of document height.

        This solution seems to work best in this case.
    */

    if ( $( window ).scrollTop() + 1 >= $( document ).height() - $( window ).height() ) {

        if ( ViewModel.resultsCount > ViewModel.pageLength + ViewModel.index ) {
            ViewModel.getMoreResults();
        }

    }

});


