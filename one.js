var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var s = require("underscore.string");
var express = require('express');
var iconv = require('iconv-lite');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var encoding = 'utf-8';

/**/
/*var collection;
MongoClient.connect('mongodb://molotov:molotov13579@ds035240.mongolab.com:35240/molotovseries', function(err, db) {
    if (err) throw err;

    collection = db.collection('series');
    console.log(collection);
    run();

})*/
// for(var i=1; i<=pages; i++){
run("http://www.portal.ufpa.br/imprensa/noticia.php?cod=10197");
// }

function run(u, callback) {
    request({
        url: u,
        encoding: null
    }, function(error, response, html) {
        // console.log(error, response, html);
        if (!error) {
            var $ = cheerio.load(iconv.decode(html, encoding));
            console.log($("#noticias").html());
        }
    });
}

function limpaStr(str) {
    return str.replace(/\t|\r|\n/g, "")
}

function removerAcentos(newStringComAcento) {
    var string = newStringComAcento;
    var mapaAcentosHex = {
        a: /[\xE0-\xE6]/g,
        e: /[\xE8-\xEB]/g,
        i: /[\xEC-\xEF]/g,
        o: /[\xF2-\xF6]/g,
        u: /[\xF9-\xFC]/g,
        c: /\xE7/g,
        n: /\xF1/g
    };

    for (var letra in mapaAcentosHex) {
        var expressaoRegular = mapaAcentosHex[letra];
        string = string.replace(expressaoRegular, letra);
    }

    return string;
};
