const axios = require("axios");

const ML_API_URL = "http://127.0.0.1:8000/predict-risk";

async function getRiskPrediction(payload) {
  const response = await axios.post(ML_API_URL, payload);
  return response.data;
}

module.exports = {
  getRiskPrediction
};
