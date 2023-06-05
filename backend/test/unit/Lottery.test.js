const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat.config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery unit tests", () => {
      let lottery,
        vrfCoordinatorV2Mock,
        lotteryEntranceFee,
        deployer,
        interval,
        accounts;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all");
        lottery = await ethers.getContract("Lottery", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        lotteryEntranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
        accounts = await ethers.getSigners();
      });

      describe("constructor", () => {
        it("Initializes the lottery correctly", async () => {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(
            interval.toString(),
            networkConfig[network.config.chainId]["interval"]
          );
        });
      });

      describe("enterLottery", () => {
        it("reverts back when you don't pay enough", async () => {
          await expect(lottery.enterLottery()).to.be.revertedWith(
            "Lottery__NotEnoughETHEntered"
          );
        });

        it("records player when they enter", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          const playerFromContract = await lottery.getPlayer(0);
          assert.equal(playerFromContract, deployer);
        });

        it("emits an event when enter", async () => {
          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.emit(lottery, "LotteryEnter");
        });

        it("cannot enter when lottery is not open", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep([]);
          await expect(
            lottery.enterLottery({ value: lotteryEntranceFee })
          ).to.be.revertedWith("Lottery__NotOpen");
        });
      });

      describe("checkUpkeep", () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("returns false if lottery isn't open", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep([]);
          const lotteryState = await lottery.getLotteryState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(lotteryState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });
      });

      describe("performUpkeep", () => {
        it("it can only run when checkUpkeep is true", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep([]);
          assert(tx);
        });

        it("reverts when checkUpkeep is false", async () => {
          await expect(lottery.performUpkeep([])).to.be.revertedWith(
            "Lottery__NoUpkeepNeeded"
          );
        });

        it("updates the lottery state, emits an event, and calls the vrf coordinator", async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const txResponse = await lottery.performUpkeep([]);
          const txReceipt = await txResponse.wait(1);
          const requestID = txReceipt.events[1].args.requestID;
          const lotteryState = await lottery.getLotteryState();
          assert(requestID.toNumber() > 0);
          assert.equal(lotteryState.toString(), "1");
        });
      });

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });

        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");

          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks a winner, resets the lottery and sends money", async () => {
          const additionalEntrants = 3;
          const startingAccountIndex = 1; // deployer is at index 0
          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrants;
            i++
          ) {
            const accountConnectedLottery = await lottery.connect(accounts[i]);
            await accountConnectedLottery.enterLottery({
              value: lotteryEntranceFee,
            });
          }

          const startingTimeStamp = await lottery.getLastTimeStamp();

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("Event found");
              try {
                const recentWinner = await lottery.getRecentWinner();
                console.log(recentWinner);
                console.log(accounts[0]);
                console.log(accounts[1]);
                console.log(accounts[2]);
                console.log(accounts[3]);
                const lotteryState = await lottery.getLotteryState();
                const numberOfPlayers = await getNumberOfPlayers();
                const endingTimeStamp = await getLastTimeStamp();
                assert.equal(numberOfPlayers.toString(), "0");
                assert.equal(lotteryState.toString(), "0");
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const tx = await lottery.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events[1].args.requestID,
              lottery.address
            );
          });
        });
      });
    });
