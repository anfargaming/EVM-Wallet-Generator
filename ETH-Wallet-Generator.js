import { ethers } from "ethers";
import fs from "fs/promises";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import inquirer from "inquirer";

// Enhanced Logger with Colors
const log = {
  info: (...args) => console.log(chalk.blueBright("[INFO]"), ...args),
  success: (...args) => console.log(chalk.greenBright("[SUCCESS]"), ...args),
  error: (...args) => console.log(chalk.redBright("[ERROR]"), ...args),
  warn: (...args) => console.log(chalk.yellowBright("[WARNING]"), ...args),
};

// File Paths
const FILES = {
  ADDRESSES: "wallet_addresses.txt",
  PRIVATE_KEYS: "wallet_private_keys.txt",
  MNEMONIC: "wallet_mnemonic.txt",
  DETAILS: "wallet_details.txt",
  SERIALIZED_ADDRESSES: "wallet_serial_addresses.txt",
  SERIALIZED_PRIVATE_KEYS: "wallet_serial_private_keys.txt",
  SERIALIZED_MNEMONIC: "wallet_serial_mnemonic.txt",
};

// Show Welcome Banner
function showBanner() {
  console.log(chalk.magentaBright(figlet.textSync("EVM Wallets", { horizontalLayout: "full" })));
  console.log(chalk.cyanBright("🚀 Supports ALL EVM-Compatible Blockchains 🚀"));
  console.log(chalk.yellowBright("💳 Works with MetaMask, Trust Wallet, OKX Wallet, and more! 💳\n"));
}

// Get User Input for Number of Wallets
async function getUserInput() {
  const { walletCount } = await inquirer.prompt([
    {
      type: "input",
      name: "walletCount",
      message: "🔢 Enter number of wallets to generate:",
      validate: (value) => (value.match(/^\d+$/) ? true : "Please enter a valid number."),
    },
  ]);
  return parseInt(walletCount);
}

// Ask User for Output Preferences (Supports Multiple Selections)
async function getOutputPreferences() {
  console.log(chalk.magentaBright("\n📂 Select the wallet data you want to export:"));
  console.log(chalk.cyan("1. Wallet Addresses Only"));
  console.log(chalk.cyan("2. Wallet Private Keys Only"));
  console.log(chalk.cyan("3. Wallet Mnemonic Only"));
  console.log(chalk.cyan("4. All Wallet Details (With Serial Number)"));
  console.log(chalk.cyan("5. All Wallet Addresses (With Serial Number)"));
  console.log(chalk.cyan("6. All Wallet Private Keys (With Serial Number)"));
  console.log(chalk.cyan("7. All Wallet Mnemonics (With Serial Number)"));

  const { outputSelection } = await inquirer.prompt([
    {
      type: "input",
      name: "outputSelection",
      message: "📌 Enter the number(s) separated by commas (e.g., 1,3,5):",
      validate: (input) => input.match(/^([1-7],?)+$/) ? true : "Invalid input! Enter numbers separated by commas.",
    },
  ]);

  const selectedOptions = outputSelection.split(",").map(Number);
  
  // Map user selections to actual options
  const optionsMap = {
    1: "ADDRESSES",
    2: "PRIVATE_KEYS",
    3: "MNEMONIC",
    4: "DETAILS",
    5: "SERIALIZED_ADDRESSES",
    6: "SERIALIZED_PRIVATE_KEYS",
    7: "SERIALIZED_MNEMONIC",
  };

  return selectedOptions.map(num => optionsMap[num]).filter(Boolean);
}

// Secure File Writer
async function saveToFile(filePath, data) {
  try {
    await fs.appendFile(filePath, data + "\n");
  } catch (error) {
    log.error(`⚠️ Failed to save data to ${filePath}:`, error.message);
  }
}

// Wallet Generator Function
function createNewWallet(index) {
  const wallet = ethers.Wallet.createRandom();
  return {
    index: index + 1,
    address: wallet.address,
    mnemonic: wallet.mnemonic.phrase,
    privateKey: wallet.privateKey,
  };
}

// Main Function
async function main() {
  showBanner();
  log.info("🔐 Secure EVM Wallet Generator Initialized...");

  // Clear previous files
  for (let key in FILES) {
    await fs.writeFile(FILES[key], "");
  }

  const walletCount = await getUserInput();
  const outputOptions = await getOutputPreferences();

  log.info(`📜 Generating ${walletCount} wallets...`);
  const spinner = ora({ text: "🔄 Generating wallets...", color: "cyan" }).start();

  let walletData = [];
  for (let i = 0; i < walletCount; i++) {
    const wallet = createNewWallet(i);

    if (outputOptions.includes("ADDRESSES")) await saveToFile(FILES.ADDRESSES, wallet.address);
    if (outputOptions.includes("PRIVATE_KEYS")) await saveToFile(FILES.PRIVATE_KEYS, wallet.privateKey);
    if (outputOptions.includes("MNEMONIC")) await saveToFile(FILES.MNEMONIC, wallet.mnemonic);
    if (outputOptions.includes("DETAILS"))
      await saveToFile(
        FILES.DETAILS,
        `${wallet.index}. Wallet ${wallet.index}\nWallet Address: ${wallet.address}\nMnemonic Phrase: ${wallet.mnemonic}\nPrivate Key: ${wallet.privateKey}\n`
      );
    if (outputOptions.includes("SERIALIZED_ADDRESSES")) await saveToFile(FILES.SERIALIZED_ADDRESSES, `${wallet.index}. ${wallet.address}`);
    if (outputOptions.includes("SERIALIZED_PRIVATE_KEYS")) await saveToFile(FILES.SERIALIZED_PRIVATE_KEYS, `${wallet.index}. ${wallet.privateKey}`);
    if (outputOptions.includes("SERIALIZED_MNEMONIC")) await saveToFile(FILES.SERIALIZED_MNEMONIC, `${wallet.index}. ${wallet.mnemonic}`);

    walletData.push({
      "#": wallet.index,
      "Wallet Address": wallet.address.substring(0, 10) + "...",
      "Private Key": wallet.privateKey.substring(0, 10) + "...",
    });
  }
  spinner.succeed("✅ Wallets generated successfully!");

  console.log(chalk.magentaBright("\n📊 Wallet Summary:"));
  console.table(walletData);

  console.log(chalk.greenBright("\n🎉 Wallets Generated Successfully!"));
  console.log(chalk.blueBright(`✔ Total wallets: ${walletCount}`));
  console.log(chalk.cyan("\n🌟 Thank you for using the EVM Wallet Generator! 🚀\n"));
}

// Run the Program
main();
