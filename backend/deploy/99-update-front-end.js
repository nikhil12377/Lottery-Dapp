const { ethers, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRESSES_LOCATION =
  "../nextjs-lottery/constants/contractAddresses.json";
const FRONT_END_ABI_LOCATION = "../nextjs-lottery/constants/abi.json";
module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end");
    await updateContractAddress();
    await updateAbi();
  }
};

const updateAbi = async () => {
  const lottery = await ethers.getContract("Lottery");
  fs.writeFileSync(
    FRONT_END_ABI_LOCATION,
    lottery.interface.format(ethers.utils.FormatTypes.json)
  );
};

const updateContractAddress = async () => {
  const lottery = await ethers.getContract("Lottery");
  const chainID = network.config.chainId;
  const currentAddresses = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESSES_LOCATION, "utf-8")
  );

  if (chainID in currentAddresses) {
    if (!currentAddresses[chainID].includes(lottery.address)) {
      currentAddresses[chainID] = lottery.address;
    }
  } else {
    currentAddresses[chainID] = [lottery.address];
  }

  fs.writeFileSync(
    FRONT_END_ADDRESSES_LOCATION,
    JSON.stringify(currentAddresses)
  );

  console.log(currentAddresses);
};

module.exports.tags = ["all", "front-end"];
