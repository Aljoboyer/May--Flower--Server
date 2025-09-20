const mongoose = require("mongoose");

const connectDB = () => {
  const mongouri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.obwta.mongodb.net/FlowersShopDB?retryWrites=true&w=majority`;
  
  try {
       mongoose.connect( 
      mongouri,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        // version: ServerApiVersion.v1,
      },
      console.log("connected to database")
    );
  } catch (error) {
    console.log(error);
 
  }
};

module.exports = connectDB;