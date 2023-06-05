const { ethers } = require("hardhat");

async function enterLottery() {
  const lottery = await ethers.getContract("Lottery");
  const entranceFee = await lottery.getEntranceFee();
  await lottery.enterLottery({ value: entranceFee });
  const interval = (await lottery.getInterval()).toString();
  console.log(interval);
  const winner = await lottery.getRecentWinner();
  console.log(winner);
  const time = (await lottery.getLastTimeStamp()).toString();
  console.log(time);
  await lottery.callStatic.checkUpkeep([]);
  await lottery.callStatic.performUpkeep([]);
}

enterLottery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
