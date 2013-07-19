// ==UserScript==
// @name        GitHub Issue Voting
// @namespace   http://nikcodes.com
// @description A script to add voting capabilities to GitHub Issues/
// @include     /https://github.com/.+/.+/issues/
// @version     1
// @grant       none
// ==/UserScript==

// TODO: Improve the @include RegEx
$(function(){
    console.log('running userscript');
    update();
});

function update(){
    var pathPart = window.location.pathname.split('/'),
    owner = pathPart[1],
    repo = pathPart[2],
    cacheDuration = -500, // in milliseconds
    up = new RegExp(/:\+1:|:thumbsup:/),
    down = new RegExp(/:-1:|:thumbsdown:/); // emoji options can be customized here
   
    $('.list-group-item-meta').each(function(index){
        var that = $(this),
        id = that.parent().attr('id').replace('issue_',''),
        uri = 'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + id + '/comments',
        itemCache = JSON.parse(window.localStorage.getItem(key(owner, repo, id)));
      
        if (itemCache !== null && itemCache.time > Date.now() - cacheDuration){
            updateUi(that, itemCache.votes);
        } else {
            var loader = displayLoadMessage(that);
            // TODO: Add a loading message
            $.ajax({url: uri, context: that, dataType: 'json', global: false, headers: {Authorization: 'token 04f12d48ff23766940f8d9745e8d6918ee29399b'}})
            .done(function(data) {
                var votes = 0;
                $.each(data, function(index, value){
                    votes += up.test(value.body);
                    votes -= down.test(value.body);
                });
                window.localStorage.setItem(key(owner, repo, id), JSON.stringify({time: Date.now(), votes: votes}));
                loader.remove();
                updateUi(that, votes);
            })
            .fail(function(){
                loader.remove();
                updateUi(that, null);
            });
        }
    });
}

function updateUi(issueDom, votes){
    votes = votes || 0;
    
    var arrowDirection = votes > 0 ? 'arrow-up' : votes === 0 ?'primitive-dot' : 'arrow-down',
    label = Math.abs(votes) === 1 ? ' vote' : ' votes',
    output = '<li><span class="octicon octicon-' + arrowDirection + '"></span><span style="color:#333;"> ' + votes + label + '</span></li>';

    $(issueDom).append(output);
}

function displayLoadMessage(issueDom){
    var loader = $('<li><span class="octicon octicon-clock"></span><span style="color:#333;"> loading</span></li>');
    $(issueDom).append(loader);
    return loader;
}

function key(owner, repo, id){
    return owner + '-' + repo + '-' + id + '-github-votes';
}