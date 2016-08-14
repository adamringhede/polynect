"use strict";

const Models = require('../../Models');
const async = require('async');
const WAIT_DURATION = 5000;
const MAX_WAIT = 30 * 60 * 1000; // Wait for at most 30 minutes

module.exports = (payload) => {
  return new Promise((resolve, reject) => {
    getMatchById(payload.teamsMatchId).then((teamsMatch, err) => {
      // Find teams to match with until full or surpassing max wait.
      let startedAt = Date.now();
      async.doUntil((callback) => {
        teamsMatch.matchWithOthers()
          .then(callback)
          .catch(() => setTimeout(callback, WAIT_DURATION));
      }, () => teamsMatch.isFull() || Date.now() > startedAt + MAX_WAIT, resolve);
    }).catch(() => {
      console.log("Failed to reserve match");
    })
  });
};

function getMatchById(teamsMatchId) {
  // Load teams match and reserve. If it fails, try reserving a few times.
  return new Promise((resolve, reject) => {
    Models.TeamsMatch.findById(teamsMatchId, (match, err) => {
      if (err) {
        console.log("Could not find match to reserve.");
      }
      let attempts = 5;
      let reserved = false;
      async.doUntil((callback) => {
        match.reserve().then((success) => {
          if (success) {
            reserved = true;
            callback();
          } else {
            setTimeout(callback, Math.random() * 100 + 50);
          }
        });
        attempts--;
      }, () => reserved || attempts == 0, () => reserved ? resolve(match) : reject())
    });
  });
}
