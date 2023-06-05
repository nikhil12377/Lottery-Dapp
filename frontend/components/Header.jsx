import { ConnectButton } from "@web3uikit/web3";

export const Header = () => {
  return (
    <div>
      <ConnectButton moralisAuth={false} />
    </div>
  );
};
