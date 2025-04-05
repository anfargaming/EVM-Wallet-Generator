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
  console.clear();
  console.log("\n" + chalk.magentaBright(figlet.textSync("EVM Wallets", { horizontalLayout: "full" })));
  console.log(chalk.cyanBright("\n🚀 Supports ALL EVM-Compatible Blockchains 🚀\n"));
  console.log(chalk.yellowBright("💳 Works with MetaMask, Trust Wallet, OKX Wallet, and more! 💳\n"));
}

async function getUserInput() {
  const { walletCount } = await inquirer.prompt([
    {
      type: "number",
      name: "walletCount",
      message: "🔢 Enter number of wallets to generate:",
      validate: (value) => value > 0 ? true : "Please enter a positive number.",
    },
  ]);
  return walletCount;
}

async function getOutputPreferences() {
  console.log(chalk.magentaBright("\n📂 Select the wallet data you want to export:\n"));
  console.log(chalk.bgRedBright.bold(" 0. 🛑 Exit 🛑 "));
  console.log(chalk.yellowBright(" 1. Wallet Addresses Only"));
  console.log(chalk.yellowBright(" 2. Wallet Private Keys Only"));
  console.log(chalk.yellowBright(" 3. Wallet Mnemonic Only"));
  console.log(chalk.greenBright(" 4. All Wallet Details (With Serial Number)"), chalk.redBright("(Recommended)"));
  console.log(chalk.cyanBright(" 5. All Wallet Addresses (With Serial Number)"));
  console.log(chalk.cyanBright(" 6. All Wallet Private Keys (With Serial Number)"));
  console.log(chalk.cyanBright(" 7. All Wallet Mnemonics (With Serial Number)\n"));

  const { outputSelection } = await inquirer.prompt([
    {
      type: "input",
      name: "outputSelection",
      message: "📌 Enter the number(s) separated by commas (e.g., 1,3,5):",
      validate: (input) => input.match(/^([0-7],?)+$/) ? true : "Invalid input! Enter numbers 0-7 separated by commas.",
    },
  ]);

  if (outputSelection.includes("0")) {
    log.info("Exiting...");
    process.exit(0);
  }

  return outputSelection.split(",").map(Number);
}

async function saveToFile(filePath, data) {
  try {
    // Only append if file exists, otherwise create with initial data
    try {
      await fs.access(filePath);
      await fs.appendFile(filePath, data + "\n");
    } catch {
      await fs.writeFile(filePath, data + "\n");
    }
    return true;
  } catch (error) {
    log.error(`⚠️ Failed to save data to ${filePath}:`, error.message);
    return false;
  }
}

function createNewWallet(index) {
  const wallet = ethers.Wallet.createRandom();
  return {
    index: index + 1,
    address: wallet.address,
    mnemonic: wallet.mnemonic?.phrase || "N/A",
    privateKey: wallet.privateKey,
  };
}

async function main() {
  try {
    showBanner();
    log.info("🔐 Secure EVM Wallet Generator Initialized...");
    
    const walletCount = await getUserInput();
    if (walletCount < 1) {
      log.warn("No wallets to generate. Exiting...");
      return;
    }

    const selectedOptions = await getOutputPreferences();
    
    const optionsMap = {
      1: { key: "ADDRESSES", data: (w) => w.address },
      2: { key: "PRIVATE_KEYS", data: (w) => w.privateKey },
      3: { key: "MNEMONIC", data: (w) => w.mnemonic },
      4: { key: "DETAILS", data: (w) => 
        `${w.index}. Wallet ${w.index}\n` +
        `Address: ${w.address}\n` +
        `Mnemonic: ${w.mnemonic}\n` +
        `Private Key: ${w.privateKey}\n` +
        "=".repeat(40) + "\n"
      },
      5: { key: "SERIALIZED_ADDRESSES", data: (w) => `${w.index}. ${w.address}` },
      6: { key: "SERIALIZED_PRIVATE_KEYS", data: (w) => `${w.index}. ${w.privateKey}` },
      7: { key: "SERIALIZED_MNEMONIC", data: (w) => `${w.index}. ${w.mnemonic}` },
    };

    log.info(`📜 Generating ${walletCount} wallets...\n`);
    const spinner = ora({ text: "🔄 Generating wallets...", color: "cyan" }).start();

    let walletData = [];
    let createdFiles = new Set();

    for (let i = 0; i < walletCount; i++) {
      const wallet = createNewWallet(i);

      for (const option of selectedOptions) {
        const config = optionsMap[option];
        if (config) {
          const filePath = FILES[config.key];
          const success = await saveToFile(filePath, config.data(wallet));
          if (success) createdFiles.add(filePath);
        }
      }

      walletData.push({
        "#": wallet.index,
        "Address": wallet.address,
        "Private Key": wallet.privateKey.substring(0, 10) + "...",
        "Mnemonic": wallet.mnemonic.split(" ").slice(0, 2).join(" ") + "...",
      });
    }

    spinner.succeed(`✅ Successfully generated ${walletCount} wallets!\n`);

    console.log(chalk.magentaBright("\n📊 Wallet Summary:"));
    console.table(walletData);

    if (createdFiles.size > 0) {
      console.log(chalk.greenBright("\n📁 Files Created:"));
      Array.from(createdFiles).forEach(file => {
        console.log(chalk.magentaBright(`✔ ${file}`));
      });
    } else {
      console.log(chalk.yellowBright("\nℹ️ No files were created (no output options selected)"));
    }

    console.log(chalk.yellowBright("\n⚠️ IMPORTANT: Backup your private keys and mnemonics securely!"));
    console.log(chalk.greenBright("\n🎉 Wallets Generated Successfully!"));
    console.log(chalk.magentaBright(`✔ Total wallets: ${walletCount}`));
    console.log(chalk.cyan("\n🌟 Thank you for using the EVM Wallet Generator! 🚀\n"));

  } catch (error) {
    log.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
