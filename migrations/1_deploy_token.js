const DragonKart = artifacts.require("DragonKart");
const Env = require('../env');

module.exports = function (deployer) {
    deployer.deploy(DragonKart, Env.get('TOKEN_NAME'), Env.get('TOKEN_SYMBOL'));
};
