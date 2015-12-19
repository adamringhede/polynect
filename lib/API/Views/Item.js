module.exports = function (model) {
  var view = {
    id: model._id,
    name: model.item_spec.name,
    product_id: model.item_spec.product_id,
    stackable: model.item_spec.stackable,
    itemSpec: model.item_spec.id,
    player: model.player,
    character: model.character,
    attributes: model.attributes
  }
  if (model.item_spec.stackable) {
    view.count = model.count;
  } else {
    view.data = model.data;
  }
  return view;
}
