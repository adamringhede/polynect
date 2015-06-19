function () {

  var request = $REQUEST; /*{
    roles = [];
  }*/

  var allowSwitching = $ALLOW_SWITCHING || false;

  var limit = 1;
  for (role in this.roles.need) {
    var need = this.roles.need[role];
    if (need[0] > this.roles.delegations[role].length) {
      limit = 0;
      break;
    }
  }

  for (var i = 0, l = request.roles.length; i < l; i++) {
    var role = request.roles[i];
    if (this.roles.need[role] && this.roles.need[role][limit] > this.roles.delegations[role].length) {
      return true;
    }
  }

  if (!allowSwitching) return false;

  ref = request.roles;
  for (j = 0, len = ref.length; j < len; j++) {
    role = ref[j];
    if (this.roles.need[role][0] > 0) {
      ref1 = this.roles.delegations[role];
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        other = ref1[i];
        if (other.roles.length > 1) {
          ref2 = other.roles;
          for (l = 0, len2 = ref2.length; l < len2; l++) {
            otherRole = ref2[l];
            if (otherRole === role) {
              continue;
            }
            if ((this.roles.need[otherRole] != null) && this.roles.need[otherRole][1] > this.roles.delegations[otherRole].length) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;

};
