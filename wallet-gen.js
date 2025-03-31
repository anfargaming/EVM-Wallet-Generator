import { ethers } from "ethers";
import fs from "fs/promises";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import inquirer from "inquirer";

const log = {
  info: (...args) => console.log("\n" + chalk.blueBright("[INFO]"), ...args, "\n"),
  success: (...args) => console.log("\n" + chalk.greenBright("[SUCCESS]"), ...args, "\n"),
  error: (...args) => console.log("\n" + chalk.redBright("[ERROR]"), ...args, "\n"),
  warn: (...args) => console.log("\n" + chalk.yellowBright("[WARNING]"), ...args, "\n"),
};

const FILES = {
  ADDRESSES: "wallet_addresses.txt",
  PRIVATE_KEYS: "wallet_private_keys.txt",
  MNEMONIC: "wallet_mnemonic.txt",
  DETAILS: "wallet_details.txt",
  SERIALIZED_ADDRESSES: "wallet_serial_addresses.txt",
  SERIALIZED_PRIVATE_KEYS: "wallet_serial_private_keys.txt",
  SERIALIZED_MNEMONIC: "wallet_serial_mnemonic.txt",
};

function showBanner() {
  console.log("\n" + chalk.magentaBright(figlet.textSync("EVM Wallets", { horizontalLayout: "full" })));
  console.log(chalk.cyanBright("\n🚀 Supports ALL EVM-Compatible Blockchains 🚀\n"));
  console.log(chalk.yellowBright("💳 Works with MetaMask, Trust Wallet, OKX Wallet, and more! 💳\n"));
}

async function getUserInput() {
  console.log("");
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

async function getOutputPreferences() {
  console.log("");
  console.log(chalk.magentaBright("\n📂 Select the wallet data you want to export:\n"));
  console.log(chalk.bgRedBright.bold("0. 🛑 Exit 🛑 "));
  console.log(chalk.blueBright("1. Wallet Addresses Only"));
  console.log(chalk.blueBright("2. Wallet Private Keys Only"));
  console.log(chalk.blueBright("3. Wallet Mnemonic Only"));
  console.log(chalk.greenBright("4. All Wallet Details (With Serial Number)"), chalk.greenBright("(Recommended)"));
  console.log(chalk.cyanBright("5. All Wallet Addresses (With Serial Number)"));
  console.log(chalk.cyanBright("6. All Wallet Private Keys (With Serial Number)"));
  console.log(chalk.cyanBright("7. All Wallet Mnemonics (With Serial Number)\n"));

  const { outputSelection } = await inquirer.prompt([
    {
      type: "input",
      name: "outputSelection",
      message: "📌 Enter the number(s) separated by commas (e.g., 1,3,5):",
      validate: (input) => input.match(/^([0-7],?)+$/) ? true : "Invalid input! Enter numbers separated by commas.",
    },
  ]);

  console.log("");
  if (outputSelection.includes("0")) {
    log.info("Exiting...");
    process.exit(0);
  }

  return outputSelection.split(",").map(Number);
}

async function saveToFile(filePath, data, createdFiles) {
  try {
    await fs.appendFile(filePath, data + "\n");
    createdFiles.add(filePath);
  } catch (error) {
    log.error(`⚠️ Failed to save data to ${filePath}:`, error.message);
  }
}

function createNewWallet(index) {
  const wallet = ethers.Wallet.createRandom();
  return {
    index: index + 1,
    address: wallet.address,
    mnemonic: wallet.mnemonic.phrase,
    privateKey: wallet.privateKey,
  };
}

async function main() {
  showBanner();
  log.info("🔐 Secure EVM Wallet Generator Initialized...");
  
  const walletCount = await getUserInput();
  const selectedOptions = await getOutputPreferences();
  const optionsMap = {
    1: "ADDRESSES",
    2: "PRIVATE_KEYS",
    3: "MNEMONIC",
    4: "DETAILS",
    5: "SERIALIZED_ADDRESSES",
    6: "SERIALIZED_PRIVATE_KEYS",
    7: "SERIALIZED_MNEMONIC",
  };

  log.info(`📜 Generating ${walletCount} wallets...\n`);
  const spinner = ora({ text: "🔄 Generating wallets...", color: "cyan" }).start();

  let walletData = [];
  let createdFiles = new Set();

  for (let i = 0; i < walletCount; i++) {
    const wallet = createNewWallet(i);

    for (const option of selectedOptions) {
      const fileKey = optionsMap[option];
      if (fileKey) {
        await saveToFile(FILES[fileKey], `${wallet.index}. ${wallet[fileKey.toLowerCase()]}`, createdFiles);
      }
    }

    walletData.push({
      "#": wallet.index,
      "Wallet Address": wallet.address.substring(0, 10) + "...",
      "Private Key": wallet.privateKey.substring(0, 10) + "...",
    });
  }
  spinner.succeed("✅ Wallets generated successfully!\n");

  console.log(chalk.magentaBright("\n📊 Wallet Summary:"));
  console.table(walletData);

  if (createdFiles.size > 0) {
    console.log(chalk.greenBright("\n📁 Files Created:"));
    for (const file of createdFiles) {
      console.log(chalk.green(`✔ ${file}`));
    }
  }

  console.log(chalk.greenBright("\n🎉 Wallets Generated Successfully!"));
  console.log(chalk.blueBright(`✔ Total wallets: ${walletCount}`));
  console.log(chalk.cyan("\n🌟 Thank you for using the EVM Wallet Generator! 🚀\n"));
}

main();
