{
  "general": {
    "max": 20,
    "min": 18,
    "wait after min": 10, // number of seconds before signaling that matchmaking is finished
  },
  "attributes": {
    "tier": {
      "type": "interval",
      "intervals": [[1,4], [5,9], 10],
      "value": "character.level"
    },
    "skill": {
      "type": "close",
      "distance": [0.1, 4]
      "value": {
        $divide: ["player.pvp_stats.battlegrounds.wins", "player.pvp_stats.battlegrounds.losses"]
      },
      "default": 0.5
    }
  },
  "roles": {
    "value": "input.selected_roles", // The roles are provided in the matching values as an array or string if it is a single role
    "limits": {
      "tank": [1,3], // Minimum 1, maximum 3
      "healer": [2,6], // Minimum 2, maximum 6
      "damage_dealer": 6 // Minimum of 6 damage dealers before starting
    }
  }
}
