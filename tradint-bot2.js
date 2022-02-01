const ethers = require("ethers");
const express = require("express");
const chalk = require("chalk");
const dotenv = require("dotenv");
const fs = require("fs");
var player = require("play-sound")((opts = {}));
const axios = require("axios");
const cheerio = require("cheerio");
dotenv.config();

const data = {
  AMOUNT_OF_WAVAX: process.env.AMOUNT_OF_FTM, // how much you want to buy in FTM

  recipient: process.env.YOUR_ADDRESS, //your wallet address,
  mnemonic: process.env.MNEMONIC, //

  Slippage: process.env.SLIPPAGE, //in Percentage

  gasPrice: ethers.utils.parseUnits(`${process.env.GWEI}`, "gwei"), //in gwei

  gasLimit: process.env.GAS_LIMIT, //at least 21000

  minWAVAX: process.env.MIN_LIQUIDITY_ADDED, //min liquidity added

  minUSDC: process.env.MIN_LIQUIDITY_ADDED2,

  approveNum: ethers.utils.parseUnits(`${process.env.TO_APPROVE}`), //
};

const Dex = require("./JSON/dex.json");
const ABI20 = require("./JSON/erc20-ABI.json");
const wss =
  "wss://speedy-nodes-nyc.moralis.io/4e1189a754ae4f5201f35f92/fantom/mainnet/ws";
const provider = new ethers.providers.WebSocketProvider(wss);
const wallet = ethers.Wallet.fromMnemonic(data.mnemonic);
const account = wallet.connect(provider);

let amountReward = 0;

//ROCKET-FTM REWARD
const ContractAddress = "0x5de0F861dE5F8c39AFE13f8aa0462413b2fb3881";

//SROCKET
const rewardToken = "0x4D75593a945F828FB6A955F72F30C1645ebE3e29";

///JONES REWARD TO
//const ContractAddress = "0xd534bc696d708bd8e5f035e119d260d79c69f398";

//JONES
//const rewardToken = "0x01f793ec4db0ffaf350526ba7828d93c180dd97e";

const claimFromLp = async (ContractAddress) => {
  console.log(ContractAddress);
  const contractReward = new ethers.Contract(
    ContractAddress,
    ["function withdraw(uint256 _pid, uint256 _amount) public"],
    account
  );
  console.log("\n");
  console.log("Claiming ...");

  try {
    let txClaim = await contractReward.withdraw(0, 0, {
      gasLimit: 113412,
      gasPrice: ethers.utils.parseUnits("1000", "gwei"),
      nonce: null, //set you want buy at where position in blocks
    });

    const claiming = await txClaim.wait();
    console.log(
      `Transaction claiming: https://ftmscan.com/tx/${claiming.logs[1].transactionHash}`
    );
  } catch (error) {
    console.log(error);
  }
};

const findAmountReward = async (rewardToken) => {
  const ContractRewardToken = new ethers.Contract(rewardToken, ABI20, account);
  amountReward = await ContractRewardToken.balanceOf(account.address);
};
const sellingRewards = async (rewardToken) => {
  //Supposing it's TraderJoe
  const Router = new ethers.Contract(
    Dex["DEX"][1]["router"],
    [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
    ],
    account
  );

  console.log("\n");

  console.log("Selling ...");
  const FTM = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
  try {
    let txSell = await Router.swapExactTokensForETH(
      amountReward,
      0,
      [rewardToken, FTM],
      account.address,
      Date.now() + 1000 * 60 * 2, //5 minutes
      {
        gasLimit: 225738,
        gasPrice: ethers.utils.parseUnits("1000", "gwei"),
        nonce: null, //set you want buy at where position in blocks
      }
    );
    const selling = await txSell.wait();
    console.log(
      `Transaction selling: https://ftmscan.com/tx/${selling.logs[1].transactionHash}`
    );
  } catch (e) {
    console.log(e);
  }
};

async function fn60sec() {
  await claimFromLp(ContractAddress);
  await findAmountReward(rewardToken);
  await sellingRewards(rewardToken);
}
fn60sec();
setInterval(fn60sec, 5 * 60 * 1000);
