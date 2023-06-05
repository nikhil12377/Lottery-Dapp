const { run } = require("hardhat");

const verify = async (contractAddress) => {
  console.log("Verifying the contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
    });
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract Already Verified");
    } else {
      console.log(error);
    }
  }
};

module.exports = verify;
