// @ts-nocheck
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  Button,
  Banner,
  FormLayout,
  TextField,
  Checkbox,
  Select,
  Spinner,
  FooterHelp,
  Link,
} from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getConfiguration, getOrCreateConfiguration } from "~/payments.repository";
import PaymentsAppsClient from "~/payments-apps.graphql";
import { ethers } from 'ethers'
import axios from 'axios'

/**
 * Loads the app's configuration if it exists.
*/
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const apiKey = process.env.SHOPIFY_API_KEY;

  const config = await getConfiguration(session.id);

  return json({ shopDomain: session.shop, apiKey: apiKey, config: config });
};

/**
 * Saves the app's configuration.
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const config = {
    shop: session.shop,
    accountName: formData.get("accountName"),
    ready: formData.get("ready") === "true",
    apiVersion: formData.get("apiVersion"),
  };
  const configuration = await getOrCreateConfiguration(session.id, config);
  console.log(configuration);
  const client = new PaymentsAppsClient(session.shop, session.accessToken);
  const response = await client.paymentsAppConfigure(configuration.accountName, configuration.ready);
  console.log("RESPONSE", response);
  const userErrors = response?.userErrors || [];

  if (userErrors.length > 0) return json({ errors: userErrors });
  return json({ raiseBanner: true, errors: userErrors });
}

export default function Index() {
  const nav = useNavigation();
  const { shopDomain, apiKey, config } = useLoaderData();
  const action = useActionData();

  const [accountName, setAccountName] = useState(config ? config.accountName : '');
  const [ready, setReady] = useState(config ? config.ready : false);
  const [apiVersion, setApiVersion] = useState(config ? config.ready : 'unstable');
  const [showBanner, setShowBanner] = useState(action ? action.raiseBanner : false);
  const [errors, setErrors] = useState([]);

  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const [amount, setAmount] = useState("1")

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";



  useEffect(() => {
    if (action?.raiseBanner) setShowBanner(true);
    if (action?.errors.length > 0) setErrors(action.errors);
  }, [action]);

  // useEffect(() => {
  //   const CallMeFirst = async () => {
  //     setAmount('1')
  //     console.log(amount);
  //   }
  //   CallMeFirst()
  // }, [])

  const apiCallForSetting = async () => {
    const api_call = await axios.get('/')
  }

  const errorBanner = () => (
    errors.length > 0 && (
      <Banner
        title={'😢 An error ocurred!'}
        status="critical"
        onDismiss={() => { setErrors([]) }}
      >
        {
          errors.map(({ message }, idx) => (
            <Text as="p" key={idx}>{message}</Text>
          ))
        }
      </Banner>
    )
  )

  const banner = () => (
    showBanner && (
      <Banner
        title={'🥰 Settings updated!'}
        action={{
          content: 'Return to Shopify',
          url: `https://${shopDomain}/services/payments_partners/gateways/${apiKey}/settings`,
        }}
        status="success"
        onDismiss={() => { setShowBanner(false) }}
      />)
  );

  const apiVersionOptions = [
    { value: 'unstable', label: 'unstable' },
    { value: '2022-01', label: '2022-01' },
    { value: '2022-04', label: '2022-04' },
    { value: '2022-07', label: '2022-07' },
    { value: '2022-09', label: '2022-09' },
    { value: '2023-01', label: '2023-01' },
    { value: '2023-04', label: '2023-04' },
    { value: '2023-07', label: '2023-07' },
    { value: '2023-09', label: '2023-09' },
  ];

  if (isLoading) {
    return (
      <Page fullWidth >
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
          <Spinner accessibilityLabel="Spinner" size="large" />
        </div>
      </Page>
    )
  }

  const handleWalletConnect = async () => {
    console.log("connecte request");
    try {
      // @ts-ignore
      const wallet = await window.ethereum.request({ method: "eth_requestAccounts" });
      const wallet_address = wallet[0]
      if (wallet_address.length > 0) {
        console.log(wallet);
        setWalletConnected(true)
        setWalletAddress(wallet_address)
      }
    } catch (error) {
      console.log(error);
    }
  }

  // const transactionFunction = async (_amount, _recieverAddress, _refundAddress) => {
  //   try {

  //     const provider = new ethers.providers.Web3Provider(window.ethereum)
  //     const signer = provider.getSigner()
  //     console.log(signer);

  //     const etherAmount = ethers.utils.parseEther(_amount);
  //     console.log(etherAmount);

  //     const LINK_AMOY = "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904"

  //     const tx = await signer.transfer(_recieverAddress, etherAmount)
  //     console.log("transaction", tx);
  //     const reciept = await tx.wait();
  //     console.log("reciept", reciept);

  //   } catch (error) {
  //     console.log(error);
  //   }

  // }

  // const check_chainID = async (_chainid) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const selected_chainID = await get_chainID();
  //       console.log("chain compare", selected_chainID, _chainid);
  //       if (_chainid === selected_chainID) {
  //         resolve(true)
  //       } else {
  //         resolve(false)
  //       }
  //     } catch (error) {
  //       reject("Something went wrong in chack_chainID", error)
  //       console.log("Something went wrong in chack_chainID");
  //     }
  //   })
  // }

  // const get_chainID = async () => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const chainID = await window.ethereum.request({ method: 'eth_chainId' })
  //       console.log("chainID", chainID);
  //       resolve(chainID.toString())
  //     } catch (error) {
  //       console.log("Error getting chainID", error);
  //       reject(undefined)
  //     }
  //   })
  // }

  // const request_change_chain = async (_token) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       await window.ethereum.request({
  //         method: 'wallet_switchEthereumChain',
  //         params: [{ chainId: token.chain_id }]  // ethereum main
  //       });
  //       resolve()
  //     } catch (error) {
  //       console.log(error);
  //       try {
  //         if (error.code === 4902) {
  //           await request_add_chain(_token);
  //           await handleSubmit();
  //         }
  //       } catch (error) {
  //         console.log(error);
  //         reject(error);
  //       }
  //     }

  //   })
  // }

  // const request_add_chain = async (_token) => {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const chainData = {
  //         chainId: _token.chain_id,
  //         chainName: _token.name,
  //         nativeCurrency: {
  //           name: _token.curruncy_name,
  //           symbol: _token.symbol,
  //           decimals: 18,
  //         },
  //         rpcUrls: [_token.RPC_URL],
  //         blockExplorerUrls: [_token.CHAIN_EXPLORER_URL],
  //       };

  //       await window.ethereum.request({
  //         method: 'wallet_addEthereumChain',
  //         params: [chainData],
  //       });
  //       console.log('Network added!');
  //       resolve()
  //     } catch (error) {
  //       console.log(error);
  //       reject(error)
  //     }
  //   })

  // }

  return (
    <Page>
      <BlockStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="5">
                <BlockStack gap="2">
                  <Card>
                    {walletConnected ? (
                      <Layout>
                        <Text as="h1">Wallet Connected : {walletAddress}</Text>

                      </Layout>
                    ) : (
                      <Text as="h2" variant="headingMd">
                        Connect you wallet
                        <Button type="button" onClick={handleWalletConnect}>Connect your wallet</Button>
                      </Text>
                    )}

                    <Form method="post">
                      {/* <FormLayout>
                        <TextField
                          label="Account Name"
                          name="accountName"
                          onChange={(change) => setAccountName(change)}
                          value={accountName}
                          autoComplete="off"
                        />
                        <Checkbox
                          label="Ready?"
                          name="ready"
                          checked={ready}
                          onChange={(change) => setReady(change)}
                          value={ready.toString()}
                        />
                        <Select
                          label="API Version"
                          name="apiVersion"
                          onChange={(change) => setApiVersion(change)}
                          options={apiVersionOptions}
                          value={apiVersion}
                        />
                        <Button submit>Submit</Button>
                      </FormLayout> */}
                    </Form>
                  </Card>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <FooterHelp>
          {/* <Text as="span">Learn more about </Text>
          <Link url="https://shopify.dev/docs/apps/payments" target="_blank">
            payments apps
          </Link> */}
        </FooterHelp>
      </BlockStack>
    </Page>
  );
}
