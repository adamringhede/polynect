module.exports = function (model) {
  return {
    id: model._id,
    requests: model.requests
  }
}
