"use strict";

const amqp = require('amqplib/callback_api');
const q = 'task_queue';

amqp.connect(process.env.AMQP_URL, (err, conn) => {
  if (err != null) throw err;
  conn.createChannel((err, ch) => {
    ch.assertQueue(q, {durable: true});
    ch.prefetch(1);
    console.log(" [*] Waiting for messages in %s.", q);
    ch.consume(q, (msg) => parse(msg).then(run(msg)), {noAck: false});
  });
});

function parse(msg) {
  return new Promise((resolve, reject) => {
    try {
      let data = JSON.parse(msg.content.toString());
      let worker = require('./Tasks/' + data.type);
      resolve(worker, data.payload || null, type);
    } catch (err) {
      console.log("Failed to parse " + msg);
      console.log(err);
      msg.ack();
      reject();
    }
  })
}

function run(msg) {
  return (worker, payload, type) => {
    console.log("Starting " + type + " with payload " + JSON.stringify(payload));
    worker(payload).then(() => {
      console.log("Finished " + type);
      msg.ack();
    }).catch((err) => {
      console.log("Failed " + type + " with error: " + err);
      msg.ack();
    })
  };
}

