import React, {useEffect} from "react";
import {Link} from "react-router-dom";
import "./how-to.css";

function HowTo() {
  return (
    <header className="layout">
      <h1>How to install WalletConnect in your project</h1>
      <h5>
        {`For react you could use this `}
        <a
          href="https://docs.walletconnect.com/2.0/web/web3modal/react/wagmi/installation"
          target="_blank"
          rel="noopener noreferrer"
        >
          documentation.
        </a>
        {` Comes with hooks (wagmi)`}
      </h5>

      <h5>
        {`But if you want to customize the chainID and available extensions you need to use `}
        <a href="https://www.npmjs.com/package/@walletconnect/sign-client" target="_blank" rel="noopener noreferrer">
          SignClient.
        </a>
      </h5>

      <h5>
        {`Optional: You might want to upgrade to Web3Wallet since SignClient is the old implementation. However, I couldn't make it work.`}
        <a
          href="https://docs.walletconnect.com/2.0/web/web3wallet/upgrade-guide#migrate-from-sign-client-to-web3wallet"
          target="_blank"
          rel="noopener noreferrer"
        >
          Migration Guide.
        </a>
      </h5>

      <pre>npm i @walletconnect/modal@latest</pre>
      <pre>npm i @walletconnect/core@latest</pre>
      <pre>npm i @walletconnect/sign-client@latest</pre>

      <h5>For typescript also run</h5>
      <pre>npm i @walletconnect/types</pre>

      <h5>In order to interact with Zenon SDK (znn.ts) you will also need ethers / ethers-ts</h5>
      <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
        <pre>npm i ethers</pre>
        <h5>or</h5>
        <pre>npm i ethers-ts</pre>
      </div>
      <h1>
        <Link to="/demo">Demo</Link>
      </h1>
    </header>
  );
}

export default HowTo;
