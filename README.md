# Vana Address Checker

## Overview
![image](https://github.com/user-attachments/assets/ee3c108d-ba55-471d-b668-ad515435ce6c)

This Node.js script is designed to check the balance of Ethereum addresses derived from BIP39 seed phrases specifically for the Vana blockchain. It provides functionality to:

- Validate seed phrases
- Derive Ethereum addresses from seed phrases
- Check address balances using the Vanascan API
- Save results to a file

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)

## Dependencies

- `bip39`: For seed phrase validation and seed generation
- `ethers`: For Ethereum wallet derivation
- `axios`: For making API requests

## Installation

1. Clone the repository:
```bash
git clone https://github.com/naufaljct48/vana-checker.git
cd vana-checker
```

2. Install dependencies:
```bash
npm install bip39 ethers axios
```

## Usage

1. Prepare a `phrase.txt` file with seed phrases (one per line)

2. Run the script:
```bash
node index.js
```

## Features

- Validates seed phrases
- Derives Ethereum addresses
- Checks address balances on Vana network
- Retry mechanism for API requests
- Generates a detailed output file

## Output

The script generates a `vana_balance_check.txt` with the following information:

### Output Format
```
Seed Phrase | Address | Balance | Status
------------------------------------------------------------
twelve word seed phrase here | 0x1234...5678 | 100.00000000 VANA | Valid
another twelve word seed phrase | N/A | 0.00000000 VANA | Invalid Seed
third seed phrase | 0x9876...5432 | 0.00000000 VANA | 404 Not Found
```

### Column Details
- **Seed Phrase**: The original 12-word seed phrase
- **Address**: Derived Ethereum address (if valid)
- **Balance**: VANA token balance (in VANA)
- **Status**: 
  - `Valid`: Seed phrase is valid and an address was derived
  - `Invalid Seed`: Seed phrase failed validation
  - `Not Found`: Address exists but no balance data
  - `Error`: API or network issues occurred

## Error Handling

- Handles invalid seed phrases
- Manages API request failures with retry mechanism
- Provides detailed error logging

## Limitations

- Requires internet connection
- Depends on Vanascan API availability
- Currently checks only the first derived address path

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Disclaimer

This script is provided as-is. Always review and test thoroughly before using with sensitive seed phrases.
