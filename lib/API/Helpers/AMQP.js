"use strict";

var amqp = require('amqplib/callback_api');

const DEFAULT_URL = process.env.AMQP_URL || 'amqp://localhost';

var channels = {};


exports.getChannel = function (url) {
  if (!url) {
    url = DEFAULT_URL;
  }
  if (!channels[url]) {
    channels[url] = new Promise(function (resolve, reject) {
      amqp.connect(url, function(err, conn) {
        if (err) return reject(err);
        conn.createChannel(function(err, ch) {
          if (err) return reject(err);
          resolve(ch);
        });
      });
    })
  }
  return channels[url];
}
  