import React, {useEffect, useState} from "react";
import {WalletConnectModal} from "@walletconnect/modal";
import {Core} from "@walletconnect/core";
import Client, {SignClient} from "@walletconnect/sign-client";

import {PairingTypes, SessionTypes} from "@walletconnect/types";
import {MobileWallet} from "@walletconnect/modal-core";
import "./wallet-connect.css";
import {Constants, Primitives} from "znn-ts-sdk";
import {ethers} from "ethers-ts";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import closeIcon from "./../icons/close.svg";
import refreshIcon from "./../icons/refresh.svg";
import backIcon from "./../icons/back.svg";
import {isMobileBrowser} from "../utils";
import logoIcon from "./../icons/logo.png";
import syriusLogo from "./../icons/syrius-logo-padded.svg";

function WalletConnect() {
  const projectId = "aab32a91d28dac99f7d99a9f1a4d8827";
  const zenonNamespace = {
    zenon: {
      id: "zenon",
      chains: ["zenon:1"],
      methods: ["znn_sign", "znn_info", "znn_send"],
      events: ["chainIdChange", "addressChange"],
    },
  };
  const themeVariables = {
    "--wcm-font-family": `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
    "--wcm-background-color": "#26BA3F",
    "--wcm-accent-color": "#67E646",
    "--wcm-button-border-radius	": "8px",
    "--wcm-wallet-icon-border-radius": "8px",
    "--wcm-secondary-button-border-radius": "8px",
  };
  const mobileWallets: MobileWallet[] | undefined = [
    {
      id: "syrius",
      name: "Syrius desktop",
      links: {
        native: "syrius:",
        universal: "syrius:",
      },
    },
  ];
  const desktopWallets: any = [
    {
      id: "syrius",
      name: "Syrius desktop",
      links: {
        native: "syrius:",
        universal: "syrius:",
      },
    },
  ];
  const walletImages = {
    syrius: syriusLogo,
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const openSafelyInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  const openSyrius = (uri?: string): void => {
    // Only open on desktop devices
    if (!isMobileBrowser()) {
      const base = "syrius://";
      const url = base + uri;

      // VULNERABILITY ALERT !
      //
      // Opening in new tab using just 'target='_blank' is a vulnerability
      // Fix it by doing this
      // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
      //
      // openSafelyInNewTab(url);

      // For this purpose we don't even need target _blank so we just use the default redirect
      // window.open(url, "noopener,noreferrer");
    }
  };

  const [signClientInstance, setSignClientInstance] = useState<Client | undefined>();
  const [currentSession, setCurrentSession] = useState<SessionTypes.Struct>();
  const [currentPairing, setCurrentPairing] = useState<PairingTypes.Struct>();

  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [nodeUrl, setNodeUrl] = useState<string>("");
  const [chainId, setChainId] = useState<number | undefined>();

  useEffect(() => {
    const refresh = () => {
      refreshSessionsAndPairings();
    };
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const refreshSessions = (signClient?: Client) => {
    let allSessions = [];
    if (signClient) {
      allSessions = signClient.find({
        requiredNamespaces: zenonNamespace,
      });
    } else {
      allSessions = JSON.parse(localStorage.getItem("wc@2:client:0.3//session") || "[]");
    }

    setSessions(allSessions);
    return allSessions;
  };

  const refreshPairings = (signClient?: Client) => {
    let allPairings = [];
    if (signClient) {
      allPairings = signClient.pairing.getAll();
    } else {
      allPairings = JSON.parse(localStorage.getItem("wc@2:client:0.3//pairing") || "[]");
    }

    setPairings(allPairings);
    return allPairings;
  };

  const refreshSessionsAndPairings = (signClient?: Client) => {
    refreshPairings(signClient);
    refreshSessions(signClient);
  };

  useEffect(() => {
    if ((currentPairing && currentSession && signClientInstance) || sessions?.length > 0 || pairings?.length > 0) {
      setIsWalletConnected(true);
    } else {
      setIsWalletConnected(false);
    }
  }, [currentPairing, currentSession, signClientInstance, sessions, pairings]);

  const init = async () => {
    console.log("logoIcon", logoIcon);

    const core = new Core({
      projectId: projectId,
    });

    const web3wallet = await SignClient.init({
      core, // <- pass the shared `core` instance
      metadata: {
        name: document.title,
        description: (document.querySelector('meta[name="description"]') as any)?.content,
        url: window.location.host,
        icons: [window.location.origin + logoIcon],
      },
    });
    return web3wallet;

    // Old implementation
    //
    // const web3wallet = await Web3wallet.init({
    //   projectId: projectId,
    //   metadata: {
    //     name: document.title,
    //     description: (document.querySelector('meta[name="description"]') as any)?.content,
    //     url: window.location.host,
    //     icons: [window.location.origin + logoIcon],
    //   },
    // });
    // return web3wallet;
  };

  const connectAndGetPairingAndSession = async (web3wallet: Client) => {
    const wcModal: any = new WalletConnectModal({
      // walletConnectVersion: 2,
      projectId,
      chains: ["zenon:1"],
      themeVariables: themeVariables,
      themeMode: "light",
      mobileWallets: mobileWallets,
      walletImages: walletImages,
      desktopWallets: desktopWallets,
      explorerRecommendedWalletIds: "NONE",
      enableExplorer: false,
    });

    const latestPairing = getLatestActivePairing(web3wallet);
    //
    // First step is to find out if we are already paired with a Wallet
    //
    if (latestPairing) {
      //
      // If we are paired we search for an available session.
      // Sessions can expire and we need to make sure they are still available
      //
      const latestSession = getLatestActiveSession(web3wallet);
      if (latestSession) {
        //
        //  Old Pairing, Old Session
        //
        console.log("[CONNECTED] Found pairing and session. Already connected on ", latestPairing, latestSession);
        return {session: latestSession, pairing: latestPairing};
      } else {
        //
        //  Old Pairing, New Session
        //
        console.log("[CONNECTED] Creating new session on pairing", latestPairing);
        // openSyrius();
        await web3wallet.connect({
          pairingTopic: latestPairing.topic,
          requiredNamespaces: zenonNamespace,
        });
        // We usually got some errors if not adding the delay. Sessions were not updated as soon as the await finished
        await delay(5000);
        const newSession = getLatestActiveSession(web3wallet);
        console.log("[CONNECTED] New session", newSession);
        return {session: newSession, pairing: latestPairing};
      }
    } else {
      //
      // New Pairing, New Pairing
      //
      console.log("[CONNECTED] Creating new pairing and session");
      const {uri, approval} = await web3wallet.connect({
        requiredNamespaces: zenonNamespace,
      });
      console.log("Generated uri", uri);
      if (uri) {
        try {
          await wcModal.openModal({uri});
          // openSyrius(uri);
          //
          // await approval() opens the confirmation dialog on the SyriusWallet desktop app
          //
          const session = await approval();
          console.log("[CONNECTED] Session", session);
          wcModal.closeModal();
          //
          // We usually got some errors if not adding the delay.
          // The new pairings was not in the list as soon as the await finished
          //
          await delay(5000);
          const newPairing = getLatestActivePairing(web3wallet);
          console.log("[CONNECTED] newPairing", newPairing);
          return {session: session, pairing: newPairing};
        } catch (err) {
          console.error("Error approving", err);
          throw err;
        }
      } else {
        throw Error("Couldn't generate URI on new session or topic");
      }
    }
  };

  const getLatestActivePairing = (web3wallet: Client) => {
    const allPairings = web3wallet.pairing.getAll();
    console.log("allPairings", allPairings);

    //
    // We filter out the sessions that are not active
    //
    const activePairings = allPairings.filter((p) => p.active);
    console.log("activePairings", activePairings);

    const latestPairingIndex = activePairings.length - 1;
    const latestPairing = activePairings[latestPairingIndex];
    console.log("latestPairing", latestPairing);

    return latestPairing;
  };

  const getLatestActiveSession = (web3wallet: Client) => {
    const filteredSessions = web3wallet.find({
      requiredNamespaces: zenonNamespace,
    });

    //
    // We filter out the sessions that expired
    //
    const activeSessions = filteredSessions.filter((s) => s.expiry > Date.now() / 1000);
    console.log("activeSessions", activeSessions);

    const latestSessionIndex = activeSessions.length - 1;
    const latestSession = activeSessions[latestSessionIndex];
    console.log("latestSession", latestSession);

    return latestSession;
  };

  const getInfo = async (signClient: Client, session: SessionTypes.Struct) => {
    try {
      console.log("getInfo, signClient, session", signClient, session);
      //
      // Opening the wallet app again is optional.
      //
      // openSyrius();
      type getInfoType = {
        address: string;
        chainId: number;
        nodeUrl: string;
      };

      const result: getInfoType = await signClient.request({
        topic: session.topic,
        chainId: "zenon:1",
        request: {
          method: "znn_info",
          params: undefined,
        },
      });
      console.log("znn_info res", result);

      return result;
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);

      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
      throw err;
    }
  };

  const signTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
    try {
      console.log("signTransaction - params", params);
      //
      // Opening the wallet app again is optional.
      //
      // openSyrius();
      const signature = await signClient.request({
        topic: session.topic,
        chainId: "zenon:1",
        request: {
          method: "znn_sign",
          params: JSON.stringify(params.accountBlock),
        },
      });

      console.log("znn_sign result", signature);

      return signature;
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
      throw err;
    }
  };

  const sendTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
    try {
      console.log("sendTransaction - params", params);
      //
      // Opening the wallet app again is optional.
      //
      // openSyrius();
      const result = await signClient.request({
        topic: session.topic,
        chainId: "zenon:1",
        request: {
          method: "znn_send",
          params: {
            fromAddress: params.fromAddress,
            accountBlock: params.accountBlock,
          },
        },
      });
      console.log("znn_send result", result);

      const accountBlock = Primitives.AccountBlockTemplate.fromJson(result || "{}");

      console.log("sendTransaction - accountBlock", accountBlock);
      return accountBlock;
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
      throw err;
    }
  };

  const disconnectSession = async (
    signClient: Client,
    session: SessionTypes.Struct,
    reasonMessage?: string,
    reasonData?: string
  ) => {
    try {
      console.log("Disconnecting, ", signClient, session);
      if (session.topic === currentSession?.topic) {
        setCurrentSession(undefined);
      }
      await signClient.session.delete(session.topic, {
        code: 1,
        message: reasonMessage || "Default Message",
        data: reasonData || "Default Data",
      });
      refreshSessions(signClient);
      return true;
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const disconnectPairing = async (
    signClient: Client,
    pairing: PairingTypes.Struct,
    reasonMessage?: string,
    reasonData?: string
  ) => {
    try {
      console.log("Disconnecting, ", signClient, pairing);
      // Not sure which of these work.
      // ToDo: Test them both and see which works and implement in disconnectAllPairings
      //
      if (pairing.topic === currentPairing?.topic) {
        setCurrentPairing(undefined);
      }
      await signClient.core.pairing.disconnect({topic: pairing.topic});
      // await signClient.disconnect({
      //   topic: pairing.topic,
      //   reason: {
      //     code: 1,
      //     message: reasonMessage || "Default Message",
      //     data: reasonData || "Default Data",
      //   },
      // });
      console.log("localStorage", localStorage);
      refreshPairings(signClient);
      return true;
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const disconnectAllPairings = async (signClient: Client, reasonMessage?: string, reasonData?: string) => {
    console.log("Disconnecting all, ", signClient, reasonMessage);
    try {
      return Promise.all(
        signClient.pairing.getAll().map(async (pairing: any) => {
          // Not sure which of these work.
          // ToDo: Test them both and see which works and implement in disconnectPairing
          //
          // return signClient.core.pairing.disconnect({topic: pairing.topic});
          return signClient.disconnect({
            topic: pairing.topic,
            reason: {
              code: 1,
              message: reasonMessage || "Default Message",
              data: reasonData || "Default Data",
            },
          });
        })
      );
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const addressChanged = (newAddress: string) => {
    setConnectedAddress(newAddress);
  };

  const chainIdChanged = (newChainId: number) => {
    if (typeof newChainId == "string") {
      setChainId(parseInt(newChainId));
    }
    setChainId(newChainId);
  };

  const registerEvents = (
    signClient: Client,
    onAddressChange: (newAddress: string) => unknown,
    onChainIdChange: (newChainId: number) => unknown
  ) => {
    // Subscribe to events

    // Available events
    // type Event = "session_proposal" | "session_update" | "session_extend" | "session_ping" | "session_delete" | "session_expire" | "session_request" | "session_request_sent" | "session_event" | "proposal_expire";

    signClient.core.on("disconnect", (args: any) => {
      console.log(".on disconnect", args);
      // Sometimes the event arrives before the session deletion is propagated to the localstorage
      delay(5000);
      refreshSessionsAndPairings(signClient);
    });

    // signClient.core.relayer.on("onRelayDisconnected", (args: any) => {
    //   console.log(".on onRelayDisconnected", args);
    // });

    // signClient.on("session_proposal", (args: any) => {
    //   console.log(".on session_proposal (should only be listened by the wallet)", args);
    // });

    // signClient.on("session_update", (args: any) => {
    //   console.log(".on session_update (should only be listened by the wallet)", args);
    // });

    // signClient.on("session_extend", (args: any) => {
    //   console.log(".on session_extend", args);
    // });

    // signClient.on("session_ping", (args: any) => {
    //   console.log(".on session_ping", args);
    // });

    // signClient.on("session_expire", (args: any) => {
    //   console.log(".on session_expire", args);
    // });

    // signClient.on("session_request", (args: any) => {
    //   console.log(".on session_request", args);
    // });

    // signClient.on("session_request_sent", (args: any) => {
    //   console.log(".on session_request_sent", args);
    // });

    signClient.on("session_delete", (args) => {
      console.log(".on session_delete", args);
      // Sometimes the event arrives before the session deletion is propagated to the localstorage
      delay(5000);
      refreshSessions(signClient);
    });

    //
    // These events are sent by Syrius Wallet
    //
    signClient.on("session_event", (args: any) => {
      console.log(".on session_event", args?.params?.event);
      setEvents((events) => {
        return [...events, args?.params?.event];
      });

      switch (args?.params?.event?.name) {
        case "addressChange": {
          const newAddress = args?.params?.event?.data;
          console.log("addressChanged to", newAddress);
          onAddressChange(newAddress);
          break;
        }
        case "chainIdChange": {
          const newChainId = args?.params?.event?.data;
          console.log("chainIdChanged to", newChainId);
          onChainIdChange(newChainId);
          break;
        }
        default: {
          console.log("Unhandled znn_event triggered", args?.params?.event?.name);
          break;
        }
      }
    });

    signClient.on("proposal_expire", (args: any) => {
      // ToDo: Close and reopen the wcModal here
      console.log(".on proposal_expire", args);
    });
  };

  const triggerConnection = async () => {
    try {
      setIsLoading(true);
      const signClient = await init();
      const res = await connectAndGetPairingAndSession(signClient);

      setSignClientInstance(signClient);
      setCurrentPairing(res.pairing);
      setCurrentSession(res.session);
      registerEvents(signClient, addressChanged, chainIdChanged);

      refreshSessionsAndPairings(signClient);

      //
      // This is optional but most likely you will need the wallet info at this point
      // You can (also) do this at another time in the flow
      //
      const result = await getInfo(signClient, res.session);
      console.log("sendGetInfo result", result);

      setNodeUrl(result?.nodeUrl || "");
      setConnectedAddress(result?.address || "");
      setChainId(result?.chainId);

      console.log("res", res);
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendGetInfo = async (signClient: Client, session: SessionTypes.Struct) => {
    try {
      const result = await getInfo(signClient, session);
      console.log("sendGetInfo result", result);

      setNodeUrl(result?.nodeUrl || "");
      setConnectedAddress(result?.address || "");
      setChainId(result?.chainId);
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const sendDummyTransaction = async (signClient: Client, session: SessionTypes.Struct) => {
    try {
      //
      // This is the same address as the connected one
      // This creates a send transaction between same address
      //
      if (!connectedAddress) {
        throw "You must get wallet info first!";
      }
      const dummyAccountBlock = Primitives.AccountBlockTemplate.send(
        Primitives.Address.parse(connectedAddress),
        Constants.znnZts,
        // Having 8 decimals, this means 1 ZNN
        ethers.BigNumber.from("100000000")
      );

      console.log("chainId", chainId);
      if (chainId && parseFloat(chainId.toString())) {
        dummyAccountBlock.chainIdentifier = parseFloat(chainId.toString());
        console.log("dummyAccountBlock", dummyAccountBlock);
      }

      const dummyTransaction = {
        fromAddress: connectedAddress,
        accountBlock: dummyAccountBlock.toJson(),
      };

      const accountBlock = await sendTransaction(signClient!, session!, dummyTransaction);
      console.log("Account block", accountBlock);
      console.log("Account block", accountBlock?.toJson());

      toast(`Sent! AccountBlock: ${JSON.stringify(accountBlock?.toJson())}`, {
        position: "bottom-center",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "success",
        theme: "dark",
      });
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const signDummyTransaction = async (signClient: Client, session: SessionTypes.Struct) => {
    try {
      //
      // This is the same address as the connected one
      // This creates a send transaction between same address
      //
      if (!connectedAddress) {
        throw "You must get wallet info first!";
      }

      const dummyAccountBlock = Primitives.AccountBlockTemplate.send(
        Primitives.Address.parse(connectedAddress),
        Constants.znnZts,
        // Having 8 decimals, this means 1.1 ZNN
        ethers.BigNumber.from("110000000")
      );

      console.log("chainId", chainId);
      if (chainId && parseFloat(chainId.toString())) {
        dummyAccountBlock.chainIdentifier = parseFloat(chainId.toString());
        console.log("dummyAccountBlock", dummyAccountBlock);
      }

      const dummyTransaction = {
        fromAddress: connectedAddress,
        accountBlock: dummyAccountBlock.toJson(),
      };

      const signature = await signTransaction(signClient, session, dummyTransaction);
      console.log("signature", signature);

      toast(`Signed! Signature: ${signature}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "success",
        theme: "dark",
      });
    } catch (err: any) {
      console.error(err);
      const readableError = err?.message || JSON.stringify(err);
      toast(`Error: ${readableError}`, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  return (
    <div className="layout">
      <div className="back-link">
        <Link to={"/"} className="d-flex align-items-center">
          <img style={{marginRight: "0.5rem"}} src={backIcon} alt="back" height="18px"></img>
          {`Back to intro`}
        </Link>
      </div>
      <h1>Demo</h1>
      <div className="buttons">
        {!isWalletConnected ? (
          <div className="button" onClick={() => triggerConnection()}>
            WalletConnect
          </div>
        ) : (
          <></>
        )}
        {signClientInstance && currentSession && isWalletConnected ? (
          <>
            <div className="button" onClick={() => sendGetInfo(signClientInstance, currentSession)}>
              Get wallet info
            </div>
            <div className="button" onClick={() => sendDummyTransaction(signClientInstance, currentSession)}>
              Send transaction
            </div>
            <div className="button" onClick={() => signDummyTransaction(signClientInstance, currentSession)}>
              Sign transaction
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
      {isLoading ? <div style={{marginTop: "1rem"}}>Loading...</div> : <></>}
      {isWalletConnected && signClientInstance ? (
        <div>
          <div className="wallet-details-container">
            <h4>Wallet details</h4>
            <div className="wallet-details">
              <div>
                <span className="text-gray">{`Address: `}</span>
                <span>{connectedAddress}</span>
              </div>
              <div>
                <span className="text-gray">{`Node URL: `}</span>
                <span>{nodeUrl}</span>
              </div>
              <div>
                <span className="text-gray">{`Chain ID: `}</span>
                <span>{chainId}</span>
              </div>
            </div>
          </div>
          <div className="connection-details">
            <div className="connections">
              <div className="sessions">
                <div className="d-flex justify-content-center align-items-center p-relative">
                  <div className="refresh-button" onClick={() => refreshSessions(signClientInstance)}>
                    <img src={refreshIcon} alt="refresh" />
                  </div>
                  <h4 className="sticky">Sessions</h4>
                </div>
                {sessions.map((session, index) => {
                  return (
                    <div
                      key={`session-${index}`}
                      className={`item session-item ${session.topic === currentSession?.topic ? "active-item" : ""}`}
                    >
                      <div>{`Acknowledged: ${session.acknowledged}`}</div>
                      <div>{`Topic: ${session.topic}`}</div>
                      <div
                        className="disconnect-button"
                        onClick={() => disconnectSession(signClientInstance!, session, "Reason message", "Reason data")}
                      >
                        X
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pairings">
                <div className="d-flex justify-content-center align-items-center p-relative">
                  <div className="refresh-button" onClick={() => refreshPairings(signClientInstance)}>
                    <img src={refreshIcon} alt="refresh" />
                  </div>
                  <h4 className="sticky">Pairings</h4>
                </div>
                {pairings.map((pairing, index) => {
                  return (
                    <div
                      key={`pairing-${index}`}
                      className={`item pairing-item ${pairing.topic === currentPairing?.topic ? "active-item" : ""}`}
                    >
                      <div>{`Active: ${pairing.active}`}</div>
                      <div>{`Topic ${pairing.topic}`}</div>
                      <div
                        className="disconnect-button"
                        onClick={() => disconnectPairing(signClientInstance!, pairing, "Reason message", "Reason data")}
                      >
                        X
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="events">
              <h4 className="sticky">Events</h4>
              {(events || []).reverse().map((event, index) => {
                return (
                  <div key={`event-${index}`} className="item event-item">
                    <div>{`Name: ${event.name}`}</div>
                    <div>{`Data: ${JSON.stringify(event.data || {})}`}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : !isLoading ? (
        <div style={{marginTop: "1rem"}}>Connection not initialized</div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default WalletConnect;
