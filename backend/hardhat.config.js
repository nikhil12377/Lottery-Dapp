require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainID: 31337,
      blockConformations: 1,
    },
    goerli: {
      chainID: 5,
      blockConformations: 6,
      url: process.env.RINKEBY_RPC_PROVIDER,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: false,
    currency: "INR",
    token: "MATIC",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
};
