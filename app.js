import abi from "./abi.js";

const contractAddress = "0x1a07bAbf21c366737E8Decf1F9F17517cF0d4c57";

let accounts, web3, myContract;

const accountsList = document.querySelector(".accounts_list");
const balanceAccount = document.querySelector(".balance_account");
const currentAccount = document.querySelector(".current_account");

async function getAccounts() {
  web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:8545"));
  accounts = await web3.eth.getAccounts();

  for (let i = 0; i < accounts.length; i++) {
    let newOption = document.createElement("option");
    newOption.textContent = accounts[i];

    accountsList.append(newOption);
    currentAccount.textContent = accounts[0];

    const firstUser = await getBalance(accounts[0]);
    balanceAccount.textContent = `${firstUser} eth`;

    accountsList.addEventListener("click", async (event) => {
      currentAccount.textContent = event.target.value;

      balanceAccount.textContent = `${await getBalance(event.target.value)} eth`;
      await renderingTransfers(event.target.value);
    });
  }

  return accounts;
}

async function getBalance(account) {
  const balance = await web3.eth.getBalance(account);
  return balance;
}

async function createOffer() {
  const createOfferBTN = document.querySelector(".create_offer_btn");

  createOfferBTN.addEventListener("click", async () => {
    const somebodyAddress = document.querySelector(".somebody_address").value;
    const amount = document.querySelector(".amount").value;
    const secretKey = document.querySelector(".secret_key").value;

    const transfer = await myContract.methods
      .create_offer(somebodyAddress, secretKey)
      .send({
        from: currentAccount.textContent,
        value: web3.utils.toWei(amount, "ether"),
        gas: "6721965",
      });

    clearInputsCreateOffer();

    return transfer;
  });
}

async function renderingTransfers(selectedAccount) {
  const transactions = await myContract.methods.getTransfers().call();

  const transactionList = document.querySelector(".transactions_container");

  transactionList.innerHTML = "";

  for (const transaction of transactions) {
    if (!transaction.status) {
      continue;
    }

    if (selectedAccount === transaction.somebody) {
      const transactionItemDiv = document.createElement("div");
      const somebodyItem = document.createElement("p");
      const amountItem = document.createElement("p");
      const acceptOffer = document.createElement("button");
      const declineOffer = document.createElement("button");

      
      acceptOffer.textContent = "Accept";
      declineOffer.textContent = "Decline";
      
      transactionItemDiv.classList.add("transaction_container");
      acceptOffer.classList.add("accept_offer_btn");

      acceptOffer.id = `${transaction.transfer_id}`;

      somebodyItem.textContent = `Somebody: ${transaction.somebody}`;
      amountItem.textContent = `Amount: ${transaction.amount}`;

      transactionItemDiv.append(somebodyItem, amountItem, acceptOffer);
      transactionList.append(transactionItemDiv);
    }
  }

  acceptOffer();
}

async function acceptOffer() {
  const acceptOfferBtns = document.querySelectorAll(".accept_offer_btn");
  const transactions = await myContract.methods.getTransfers().call();

  for (const acceptOfferBtn of acceptOfferBtns) {
    acceptOfferBtn.addEventListener("click", async (event) => {
      const currentAccountValue = currentAccount.textContent;
      let secretTransferKey = prompt("Input secret key");

      secretTransferKey = web3.utils.sha3(secretTransferKey);

      if (currentAccountValue == transactions[event.target.id].somebody) {
        await myContract.methods
          .accept_offer(event.target.id, secretTransferKey)
          .send({
            from: currentAccountValue,
          });

        alert("Successfully get money");
        location.reload();
      }
    });
  }
}

async function main() {
  await getAccounts();
  myContract = new web3.eth.Contract(abi, contractAddress);
  await renderingTransfers(currentAccount.textContent);
  createOffer();

  const accList = document.querySelector(".accounts_list");
  accList.addEventListener("click", () => {
    acceptOffer();
  });
}

main();

function clearInputsCreateOffer() {
  document.querySelector(".somebody_address").value = "";
  document.querySelector(".amount").value = "";
  document.querySelector(".secret_key").value = "";
  location.reload();
}