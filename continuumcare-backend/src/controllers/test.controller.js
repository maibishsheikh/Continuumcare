const mongoose = require("mongoose");

exports.testWrite = async (req, res) => {
  try {
    const dbConnection = mongoose.connection.db;
    
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "MongoDB not connected",
      });
    }

    // Test write to a test collection
    const testCollection = dbConnection.collection("test");
    const result = await testCollection.insertOne({
      message: "MongoDB connected successfully",
      createdAt: new Date(),
    });

    res.json({
      success: true,
      docId: result.insertedId,
      message: "MongoDB connection test passed",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
