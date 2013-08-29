require("./chai.helper");
var domHelper = require("./dom.helper");
var HttpFake = require("./http-fake.helper");

describe("jsonp", function () {
    var server = HttpFake.createServer();

    // we need to refer to this from the tests, but we allow
    // the server to randomly get a port before setting it
    var host;

    before(function (done) {
        domHelper();

        server.start(function () {
            host = "localhost:" + server.port;
            done.apply(null, arguments);
        });
    });

    afterEach(function () {
        server.clearFakes();
    });

    after(function (done) {
        server.stop(done);
    });

    it("should load an external JSONP script with callback in the URI", function (done) {
        var expected = { JSONP_LOADED: true };

        server.registerFake(
            // response config
            {
                data: function (req) {
                    var callback = req.query["callback"];
                    return callback + "(" + JSON.stringify(expected) + ");";
                }
            },

            // request matcher
            {
                path: '/1'
            }
        );

        // make chai's expect function available in the execution context
        // for the script
        window.expect = expect;

        // this is the function referenced in the querystring sent
        // to the server
        window.parseResponse = function (data) {
            window.expect(data).to.eql(expected);
            done();
        };

        $.jsonP({
            // NB querystring callback set to the function defined above
            url: "http://" + host + "/1?callback=window.parseResponse",

            error: function (xhr) {
                console.log(xhr);
                done(new Error("could not load jsonp script"));
            }
        });
    });

});
