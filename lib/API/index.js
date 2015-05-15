var restify = require('restify');
var request = require('request');
var Models = require('../Models');
var Views = require('./Views')

Models.init('mongodb://localhost/polynect-test');



var server = restify.createServer({
  name: 'Polynect',
});

// Plugins
server.use(restify.bodyParser());
server.use(restify.queryParser());
server.use(restify.jsonp());

// Start
server.listen(80);
console.log("Listening on port 80");

// Constants
var QUEUED = 'queued',
    CANCELLED = 'cancelled',
    MATCHED = 'matched';

// Routes
server.post('/matchmaking/requests', function create (req, res, next) {
  if (req.body.requirements && typeof req.body.requirements !== 'object') res.send(400, 'Invalid requirements');

  var model = new Models.Request();
  model.status = QUEUED;
  model.roles = req.body.roles;
  model.setRequirements(req.body.requirements);

  model.save(function (err, model) {
    if (err) {
      res.send(500, err)
    } else {
      request({
        method: 'PUT',
        url: 'http://localhost:48001/start/' + model._id
      }, function (error, response, body) {
        if (error) {
          return res.send(500, error);
        }
        // Retrieve it from DB in case it has changed
        Models.Request.findOne({_id: model._id}, function (err, model) {
          if (err) {
            res.send(500, err);
          } else if (response.statusCode == 202) {
            res.send(202, Views.Request(model));
          } else {
            model.status = 'finished';
            res.send(200, Views.Request(model))
          }
        })
      });

    }
  });

});
server.get('matchmaking/requests/:id', function (req, res, next) {
  Models.Request.findOne({_id: req.params.id}, function (err, model) {
    if (err) {
      res.send(500, err);
    } else {
      if (true) { // Authenticate
        res.send(200, Views.Request(model));
      } else {
        res.send(403, 'You do not have access to this matchmaking request')
      }

    }
  })
});
server.put('matchmaking/requests/:id', function (req, res, next) {
  Models.Request.findOne({_id: req.params.id}, function (err, model) {
    if (err) {
      res.send(500, err);
    } else if (!model) {
      res.send(404);
    } else {
      if (model.status == MATCHED) {
        res.send(400, 'A request cannot be changed if its status is "matched"')
      }
      if (req.body.requirements && typeof req.body.requirements == 'object') {
        model.setRequirements(req.body.requirements);
      }
      model.save(function (err) {
        if (err) {
          res.send(500, err)
        } else {
          res.send(200, Views.Request(model))
        }
      });

    }
  })
});
server.put('matchmaking/requests/:id/cancel', function (req, res, next) {
  Models.Request.findOne({_id: req.params.id}, function (err, model) {
    if (err) {
      res.send(500, err);
    } else if (!model) {
      res.send(404);
    } else {
      model.status = CANCELLED;
      model.save(function (err) {
        if (err) {
          res.send(500, err)
        } else {
          res.send(200, Views.Request(model))
        }
      });

    }
  })
})
