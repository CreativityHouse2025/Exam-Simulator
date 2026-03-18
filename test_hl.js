import axios from "axios";
import 'dotenv/config'


const HL_TOKEN = process.env.HIGHLEVEL_TOKEN
const HIGHLEVEL_SUBACCOUNT_LOCATION_ID = process.env.HIGHLEVEL_SUBACCOUNT_LOCATION_ID

let data = JSON.stringify({
  "locationId": HIGHLEVEL_SUBACCOUNT_LOCATION_ID,
  "pageLimit": 2,
  "query": "Omar Saeed"
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://services.leadconnectorhq.com/contacts/search',
  headers: { 
    'Content-Type': 'application/json', 
    'Authorization': 'Bearer ' + HL_TOKEN,
    'Version': '2021-07-28'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});