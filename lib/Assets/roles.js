function () {

  var request = $REQUEST; /*{
    roles = [];
  }*/

  var limit = 1;
  for (role in this.roles.need) {
    var need = ref[role];
    if (need[0] > this.roles.delegations[role].length) {
      limit = 0;
      break;
    }
  }

  for (var i = 0, l = request.roles; i < l; i++) {
    var role = request.roles[i];
    if (this.roles.need[role] && this.roles.need[role][limit] > this.roles.delegations[role].length) {
      return true;
    }
  }

  return false;

};
