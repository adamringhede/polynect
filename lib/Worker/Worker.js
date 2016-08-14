"use strict";

const amqp = require('amqplib/callback_api');
const q = 'task_queue';

let ready = new Promise((resolve, reject) => {
  amqp.connect(process.env.AMQP_URL, (err, conn) => {
    if (err) return reject();
    conn.createChannel((err, ch) => {
      if (err) return reject();
      ch.assertQueue(q, {durable: true});
      resolve(ch);
    });
  });
});

exports.purge = function () {
  ready.then((ch) => {
    ch.purgeQueue(q);
  });
};

exports.run = function (type, payload) {
  ready.then((ch) => {
    ch.sendToQueue(q, new Buffer(JSON.stringify({
      type: type,
      payload: payload
    })), {persistent: true});
  });
};


