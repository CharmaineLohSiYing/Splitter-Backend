const router = require("express").Router();
const moment = require("moment");
let User = require("../models/user.model");
let Transaction = require("../models/transaction.model");
const Base64 = require("js-base64").Base64;
const fetch = require("node-fetch");
const qs = require("qs");

router.route("/:userId/:friendUserId").post((req, res) => {
  const userId = req.params.userId;
  const friendUserId = req.params.friendUserId;
  const amount = req.body.amount;

  const txn = new Transaction({
    amount,
    to: friendUserId,
    from: userId,
    date: new Date(),
  });

  txn
    .save()
    .then(() => res.status(200).end())
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.route("/").get(async (req, res) => {
  console.log("=================REDIRECTED=================")
  let access_token;
  let refresh_token;
  let party;
  let partyId;

  if (req.query.code) {
    let code = req.query.code;
    const redirect_uri = "http://localhost:5000/transaction";
    const grant_type = "token";
    const payload = `code=${code}&redirect_uri=${redirect_uri}&grant_type=${grant_type}`;
    const client_id = "b7c90959-ca6c-483c-9478-ce5c0e398b86";
    const client_secret = "b7a5c670-b5bc-45e8-90cf-130e13b8faa2";
    console.log("authorization code", code);

    fetch("https://www.dbs.com/sandbox/api/sg/v1/oauth/tokens", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Base64.encode(`${client_id}:${client_secret}`),
        "content-type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache",
      },
      body: qs.stringify({
        grant_type,
        redirect_uri,
        code,
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        access_token = data.access_token;
        refresh_token = data.refresh_token;
        party = data.party_id;
        partyId = await getPartyId(party, client_id, access_token)
        console.log('partyid', partyId)
        console.log('access_token', access_token)

        const {savingsAccounts, currentAccounts} = await getAccounts(partyId, client_id, access_token)
        const activeAccounts = []
        if (savingsAccounts){
          savingsAccounts.forEach(acc => {
            if (acc.status === '01'){
              activeAccounts.push(acc)
            }
          })
        }
        console.log(currentAccounts)
        if (currentAccounts){
          currentAccounts.forEach(acc => {
            if (acc.status === '01'){
              activeAccounts.push(acc)
            }
          })
        }

        if (activeAccounts.length === 0){
          return res.json('no active account')
        }
        console.log(activeAccounts)
        const accountId = activeAccounts[0].id
        console.log('accountid', accountId)
        const transfer = await makeTransfer(client_id, access_token, partyId, accountId, 'MSISDN', 'Mobile no.', '65998899758', 5)

        return res.json({ data: transfer});
      });
  } else {
    res.json({ token: req.query });
  }
});


const getPartyId = (party, clientId, accessToken) => {
  console.log('retrieving party id...')
  return new Promise((resolve, reject) => {
    fetch("https://www.dbs.com/sandbox/api/sg/v2/parties/" + party, {
      method: "GET",
        headers: {
          clientId,
          accessToken
        },
    })
    .then((response) => response.json())
    .then((data) => resolve(data.retailParty.partyId))
    .catch(err => reject(err))

  })
}

const getAccounts = (partyId, clientId, accessToken) => {
  console.log('retrieving accounts...')
  return new Promise((resolve, reject) => {
    fetch(`https://www.dbs.com/sandbox/api/sg/v1/parties/${partyId}/deposits`, {
      method: "GET",
        headers: {
          clientId,
          accessToken
        },
    })
    .then((response) => response.json())
    .then((data) => resolve(data))
    .catch(err => reject(err))

  })
  
}

const makeTransfer = (
  clientId,
  accessToken,
  partyId,
  debitAccountId,
  referenceType,
  referenceDesc,
  reference,
  amount
) => {
  console.log('making transfer...')
  const reqObject = 
  {fundTransferDetl: {
    partyId, 
    debitAccountId,
    payeeReference : {
      referenceType,
      referenceDesc,
      reference
    },
    amount
  }}

  return new Promise((resolve, reject) => {
    fetch(`https://www.dbs.com/sandbox/api/sg/v1/transfers/payNow`, {
      method: "POST",
        headers: {
          clientId,
          accessToken
        },
        body: reqObject
    })
    .then((response) => response.json())
    .then((data) => {resolve(data)})
    .catch(err => reject(err))

  })
};

module.exports = router;
