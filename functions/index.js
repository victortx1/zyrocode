const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({
  region: "southamerica-east1",
  maxInstances: 30
});

exports.completeLesson = require("./src/completeLesson").completeLesson;
exports.claimMission = require("./src/claimMission").claimMission;
exports.purchaseShopItem = require("./src/purchaseShopItem").purchaseShopItem;
exports.equipCosmetic = require("./src/equipCosmetic").equipCosmetic;
