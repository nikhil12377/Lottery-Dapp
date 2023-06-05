import { useEffect } from "react";
import { useMoralis } from "react-moralis";
export const ManualHeader = () => {
  const {
    enableWeb3,
    account,
    isWeb3Enabled,
    Moralis,
    deactivateWeb3,
    isWeb3EnableLoading,
  } = useMoralis();

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log(`Account changed to ${account}`);
      if (account === null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("Null account found");
      }
    });
  }, []);
  useEffect(() => {
    if (isWeb3Enabled) return;
    if (typeof window !== "undefined") {
      if (localStorage.getItem("connected")) enableWeb3();
    }
  }, [isWeb3Enabled]);
  return (
    <div>
      {isWeb3Enabled ? (
        <h3>Connected to {account}</h3>
      ) : (
        <button
          onClick={async () => {
            await enableWeb3();

            localStorage.setItem("connected", "injected");
          }}
          disabled={isWeb3EnableLoading}
        >
          connect
        </button>
      )}
    </div>
  );
};
