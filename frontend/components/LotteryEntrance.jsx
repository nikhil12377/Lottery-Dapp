import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi, contractAddresses } from "../constants/index";
import { ethers } from "ethers";
import { useNotification } from "@web3uikit/core";
export const LotteryEntrance = () => {
  const { chainId: chainID } = useMoralis();
  const [entranceFee, setEntranceFee] = useState("0");
  const [numberOfPlayers, setNumberOfPlayers] = useState("0");
  const [recentWinner, setrecentWinner] = useState("0");
  const chainId = parseInt(chainID);
  const dispatch = useNotification();
  const lotteryAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  const {
    runContractFunction: enterLottery,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "enterLottery",
    params: {},
    msgValue: entranceFee,
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    updateUI();
    handleNewNotification(tx);
  };

  const handleNewNotification = (tx) => {
    dispatch({
      type: "info",
      message: "Transaction Complete",
      title: "Tx Notification",
      position: "topR",
      icon: "bell",
    });
  };

  async function updateUI() {
    try {
      const fee = (await getEntranceFee()).toString();
      const players = (await getNumberOfPlayers()).toString();
      const reWinner = (await getRecentWinner()).toString();
      setEntranceFee(fee);
      setNumberOfPlayers(players);
      setrecentWinner(reWinner);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (lotteryAddress) {
      updateUI();
    }
  }, [lotteryAddress]);
  return (
    <div className=" inline-block p-20">
      {lotteryAddress ? (
        <>
          <div className="heading">Welcome To Decentralized Lottery</div>
          <div>
            Lottery entrance fee is {ethers.utils.formatEther(entranceFee)}
          </div>
          <div>Number Of Players Joined: {numberOfPlayers}</div>
          <div>Recent Winner: {recentWinner}</div>
          <div className="flex py-6 justify-center">
            <button
              className="submit bg-blue-500 hover:bg-blue-700 p-3 rounded text-white font-bold"
              onClick={async () =>
                await enterLottery({
                  onSuccess: handleSuccess,
                  onError: (error) => console.log(error),
                })
              }
              disabled={isLoading || isFetching}
            >
              {isLoading || isFetching ? (
                <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
              ) : (
                <div>Enter Lottery</div>
              )}
            </button>
          </div>
        </>
      ) : (
        <div>No Lottery Contract Detected</div>
      )}
    </div>
  );
};
