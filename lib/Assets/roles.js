function () {

  if (!this.roles) return false;

  var request = $REQUEST; /*{
    roles = [];
  }*/

  var allow_switching = $ALLOW_SWITCHING || false;

  var limit = 1;
  var minSum = 0;
  for (role in this.roles.need) {
    var need = this.roles.need[role];
    if (need[0] > this.roles.delegations[role].length) {
      limit = 0;
      //break;
    }
    minSum += need[0] - this.roles.delegations[role].length;
  }

  for (var i = 0, l = request.roles.length; i < l; i++) {
    var role = request.roles[i];
    // This can be improved by also also returning true if 
    // this.roles.need[role][1] > this.roles.delegations[role].length
    // and the max size minus the  sum of the minimum of requirements of all roles is greater than 0
    if (this.roles.need[role] && (this.roles.need[role][limit] > this.roles.delegations[role].length || 
      this.max - this.size > minSum )) {
      return true;
    }
  }

  if (!allow_switching) return false;

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
