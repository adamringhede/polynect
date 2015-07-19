module.exports = function (model) {
  return {
    id: model._id,
    token: model.token,
    expires: model.expires,
    client_id: model.client_id,
    holder: model.holder
  }
}
