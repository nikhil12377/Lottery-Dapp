const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat.config");

const verify = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  let VRFCoordinatorV2Address, subscriptionId;
  const chainId = network.config.chainID;
  console.log(chainId);
  console.log(network.config);
  const VRF_SUB_FUND_AMOUNT = 2;

  if (developmentChains.includes(network.name)) {
    const VRFCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock");
    VRFCoordinatorV2Address = VRFCoordinatorV2.address;
    const TransactionResponse = await VRFCoordinatorV2.createSubscription();
    const TransactionReceipt = await TransactionResponse.wait(1);
    subscriptionId = TransactionReceipt.events[0].args.subId;

    await VRFCoordinatorV2.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    VRFCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const entranceFee = networkConfig[chainId]["entranceFee"];
  const gasLane = networkConfig[chainId]["gasLane"];
  const gasLimit = networkConfig[chainId]["gasLimit"];
  const interval = networkConfig[chainId]["interval"];

  const args = [
    VRFCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    gasLimit,
    interval,
  ];
  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("lottery contract deployed!");
  log("Lottery address: ", lottery.address);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying.....");
    await verify(lottery, args);
  }

  log(
    "-----------------------------------------------------------------------------------"
  );
};

module.exports.tags = ["all", "lottery"];
