var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var s = require("underscore.string");
var express = require('express');
var iconv = require('iconv-lite');
var app = express();
var encoding = 'iso-8859-1';
var MongoClient = require('mongodb').MongoClient;
var pages = 421;
var collection = null;
var ufpanoticias = "http://www.portal.ufpa.br/imprensa/todasNoticias.php?pagina=1";
MongoClient.connect('mongodb://ufpanews:ufpanews13579@ds059898.mongolab.com:59898/ufpanews', function(err, db) {
    if (err) throw err;
    collection = db.collection('noticias');
    setInterval(run(ufpanoticias), 10000);
});
/**/
app.get('/', function(req, res) {
    res.send('UFPa News - v1.0');
});

app.get('/news', function(req, res) {
    if (collection != null) {
        try {
            var q = req.query.q;
            var query = {};
            if (q != undefined) {
                query = JSON.parse(q);
            }
            collection.find(query).toArray(function(err, docs) {
                res.jsonp(docs);
            });
        } catch (E) {
            res.jsonp({
                erro: E
            });
        }
    }
});

/**/
app.listen(process.env.VCAP_APP_PORT || 3000);
/**/

/**/
function run(u) {
    console.log("========== RUN ==========");
    request({
        url: u,
        encoding: null
    }, function(error, response, html) {
        // console.log(error, response, html);
        if (!error) {
            var $ = cheerio.load(iconv.decode(html, encoding));
            $("#todasNoticias").filter(function() {
                var data = $(this);
                data.find("li").filter(function() {
                    var data = $(this);
                    var obj = {};
                    var titulo = data.children().children().text().split("-");
                    var dateHour = limpaStr(titulo[0]).replace(" ", ";").split(";");
                    obj['data'] = dateHour[0];
                    obj['hora'] = dateHour[1];
                    obj['titulo'] = unescape(limpaStr(titulo[1]));
                    obj['link'] = data.children().attr("href");
                    obj['id'] = (removerAcentos(limpaStr(obj['data'])) + removerAcentos(limpaStr(obj['hora'])) + removerAcentos(limpaStr(obj['titulo'])) + removerAcentos(limpaStr(obj['link']))).replace(/\s/g, "").replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                    readPageAndSave(obj);
                });
            });
        }
    });
}

function readPageAndSave(obj) {

    request({
        url: 'http://www.portal.ufpa.br/imprensa/' + obj['link'],
        encoding: null
    }, function(error, response, html) {
        if (error) throw err;
        var $ = cheerio.load(iconv.decode(html, encoding));
        obj['content'] = $("#noticias").html();
        collection.update({
            id: obj['id']
        }, obj, {
            upsert: true
        }, function(err, result, upserted) {
            console.log(err, result, upserted);
        });
        /*collection.insert(obj, function(err, docs) {
        });*/
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
