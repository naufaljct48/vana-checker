const fs = require('fs');
const bip39 = require('bip39');
const ethers = require('ethers');
const axios = require('axios');

class VanaAddressChecker {
    constructor() {
        this.vanascanApiBase = 'https://api.vanascan.io/api/v2/addresses';
        this.maxRetries = 3;
    }

    isValidSeedPhrase(seedPhrase) {
        try {
            // Remove extra whitespace and newlines
            const cleanedPhrase = seedPhrase.trim().replace(/\s+/g, ' ');
            return bip39.validateMnemonic(cleanedPhrase);
        } catch (error) {
            return false;
        }
    }

    getAddressFromSeed(seedPhrase) {
        try {
            // Remove extra whitespace and newlines
            const cleanedPhrase = seedPhrase.trim().replace(/\s+/g, ' ');
            
            // Generate seed from mnemonic
            const seed = bip39.mnemonicToSeedSync(cleanedPhrase);
            
            // Derive Ethereum wallet from seed
            const hdNode = ethers.HDNodeWallet.fromSeed(seed);
            const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
            
            return wallet.address;
        } catch (error) {
            console.error('Address derivation error:', error);
            return null;
        }
    }

    async checkAddressBalance(address) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const url = `${this.vanascanApiBase}/${address}`;
                const response = await axios.get(url);
                
                if (response.status === 200) {
                    const data = response.data;

                    // Tambahkan penanganan kasus "Not Found"
                    if (data.message === "Not found") {
                        return { 
                            hasBalance: false, 
                            balance: 0, 
                            rawData: data 
                        };
                    }

                    const coinBalance = parseInt(data.coin_balance || '0') / 1e18;
                    
                    return {
                        hasBalance: coinBalance > 0,
                        balance: coinBalance,
                        rawData: data
                    };
                } else {
                    // Tambahkan retry untuk error server
                    if (response.status >= 500) {
                        if (attempt < this.maxRetries) {
                            console.log(`Retry attempt ${attempt} for ${address}`);
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                            continue;
                        }
                    }
                    return { error: `API Error: ${response.status}` };
                }
            } catch (error) {
                // Tambahkan retry untuk error jaringan
                if (attempt < this.maxRetries) {
                    console.log(`Retry attempt ${attempt} for ${address}`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                return { error: error.message };
            }
        }
        return { error: 'Max retries reached' };
    }

    async processSeedPhrases(filename) {
        try {
            const fileContent = fs.readFileSync(filename, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            
            const results = [];
            
            for (const line of lines) {
                // Hapus newline dan whitespace tambahan
                const cleanedLine = line.trim().replace(/\s+/g, ' ');
                
                const address = this.getAddressFromSeed(cleanedLine);
                
                if (address) {
                    try {
                        const balanceInfo = await this.checkAddressBalance(address);
                        results.push({
                            seedPhrase: cleanedLine,
                            address: address,
                            isValidSeed: this.isValidSeedPhrase(cleanedLine),
                            ...balanceInfo
                        });
                    } catch (balanceError) {
                        results.push({
                            seedPhrase: cleanedLine,
                            address: address,
                            isValidSeed: this.isValidSeedPhrase(cleanedLine),
                            error: balanceError.message
                        });
                    }
                } else {
                    results.push({
                        seedPhrase: cleanedLine,
                        address: null,
                        isValidSeed: false,
                        error: 'Could not derive address'
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.error('File processing error:', error);
            return null;
        }
    }

    saveResults(results, outputFilename = 'vana_balance_check.txt') {
        if (!results || results.length === 0) {
            console.log('No results to save.');
            return;
        }
        
        const outputContent = [
            'Seed Phrase | Address | Balance | Status',
            '-'.repeat(70)
        ];
        
        results.forEach(result => {
            let status = result.isValidSeed ? 'Valid' : 'Invalid';
            const balance = result.balance || 0;
            const address = result.address || 'N/A';
            
            if (result.error) {
                status = `Error: ${result.error}`;
            } else if (result.rawData && result.rawData.message === "Not found") {
                status = 'Not Found';
            }
            
            outputContent.push(
                `${result.seedPhrase} | ${address} | ${balance.toFixed(8)} VANA | ${status}`
            );
        });
        
        fs.writeFileSync(outputFilename, outputContent.join('\n'), 'utf8');
        console.log(`Results saved to ${outputFilename}`);
    }
}

async function main() {
    const checker = new VanaAddressChecker();
    const results = await checker.processSeedPhrases('phrase.txt');
    
    if (results) {
        checker.saveResults(results);
        
        const validAddresses = results.filter(r => r.address && r.isValidSeed);
        const addressesWithBalance = results.filter(r => r.hasBalance);
        
        console.log(`\nTotal seed phrases: ${results.length}`);
        console.log(`Valid seed phrases: ${results.filter(r => r.isValidSeed).length}`);
        console.log(`Derived addresses: ${validAddresses.length}`);
        console.log(`Addresses with balance: ${addressesWithBalance.length}`);
    }
}

main().catch(console.error);